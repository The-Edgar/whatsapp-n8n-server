import type { Server } from "node:http";

export interface ReceivedWebhook {
  body: unknown;
  headers: Record<string, string>;
  timestamp: number;
}

/**
 * Mock Webhook Server for testing
 * Simulates n8n webhook receiver to verify incoming message forwarding
 */
export class MockWebhookServer {
  private server: Server | null = null;
  private receivedWebhooks: ReceivedWebhook[] = [];
  private shouldFail = false;
  private failStatusCode = 500;
  private port = 0;

  /**
   * Start the mock webhook server
   * @param port Port to listen on (0 for auto-assign)
   * @returns Promise that resolves with the actual port number
   */
  async start(port = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = Bun.serve({
        port,
        fetch: async (req) => {
          // Parse request
          const body = await req.json().catch(() => null);
          const headers: Record<string, string> = {};
          req.headers.forEach((value, key) => {
            headers[key] = value;
          });

          // Record webhook
          this.receivedWebhooks.push({
            body,
            headers,
            timestamp: Date.now(),
          });

          // Simulate failure if configured
          if (this.shouldFail) {
            return new Response("Simulated failure", {
              status: this.failStatusCode,
            });
          }

          // Success response
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
      }) as unknown as Server;

      // Get the actual port
      this.port = (this.server as any).port || port;

      // Small delay to ensure server is listening
      setTimeout(() => {
        resolve(this.port);
      }, 10);
    });
  }

  /**
   * Stop the mock webhook server
   */
  async stop(): Promise<void> {
    if (this.server) {
      await (this.server as any).stop?.();
      this.server = null;
    }
  }

  /**
   * Get all received webhooks
   */
  getReceivedWebhooks(): ReceivedWebhook[] {
    return [...this.receivedWebhooks];
  }

  /**
   * Get the last received webhook
   */
  getLastWebhook(): ReceivedWebhook | null {
    return this.receivedWebhooks[this.receivedWebhooks.length - 1] || null;
  }

  /**
   * Clear all received webhooks
   */
  clearWebhooks(): void {
    this.receivedWebhooks = [];
  }

  /**
   * Configure the server to fail requests
   * @param fail Whether to fail requests
   * @param statusCode HTTP status code to return (default: 500)
   */
  setFailure(fail: boolean, statusCode = 500): void {
    this.shouldFail = fail;
    this.failStatusCode = statusCode;
  }

  /**
   * Get the webhook URL
   */
  getUrl(): string {
    return `http://localhost:${this.port}`;
  }

  /**
   * Wait for a specific number of webhooks to be received
   * @param count Number of webhooks to wait for
   * @param timeoutMs Timeout in milliseconds (default: 5000)
   */
  async waitForWebhooks(count: number, timeoutMs = 5000): Promise<void> {
    const startTime = Date.now();
    while (this.receivedWebhooks.length < count) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(
          `Timeout waiting for ${count} webhooks (received ${this.receivedWebhooks.length})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

/**
 * Factory function to create a mock webhook server
 */
export function createMockWebhookServer(): MockWebhookServer {
  return new MockWebhookServer();
}
