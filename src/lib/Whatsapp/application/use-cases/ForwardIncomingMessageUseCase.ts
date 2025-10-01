import type { IncomingMessage } from "@/lib/Whatsapp/domain/model/IncomingMessage";
import type { WebhookService } from "@/lib/Whatsapp/infrastructure/services/WebhookService";

export class ForwardIncomingMessageUseCase {
  constructor(private readonly webhookService: WebhookService) {}

  async execute(message: IncomingMessage): Promise<void> {
    console.log(
      `[ForwardIncomingMessageUseCase] Forwarding message ${message.messageId} from ${message.from}`,
    );

    // Fire and forget - don't await to prevent blocking the message event handler
    this.webhookService
      .deliverMessage(message)
      .then((result) => {
        if (result.success) {
          console.log(
            `[ForwardIncomingMessageUseCase] Message ${message.messageId} forwarded successfully`,
          );
        } else {
          console.error(
            `[ForwardIncomingMessageUseCase] Failed to forward message ${message.messageId}: ${result.error}`,
          );
        }
      })
      .catch((error) => {
        console.error(
          `[ForwardIncomingMessageUseCase] Unexpected error forwarding message ${message.messageId}:`,
          error,
        );
      });
  }
}
