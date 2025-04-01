import type { MessageContent } from "@/lib/Whatsapp/domain/value-objects/MessageContent";
import type { MessageNumber } from "@/lib/Whatsapp/domain/value-objects/MessageNumber";
import { InvalidMessageDataError } from "../exceptions/InvalidMessageDataError";

export class Message {
  number: MessageNumber;
  content: MessageContent;

  constructor(number: MessageNumber, content: MessageContent) {
    this.number = number;
    this.content = content;
    this.validateMessage();
  }

  private validateMessage() {
    if (!this.number || !this.content)
      throw new InvalidMessageDataError("Invalid message data");
  }
}
