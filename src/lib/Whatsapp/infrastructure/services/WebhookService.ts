import type { IncomingMessage } from "@/lib/Whatsapp/domain/model/IncomingMessage";

export interface WebhookDeliveryResult {
  success: boolean;
  error?: string;
}

export class WebhookService {
  constructor(
    private readonly webhookUrl: string | undefined,
    private readonly maxRetries = 3,
    private readonly retryDelayMs = 1000,
  ) {}

  async deliverMessage(
    message: IncomingMessage,
  ): Promise<WebhookDeliveryResult> {
    if (!this.webhookUrl) {
      console.log("[WebhookService] No webhook URL configured, skipping delivery");
      return { success: false, error: "No webhook URL configured" };
    }

    const payload = message.toPrimitives();

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(
          `[WebhookService] Attempt ${attempt}/${this.maxRetries} - Delivering message to ${this.webhookUrl}`,
        );

        const response = await fetch(this.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (response.ok) {
          console.log("[WebhookService] Message delivered successfully");
          return { success: true };
        }

        const errorText = await response.text().catch(() => "Unknown error");
        console.warn(
          `[WebhookService] Webhook returned status ${response.status}: ${errorText}`,
        );

        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          return {
            success: false,
            error: `Webhook returned ${response.status}: ${errorText}`,
          };
        }

        // Retry on 5xx errors (server errors)
        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * attempt;
          console.log(`[WebhookService] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[WebhookService] Attempt ${attempt}/${this.maxRetries} failed:`,
          errorMessage,
        );

        if (attempt === this.maxRetries) {
          return {
            success: false,
            error: `Failed after ${this.maxRetries} attempts: ${errorMessage}`,
          };
        }

        const delay = this.retryDelayMs * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: `Failed after ${this.maxRetries} attempts`,
    };
  }
}
