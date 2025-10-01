import { BroadcastMessageUseCase } from "@/lib/Whatsapp/application/use-cases/BroadcastMessageUseCase";
import { ForwardIncomingMessageUseCase } from "@/lib/Whatsapp/application/use-cases/ForwardIncomingMessageUseCase";
import { ReplyMessageUseCase } from "@/lib/Whatsapp/application/use-cases/ReplyMessageUseCase";
import { SendMessageUseCase } from "@/lib/Whatsapp/application/use-cases/SendMessageUseCase";
import { WebhookService } from "@/lib/Whatsapp/infrastructure/services/WebhookService";
import { WhatsappService } from "@/lib/Whatsapp/infrastructure/services/WhatsappService";
import { env } from "@/lib/Shared/infrastructure/config/env";

export const createServicesContainer = () => {
  // services
  const whatsappService = new WhatsappService();
  const webhookService = new WebhookService(env?.N8N_WEBHOOK_URL);

  return {
    whatsapp: {
      sendMessage: new SendMessageUseCase(whatsappService),
      replyMessage: new ReplyMessageUseCase(whatsappService),
      broadcastMessage: new BroadcastMessageUseCase(whatsappService),
      forwardIncomingMessage: new ForwardIncomingMessageUseCase(webhookService),
    },
  };
};

export type ServicesContainer = ReturnType<typeof createServicesContainer>;
