import type { Message } from "@/lib/Whatsapp/domain/model/Message";
import type { WhatsappRepository } from "@/lib/Whatsapp/domain/repository/WhatsappRepository";
import { getWhatsAppClient } from "@/lib/Whatsapp/infrastructure/WhatsappClient";
import { WhatsappClientIsNotReadyError } from "../../domain/exceptions/WhatsappClientIsNotReadyError";

export class WhatsappService implements WhatsappRepository {
  async sendMessage(message: Message): Promise<void> {
    const client = await getWhatsAppClient();

    if (!client) {
      throw new WhatsappClientIsNotReadyError(
        "Client not ready or disconnected",
      );
    }

    await client.sendMessage(
      `${message.number.value}@c.us`,
      message.content.value,
    );
  }
}
