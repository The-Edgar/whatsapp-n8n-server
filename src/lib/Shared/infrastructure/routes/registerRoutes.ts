import * as WhatsappRoutes from "@/lib/Whatsapp/infrastructure/routes/honoWhatsappRoutes";
import type { Hono } from "hono";

const routes = [WhatsappRoutes];

export function registerRoutes(app: Hono): void {
  for (const route of routes) {
    route.register(app);
  }
}
