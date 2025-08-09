import type { Hono } from "hono";
import { QRCodeController } from "@/lib/Whatsapp/infrastructure/controllers/QRCodeController";
import { ReplyMessageController } from "@/lib/Whatsapp/infrastructure/controllers/ReplyMessageController";
import { SendMessageController } from "@/lib/Whatsapp/infrastructure/controllers/SendMessageController";

const qrCode = new QRCodeController();
const sendMessage = new SendMessageController();
const replyMessage = new ReplyMessageController();

export const register = (app: Hono): void => {
  app.get("/qr-code", (c) => qrCode.run(c));
  app.post("/send-message", (c) => sendMessage.run(c));
  app.post("/reply-message", (c) => replyMessage.run(c));
};
