import type { Message } from "@/lib/Whatsapp/domain/model/Message";
import type { WhatsappRepository } from "@/lib/Whatsapp/domain/repository/WhatsappRepository";
import {
  getWhatsAppClient,
  resetWhatsAppClient,
} from "@/lib/Whatsapp/infrastructure/WhatsappClient";

export class WhatsappService implements WhatsappRepository {
  async sendMessage(message: Message): Promise<void> {
    try {
      const client = await getWhatsAppClient();

      await client.sendMessage(
        `${message.number.value}@c.us`,
        message.content.value,
      );
    } catch (error) {
      resetWhatsAppClient();

      throw error;
    }
  }
}
