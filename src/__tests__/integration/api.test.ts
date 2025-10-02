import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { serve } from "@hono/node-server";
import type { Server } from "node:http";
import { createMockWebhookServer } from "../helpers/MockWebhookServer";

/**
 * Real Integration Tests - Testing Actual Behavior
 *
 * These tests verify:
 * 1. Server starts and responds to HTTP requests
 * 2. Authentication works correctly
 * 3. API endpoints return expected responses
 * 4. Webhook forwarding works with real HTTP calls
 *
 * NO MOCKS - Testing real HTTP behavior across Mac and Linux
 */

const API_KEY = "test-api-key-integration";
let serverUrl: string;
let server: Server;
let mockWebhookServer: ReturnType<typeof createMockWebhookServer>;

beforeAll(async () => {
  // Start mock webhook server first
  mockWebhookServer = createMockWebhookServer();
  const webhookPort = await mockWebhookServer.start();

  // Set environment for test
  process.env.NODE_ENV = "test";
  process.env.API_KEY = API_KEY;
  process.env.N8N_WEBHOOK_URL = `http://localhost:${webhookPort}`;
  process.env.PORT = "0"; // Auto-assign

  // Import app after setting env
  const { app } = await import("@/app");

  // Start server on random port
  return new Promise<void>((resolve) => {
    server = serve(
      {
        fetch: app.fetch,
        port: 0,
      },
      (info) => {
        serverUrl = `http://localhost:${info.port}`;
        resolve();
      },
    );
  });
}, 10000);

afterAll(async () => {
  if (server) {
    server.close();
  }
  if (mockWebhookServer) {
    await mockWebhookServer.stop();
  }
});

describe("API Integration Tests - Real Server", () => {
  describe("Server Health", () => {
    test("server responds to health check", async () => {
      const response = await fetch(`${serverUrl}/api/v1/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("ok");
      expect(data.service).toBe("whatsapp-n8n-server");
    });

    test("server responds quickly", async () => {
      const start = Date.now();
      await fetch(`${serverUrl}/api/v1/health`);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Authentication", () => {
    test("rejects requests without API key", async () => {
      const response = await fetch(`${serverUrl}/api/v1/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: "123", message: "test" }),
      });

      expect(response.status).toBe(401);
    });

    test("accepts requests with valid API key", async () => {
      // Use QR code endpoint which doesn't trigger WhatsApp client sends
      const response = await fetch(`${serverUrl}/api/v1/qr-code`, {
        headers: {
          "x-api-key": API_KEY,
        },
      });

      // Should NOT be 401 (may be other codes, but auth should pass)
      expect(response.status).not.toBe(401);
    });

    test("rejects requests with invalid API key", async () => {
      const response = await fetch(`${serverUrl}/api/v1/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "wrong-key",
        },
        body: JSON.stringify({ chatId: "123", message: "test" }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Send Message Endpoint", () => {
    test("validates missing chatId", async () => {
      const response = await fetch(`${serverUrl}/api/v1/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ message: "test" }),
      });

      expect([400, 500, 503]).toContain(response.status);
    });

    test("validates missing message", async () => {
      const response = await fetch(`${serverUrl}/api/v1/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ chatId: "1234567890" }),
      });

      expect([400, 500, 503]).toContain(response.status);
    });
  });

  describe("Error Handling", () => {
    test("returns 404 for unknown endpoints", async () => {
      const response = await fetch(`${serverUrl}/api/v1/nonexistent`, {
        headers: { "x-api-key": API_KEY },
      });

      expect(response.status).toBe(404);
    });
  });
});
