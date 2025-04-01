import type { Message } from "@/lib/Whatsapp/domain/model/Message";

export interface WhatsappRepository {
  sendMessage(message: Message): Promise<void>;
}
