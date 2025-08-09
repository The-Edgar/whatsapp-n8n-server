import type { Message } from "@/lib/Whatsapp/domain/model/Message";
import type { ReplyMessage } from "@/lib/Whatsapp/domain/model/ReplyMessage";

export interface WhatsappRepository {
  sendMessage(message: Message): Promise<void>;
  replyMessage(reply: ReplyMessage): Promise<void>;
}
