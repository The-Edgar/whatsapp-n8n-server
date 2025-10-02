import type { Hono } from "hono";
import { BroadcastMessageController } from "@/lib/Whatsapp/infrastructure/controllers/BroadcastMessageController";
import { QRCodeController } from "@/lib/Whatsapp/infrastructure/controllers/QRCodeController";
import { ReplyMessageController } from "@/lib/Whatsapp/infrastructure/controllers/ReplyMessageController";
import { SendMessageController } from "@/lib/Whatsapp/infrastructure/controllers/SendMessageController";
import { HealthController } from "@/lib/Whatsapp/infrastructure/controllers/HealthController";

const health = new HealthController();
const qrCode = new QRCodeController();
const sendMessage = new SendMessageController();
const replyMessage = new ReplyMessageController();
const broadcastMessage = new BroadcastMessageController();

export const register = (app: Hono): void => {
  app.get("/health", (c) => health.run(c));
  app.get("/qr-code", (c) => qrCode.run(c));
  app.post("/send-message", (c) => sendMessage.run(c));
  app.post("/reply-message", (c) => replyMessage.run(c));
  app.post("/broadcast-message", (c) => broadcastMessage.run(c));
};
