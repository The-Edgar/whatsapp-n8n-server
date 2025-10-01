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

export const getWhatsAppClient = async (): Promise<
  InstanceType<typeof Client>
> => {
  console.log(
    `[WhatsAppClient] getWhatsAppClient called. Status: ${connectionStatus}, isReady: ${isReady}`,
  );

  if (!initializationPromise) {
    console.log("[WhatsAppClient] Creating new client instance...");
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
            "--single-process",
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
      });

      client.on("ready", () => {
        console.log("WhatsApp client is ready!");

        try {
          client.setBackgroundSync(true);
        } catch (syncError) {
          console.warn(
            "Failed to sync chat history: ",
            syncError instanceof Error ? syncError.message : String(syncError),
          );
        }

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
        reject(new Error(`Client disconnected: ${reason}`));
      });

      client.on("auth_failure", (msg) => {
        console.error("Authentication failure:", msg);
        isReady = false;
        currentQrCode = null;
        connectionStatus = "disconnected";
        initializationPromise = null;
        reject(new Error(`Authentication failed: ${msg}`));
      });

      // Handle browser/page crashes
      client.on("error", (error) => {
        console.error("[WhatsAppClient] Client error:", error);
        reject(error);
      });

      // Handle incoming messages
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
      client.initialize().catch((error) => {
        console.error("[WhatsAppClient] Initialization failed:", error);
        isReady = false;
        connectionStatus = "disconnected";
        initializationPromise = null;
        reject(error);
      });
    });
  } else {
    console.log("[WhatsAppClient] Using existing initialization promise...");
  }

  console.log("[WhatsAppClient] Waiting for initialization to complete...");
  await initializationPromise;
  console.log("[WhatsAppClient] Initialization promise resolved!");

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
