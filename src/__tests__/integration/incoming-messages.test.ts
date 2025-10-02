import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import "../setup";
import { createMockWebhookServer } from "../helpers/MockWebhookServer";
import { WebhookService } from "@/lib/Whatsapp/infrastructure/services/WebhookService";
import { ForwardIncomingMessageUseCase } from "@/lib/Whatsapp/application/use-cases/ForwardIncomingMessageUseCase";
import { IncomingMessage } from "@/lib/Whatsapp/domain/model/IncomingMessage";

describe("Incoming Messages Integration Tests", () => {
  let mockWebhookServer: ReturnType<typeof createMockWebhookServer>;
  let webhookService: WebhookService;
  let forwardIncomingMessageUseCase: ForwardIncomingMessageUseCase;

  beforeEach(async () => {
    // Start mock webhook server
    mockWebhookServer = createMockWebhookServer();
    const port = await mockWebhookServer.start();

    // Create services with mock webhook URL
    webhookService = new WebhookService(mockWebhookServer.getUrl());
    forwardIncomingMessageUseCase = new ForwardIncomingMessageUseCase(
      webhookService,
    );
  });

  afterEach(async () => {
    await mockWebhookServer.stop();
  });

  describe("Webhook Forwarding", () => {
    test("should forward incoming message to webhook URL", async () => {
      const incomingMessage = new IncomingMessage(
        "msg_12345",
        "1234567890@c.us",
        "Test message",
        Date.now(),
        false,
        false,
        false,
        "1234567890@c.us",
      );

      // Execute use case (fire and forget)
      await forwardIncomingMessageUseCase.execute(incomingMessage);

      // Wait for webhook to be received
      await mockWebhookServer.waitForWebhooks(1, 2000);

      const webhooks = mockWebhookServer.getReceivedWebhooks();
      expect(webhooks.length).toBe(1);

      const webhook = webhooks[0];
      expect(webhook.body).toMatchObject({
        messageId: "msg_12345",
        from: "1234567890@c.us",
        body: "Test message",
        hasMedia: false,
        isGroup: false,
        fromMe: false,
        chatId: "1234567890@c.us",
      });
    });

    test("should include correct headers in webhook request", async () => {
      const incomingMessage = new IncomingMessage(
        "msg_12345",
        "1234567890@c.us",
        "Test message",
        Date.now(),
        false,
        false,
        false,
        "1234567890@c.us",
      );

      await forwardIncomingMessageUseCase.execute(incomingMessage);
      await mockWebhookServer.waitForWebhooks(1, 2000);

      const webhook = mockWebhookServer.getLastWebhook();
      expect(webhook).not.toBeNull();
      expect(webhook!.headers["content-type"]).toBe("application/json");
    });

    test("should handle webhook delivery failures gracefully", async () => {
      // Configure webhook server to fail
      mockWebhookServer.setFailure(true, 500);

      const incomingMessage = new IncomingMessage(
        "msg_12345",
        "1234567890@c.us",
        "Test message",
        Date.now(),
        false,
        false,
        false,
        "1234567890@c.us",
      );

      // Should not throw (fire and forget)
      await expect(
        forwardIncomingMessageUseCase.execute(incomingMessage),
      ).resolves.toBeUndefined();

      // Wait for retry attempts
      await mockWebhookServer.waitForWebhooks(3, 5000);

      const webhooks = mockWebhookServer.getReceivedWebhooks();
      // Should have retried 3 times
      expect(webhooks.length).toBe(3);
    });

    test("should not retry on 4xx client errors", async () => {
      // Configure webhook server to return 400
      mockWebhookServer.setFailure(true, 400);

      const incomingMessage = new IncomingMessage(
        "msg_12345",
        "1234567890@c.us",
        "Test message",
        Date.now(),
        false,
        false,
        false,
        "1234567890@c.us",
      );

      await forwardIncomingMessageUseCase.execute(incomingMessage);

      // Wait a bit to ensure no retries happen
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const webhooks = mockWebhookServer.getReceivedWebhooks();
      // Should only have 1 attempt (no retries on 4xx)
      expect(webhooks.length).toBe(1);
    });

    test("should handle messages with media flag", async () => {
      const incomingMessage = new IncomingMessage(
        "msg_12345",
        "1234567890@c.us",
        "Image caption",
        Date.now(),
        true, // hasMedia
        false,
        false,
        "1234567890@c.us",
      );

      await forwardIncomingMessageUseCase.execute(incomingMessage);
      await mockWebhookServer.waitForWebhooks(1, 2000);

      const webhook = mockWebhookServer.getLastWebhook();
      expect(webhook).not.toBeNull();
      expect((webhook!.body as any).hasMedia).toBe(true);
    });

    test("should handle group chat messages", async () => {
      const incomingMessage = new IncomingMessage(
        "msg_12345",
        "1234567890-9876543210@g.us",
        "Group message",
        Date.now(),
        false,
        true, // isGroupChat
        false,
        "1234567890-9876543210@g.us",
      );

      await forwardIncomingMessageUseCase.execute(incomingMessage);
      await mockWebhookServer.waitForWebhooks(1, 2000);

      const webhook = mockWebhookServer.getLastWebhook();
      expect(webhook).not.toBeNull();
      expect((webhook!.body as any).isGroup).toBe(true);
    });

    test("should not block when webhook is slow", async () => {
      const incomingMessage = new IncomingMessage(
        "msg_12345",
        "1234567890@c.us",
        "Test message",
        Date.now(),
        false,
        false,
        false,
        "1234567890@c.us",
      );

      const startTime = Date.now();

      // Execute should return immediately (fire and forget)
      await forwardIncomingMessageUseCase.execute(incomingMessage);

      const endTime = Date.now();

      // Should complete in less than 100ms (not waiting for webhook)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe("Webhook Service Retry Logic", () => {
    test("should implement exponential backoff", async () => {
      mockWebhookServer.setFailure(true, 500);

      const incomingMessage = new IncomingMessage(
        "msg_12345",
        "1234567890@c.us",
        "Test message",
        Date.now(),
        false,
        false,
        false,
        "1234567890@c.us",
      );

      await forwardIncomingMessageUseCase.execute(incomingMessage);
      await mockWebhookServer.waitForWebhooks(3, 10000);

      const webhooks = mockWebhookServer.getReceivedWebhooks();
      expect(webhooks.length).toBe(3);

      // Check that there's a delay between attempts
      const firstTimestamp = webhooks[0].timestamp;
      const secondTimestamp = webhooks[1].timestamp;
      const thirdTimestamp = webhooks[2].timestamp;

      const firstDelay = secondTimestamp - firstTimestamp;
      const secondDelay = thirdTimestamp - secondTimestamp;

      // Second delay should be longer than first (exponential backoff)
      expect(secondDelay).toBeGreaterThan(firstDelay);
    });
  });

  describe("No Webhook URL Configured", () => {
    test("should handle missing webhook URL gracefully", async () => {
      const webhookServiceNoUrl = new WebhookService(undefined);
      const forwardUseCase = new ForwardIncomingMessageUseCase(
        webhookServiceNoUrl,
      );

      const incomingMessage = new IncomingMessage(
        "msg_12345",
        "1234567890@c.us",
        "Test message",
        Date.now(),
        false,
        false,
        false,
        "1234567890@c.us",
      );

      // Should not throw
      await expect(
        forwardUseCase.execute(incomingMessage),
      ).resolves.toBeUndefined();
    });
  });
});
