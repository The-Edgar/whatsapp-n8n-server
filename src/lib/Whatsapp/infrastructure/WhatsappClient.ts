import { execSync } from "node:child_process";
import qrcode from "qrcode-terminal";
import type { Client as WhatsAppWebClient } from "whatsapp-web.js";
import pkg from "whatsapp-web.js";
import { WhatsappClientIsNotReadyError } from "@/lib/Whatsapp/domain/exceptions/WhatsappClientIsNotReadyError";

const { Client, LocalAuth } = pkg;

let client: WhatsAppWebClient;
let isReady = false;
let initializationPromise: Promise<void> | null = null;
let currentQrCode: string | null = null;
let connectionStatus:
  | "initializing"
  | "qr"
  | "authenticating"
  | "ready"
  | "disconnected" = "disconnected";

// Cleanup handler for process termination
const cleanup = async () => {
  if (client) {
    console.log("[WhatsAppClient] Cleaning up client...");
    try {
      await client.destroy();
      console.log("[WhatsAppClient] Client destroyed successfully");
    } catch (error) {
      console.error("[WhatsAppClient] Error during cleanup:", error);
    }
  }
};

// Register cleanup handlers
process.on("SIGINT", async () => {
  await cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(0);
});

process.on("exit", () => {
  console.log("[WhatsAppClient] Process exiting...");
});

// Kill any zombie Chromium processes from previous runs
const killZombieChromiumProcesses = () => {
  try {
    console.log("[WhatsAppClient] Checking for zombie Chromium processes...");

    // Platform-specific process killing
    const platform = process.platform;

    if (platform === "darwin" || platform === "linux") {
      // Find processes that match our specific user-data-dir path
      const userDataDir = ".wwebjs_auth/session-whatsapp-n8n-server";
      const grepPattern = `${userDataDir}.*Chromium`;

      try {
        // Get PIDs of zombie Chromium processes
        const pidsOutput = execSync(
          `ps aux | grep -E '${grepPattern}' | grep -v grep | awk '{print $2}'`,
          { encoding: "utf8" }
        ).trim();

        if (pidsOutput) {
          const pids = pidsOutput.split("\n").filter(pid => pid.trim());

          if (pids.length > 0) {
            console.log(`[WhatsAppClient] Found ${pids.length} zombie Chromium process(es): ${pids.join(", ")}`);

            // Kill each process
            for (const pid of pids) {
              try {
                execSync(`kill -9 ${pid}`, { encoding: "utf8" });
                console.log(`[WhatsAppClient] Killed zombie process ${pid}`);
              } catch (killError) {
                console.warn(`[WhatsAppClient] Failed to kill process ${pid}:`, killError);
              }
            }
          } else {
            console.log("[WhatsAppClient] No zombie Chromium processes found");
          }
        } else {
          console.log("[WhatsAppClient] No zombie Chromium processes found");
        }
      } catch (grepError) {
        // grep returns non-zero exit code when no matches found - this is OK
        console.log("[WhatsAppClient] No zombie Chromium processes found");
      }
    } else if (platform === "win32") {
      // Windows: use taskkill
      try {
        execSync(
          `taskkill /F /IM chrome.exe /FI "COMMANDLINE like %whatsapp-n8n-server%"`,
          { encoding: "utf8" }
        );
        console.log("[WhatsAppClient] Killed zombie Chromium processes on Windows");
      } catch (error) {
        // No processes found is OK
        console.log("[WhatsAppClient] No zombie Chromium processes found on Windows");
      }
    }
  } catch (error) {
    console.warn("[WhatsAppClient] Error during zombie process cleanup:", error);
    // Don't throw - this is a best-effort cleanup
  }
};

export const getWhatsAppClient = async (): Promise<
  InstanceType<typeof Client>
> => {
  console.log(
    `[WhatsAppClient] getWhatsAppClient called. Status: ${connectionStatus}, isReady: ${isReady}`,
  );

  if (!initializationPromise) {
    console.log("[WhatsAppClient] Creating new client instance...");

    // Clean up any zombie processes before starting
    killZombieChromiumProcesses();

    initializationPromise = new Promise<void>((resolve, reject) => {
      client = new Client({
        authStrategy: new LocalAuth({
          clientId: "whatsapp-n8n-server",
          dataPath: "./.wwebjs_auth",
        }),
        puppeteer: {
          headless: true, // Using built-in Puppeteer Chromium 107 which is compatible
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--single-process", // TEMPORARILY DISABLED - causes Chrome crash on Linux
            "--disable-gpu",
          ],
          timeout: 60000,
        },
      });

      client.on("qr", (qr) => {
        console.log("Scan the QR code to log in:");
        qrcode.generate(qr, { small: true });

        currentQrCode = qr;
        connectionStatus = "qr";
        console.log(
          `[WhatsAppClient] QR code generated. Status: ${connectionStatus}`,
        );
        console.log("[WhatsAppClient] WARNING: QR event fired even though session exists in .wwebjs_auth");
      });

      client.on("ready", () => {
        console.log("WhatsApp client is ready!");

        // Note: setBackgroundSync causes "ProtocolError: Target closed" with Puppeteer Chromium 107
        // and whatsapp-web.js 1.34.1. Disabled for stability.
        // try {
        //   client.setBackgroundSync(true);
        // } catch (syncError) {
        //   console.warn(
        //     "Failed to sync chat history: ",
        //     syncError instanceof Error ? syncError.message : String(syncError),
        //   );
        // }

        isReady = true;
        currentQrCode = null;
        connectionStatus = "ready";
        console.log(
          `[WhatsAppClient] Client ready! Status: ${connectionStatus}`,
        );

        resolve();
      });

      client.on("authenticated", () => {
        console.log("Client authenticated!");
        connectionStatus = "authenticating";
        console.log(
          `[WhatsAppClient] Authenticated. Status: ${connectionStatus}`,
        );
        console.log("[WhatsAppClient] Session found in .wwebjs_auth, proceeding with authentication...");
      });

      client.on("loading_screen", (percent, message) => {
        console.log(`[WhatsAppClient] Loading... ${percent}% - ${message}`);
      });

      client.on("disconnected", async (reason) => {
        console.log("Client was disconnected:", reason);
        isReady = false;
        currentQrCode = null;
        connectionStatus = "disconnected";
        initializationPromise = null;

        // Clean up the client instance
        try {
          await client.destroy();
        } catch (error) {
          console.error("[WhatsAppClient] Error destroying client on disconnect:", error);
        }

        reject(new Error(`Client disconnected: ${reason}`));
      });

      client.on("auth_failure", async (msg) => {
        console.error("Authentication failure:", msg);
        isReady = false;
        currentQrCode = null;
        connectionStatus = "disconnected";
        initializationPromise = null;

        // Clean up the client instance
        try {
          await client.destroy();
        } catch (error) {
          console.error("[WhatsAppClient] Error destroying client on auth failure:", error);
        }

        reject(new Error(`Authentication failed: ${msg}`));
      });

      // Handle browser/page crashes
      client.on("error", async (error) => {
        console.error("[WhatsAppClient] Client error:", error);
        isReady = false;
        connectionStatus = "disconnected";
        initializationPromise = null;

        // Clean up the client instance
        try {
          await client.destroy();
        } catch (destroyError) {
          console.error("[WhatsAppClient] Error destroying client on error:", destroyError);
        }

        reject(error);
      });

      // Handle incoming messages
      // Note: Message handler temporarily disabled to prevent Protocol errors during initialization
      // TODO: Re-enable once stable
      client.on("message", async (msg) => {
        try {
          // Filter out unwanted messages
          if (msg.fromMe) {
            console.log("[WhatsAppClient] Ignoring own message");
            return;
          }

          if (msg.isStatus) {
            console.log("[WhatsAppClient] Ignoring status update");
            return;
          }

          console.log(
            `[WhatsAppClient] Received message from ${msg.from}: ${msg.body}`,
          );

          // Lazy import to avoid circular dependency
          const { IncomingMessage } = await import(
            "@/lib/Whatsapp/domain/model/IncomingMessage"
          );
          const { createServicesContainer } = await import(
            "@/lib/Shared/infrastructure/services/createServicesContainer"
          );

          const services = createServicesContainer();

          const incomingMessage = new IncomingMessage(
            msg.id._serialized,
            msg.from,
            msg.body,
            msg.timestamp,
            msg.hasMedia,
            msg.from.includes("@g.us"), // Group chat detection
            msg.fromMe,
            msg.from,
          );

          // Fire and forget - don't await
          services.whatsapp.forwardIncomingMessage
            .execute(incomingMessage)
            .catch((error) => {
              console.error(
                "[WhatsAppClient] Error forwarding incoming message:",
                error,
              );
            });
        } catch (error) {
          console.error(
            "[WhatsAppClient] Error handling incoming message:",
            error,
          );
        }
      });

      console.log("[WhatsAppClient] Initializing client...");
      connectionStatus = "initializing";

      client.initialize()
        .then(() => {
          console.log("[WhatsAppClient] client.initialize() resolved successfully");
        })
        .catch(async (error) => {
          console.error("[WhatsAppClient] client.initialize() failed:", error);
          console.error("[WhatsAppClient] Error stack:", error.stack);
          isReady = false;
          connectionStatus = "disconnected";
          initializationPromise = null;

          // Clean up the client instance
          try {
            await client.destroy();
          } catch (destroyError) {
            console.error("[WhatsAppClient] Error destroying client on initialization failure:", destroyError);
          }

          reject(error);
        });
    });
  } else {
    console.log("[WhatsAppClient] Using existing initialization promise...");
  }

  console.log("[WhatsAppClient] Waiting for initialization to complete...");
  console.log(`[WhatsAppClient] Current status before await: ${connectionStatus}`);
  await initializationPromise;
  console.log("[WhatsAppClient] Initialization promise resolved!");
  console.log(`[WhatsAppClient] Final status after await: ${connectionStatus}, isReady: ${isReady}`);

  if (!isReady) {
    console.error(
      `[WhatsAppClient] Client not ready! Status: ${connectionStatus}`,
    );
    throw new WhatsappClientIsNotReadyError("WhatsApp client is not ready");
  }

  console.log("[WhatsAppClient] Returning ready client");
  return client;
};

export const getQrCode = (): string | null => {
  return currentQrCode;
};

export const getConnectionStatus = (): string => {
  return connectionStatus;
};

export const initializeClient = (): void => {
  if (!initializationPromise) getWhatsAppClient().catch(console.error);
};
