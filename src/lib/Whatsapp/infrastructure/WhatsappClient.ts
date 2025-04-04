import { WhatsappClientIsNotReadyError } from "@/lib/Whatsapp/domain/exceptions/WhatsappClientIsNotReadyError";
import qrcode from "qrcode-terminal";
import type { Client as WhatsAppWebClient } from "whatsapp-web.js";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;

let client: WhatsAppWebClient;
let isReady = false;
let initializationPromise: Promise<void> | null = null;

export const getWhatsAppClient = async (): Promise<
  InstanceType<typeof Client>
> => {
  if (!initializationPromise) {
    initializationPromise = new Promise<void>((resolve) => {
      client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
          ],
        },
      });

      client.on("qr", (qr) => {
        console.log("Scan the QR code to log in:");
        qrcode.generate(qr, { small: true });
      });

      client.on("ready", () => {
        console.log("WhatsApp client is ready!");
        isReady = true;
        resolve();
      });

      client.on("authenticated", () => {
        console.log("Client authenticated!");
      });

      client.on("disconnected", async (reason) => {
        console.log("Client was disconnected:", reason);
        isReady = false;
        initializationPromise = null;
      });

      client.on("auth_failure", (msg) => {
        console.error("Authentication failure:", msg);
        isReady = false;
        initializationPromise = null;
      });

      client.initialize();
    });
  }

  await initializationPromise;

  if (!isReady)
    throw new WhatsappClientIsNotReadyError("WhatsApp client is not ready");

  return client;
};
