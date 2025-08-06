import type { Hono } from "hono";
import * as WhatsappRoutes from "@/lib/Whatsapp/infrastructure/routes/honoWhatsappRoutes";

const routes = [WhatsappRoutes];

export function registerRoutes(app: Hono): void {
  for (const route of routes) {
    route.register(app);
  }
}
