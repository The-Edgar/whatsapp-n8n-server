import type { BroadcastMessage } from "@/lib/Whatsapp/domain/model/BroadcastMessage";
import type { Message } from "@/lib/Whatsapp/domain/model/Message";
import type { ReplyMessage } from "@/lib/Whatsapp/domain/model/ReplyMessage";
import type { WhatsappRepository } from "@/lib/Whatsapp/domain/repository/WhatsappRepository";
import { getWhatsAppClient } from "@/lib/Whatsapp/infrastructure/WhatsappClient";
import { WhatsappClientIsNotReadyError } from "../../domain/exceptions/WhatsappClientIsNotReadyError";

const WHATSAPP_SUFFIX = "@c.us";

export class WhatsappService implements WhatsappRepository {
  private async getReadyClient() {
    console.log("[WhatsappService] Getting ready client...");
    const client = await getWhatsAppClient();
    console.log("[WhatsappService] Client obtained!");

    if (!client)
      throw new WhatsappClientIsNotReadyError(
        "Client not ready or disconnected",
      );

    return client;
  }

  async sendMessage(message: Message): Promise<void> {
    console.log("[WhatsappService] sendMessage called");
    const { chatId, message: text } = message.toPrimitives();
    console.log(`[WhatsappService] chatId: ${chatId}, message: ${text}`);

    if (!chatId || !text) throw new Error("chatId and message are required");

    console.log("[WhatsappService] Getting ready client...");
    const client = await this.getReadyClient();
    console.log("[WhatsappService] Client ready, sending message...");
    await client.sendMessage(`${chatId}${WHATSAPP_SUFFIX}`, text);
    console.log("[WhatsappService] Message sent!");
  }

  async replyMessage(replyMessage: ReplyMessage): Promise<void> {
    const { chatId, messageId, message } = replyMessage.toPrimitives();

    if (!chatId || !message) throw new Error("chatId and message are required");

    const client = await this.getReadyClient();

    if (messageId) {
      const targetMessage = await client.getMessageById(messageId);
      if (targetMessage) {
        await targetMessage.reply(message);
        return;
      }
    }

    await client.sendMessage(`${chatId}${WHATSAPP_SUFFIX}`, message);
  }

  async broadcastMessage(
    broadcastMessage: BroadcastMessage,
    delay: number,
  ): Promise<void> {
    const { chatIds, message } = broadcastMessage.toPrimitives();

    if (!chatIds || !message)
      throw new Error("chatIds and message are required");

    const client = await this.getReadyClient();

    for (const chatId of chatIds) {
      await client.sendMessage(`${chatId}${WHATSAPP_SUFFIX}`, message);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
