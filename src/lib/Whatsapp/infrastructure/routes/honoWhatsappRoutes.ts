import { SendMessageController } from "@/lib/Whatsapp/infrastructure/controllers/SendMessageController";
import type { Hono } from "hono";

const sendMessage = new SendMessageController();

export const register = (app: Hono): void => {
  app.post("/send-message", (c) => sendMessage.run(c));
};
