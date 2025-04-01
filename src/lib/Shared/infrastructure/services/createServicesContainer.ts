import { SendMessageUseCase } from "@/lib/Whatsapp/application/use-cases/SendMessageUseCase";
import { WhatsappService } from "@/lib/Whatsapp/infrastructure/services/WhatsappService";

export const createServicesContainer = () => {
  // services
  const whatsappService = new WhatsappService();

  return {
    whatsapp: {
      sendMessage: new SendMessageUseCase(whatsappService),
    },
  };
};

export type ServicesContainer = ReturnType<typeof createServicesContainer>;
