import type { MessageContent } from "@/lib/Whatsapp/domain/value-objects/MessageContent";
import type { ChatId } from "@/lib/Whatsapp/domain/value-objects/ChatId";
import { InvalidMessageDataError } from "../exceptions/InvalidMessageDataError";

export class Message {
  chatId: ChatId;
  message: MessageContent;

  constructor(chatId: ChatId, message: MessageContent) {
    this.chatId = chatId;
    this.message = message;
    this.validateMessage();
  }

  private validateMessage() {
    if (!this.chatId || !this.message)
      throw new InvalidMessageDataError("Invalid message data");
  }
}
