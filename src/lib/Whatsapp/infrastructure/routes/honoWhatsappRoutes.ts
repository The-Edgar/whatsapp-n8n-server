import type { Hono } from "hono";
import { QRCodeController } from "@/lib/Whatsapp/infrastructure/controllers/QRCodeController";
import { SendMessageController } from "@/lib/Whatsapp/infrastructure/controllers/SendMessageController";

const sendMessage = new SendMessageController();
const qrCode = new QRCodeController();

export const register = (app: Hono): void => {
  app.post("/send-message", (c) => sendMessage.run(c));
  app.get("/qr-code", (c) => qrCode.run(c));
};
