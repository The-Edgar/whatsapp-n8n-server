import { Hono } from "hono";
import type { MockWhatsAppClient } from "./MockWhatsAppClient";
import { createServicesContainer } from "@/lib/Shared/infrastructure/services/createServicesContainer";
import { servicesMiddleware } from "@/lib/Shared/infrastructure/hono/middlewares/servicesMiddleware";
import { authMiddleware } from "@/lib/Shared/infrastructure/hono/middlewares/authMiddleware";
import { notFound } from "@/lib/Shared/infrastructure/hono/middlewares/notFound";
import { onError } from "@/lib/Shared/infrastructure/hono/middlewares/onError";
import { registerRoutes } from "@/lib/Shared/infrastructure/routes/registerRoutes";

/**
 * Create a test application instance with mocked WhatsApp client
 * This allows us to test the HTTP layer without a real WhatsApp connection
 */
export function createTestApp(mockClient?: MockWhatsAppClient) {
  const app = new Hono().basePath("/api/v1/");

  // Apply middlewares
  app.notFound(notFound);
  app.onError(onError);
  app.use("*", servicesMiddleware);
  app.use("*", authMiddleware);

  // Register routes
  registerRoutes(app);

  return app;
}

/**
 * Mock the WhatsApp client module for testing
 * This replaces the real client with our mock
 */
export function mockWhatsAppClientModule(mockClient: MockWhatsAppClient) {
  // Store original module
  const originalModule = require("@/lib/Whatsapp/infrastructure/WhatsappClient");

  // Mock the getWhatsAppClient function
  const mock = {
    getWhatsAppClient: async () => {
      if (!mockClient.isReady()) {
        throw new Error("WhatsApp client is not ready");
      }
      return mockClient;
    },
    getQrCode: () => null,
    getConnectionStatus: () => mockClient.isReady() ? "ready" : "disconnected",
    initializeClient: () => Promise.resolve(),
  };

  return { mock, original: originalModule };
}
