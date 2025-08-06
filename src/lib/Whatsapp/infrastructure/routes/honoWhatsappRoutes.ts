import type { Hono } from "hono";
import { SendMessageController } from "@/lib/Whatsapp/infrastructure/controllers/SendMessageController";

const sendMessage = new SendMessageController();

export const register = (app: Hono): void => {
  app.post("/send-message", (c) => sendMessage.run(c));
};
