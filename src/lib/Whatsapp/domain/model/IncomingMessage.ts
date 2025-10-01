export interface IncomingMessagePrimitives {
  messageId: string;
  from: string;
  body: string;
  timestamp: number;
  hasMedia: boolean;
  isGroup: boolean;
  fromMe: boolean;
  chatId: string;
}

export class IncomingMessage {
  constructor(
    readonly messageId: string,
    readonly from: string,
    readonly body: string,
    readonly timestamp: number,
    readonly hasMedia: boolean,
    readonly isGroup: boolean,
    readonly fromMe: boolean,
    readonly chatId: string,
  ) {}

  static fromPrimitives(
    primitives: IncomingMessagePrimitives,
  ): IncomingMessage {
    return new IncomingMessage(
      primitives.messageId,
      primitives.from,
      primitives.body,
      primitives.timestamp,
      primitives.hasMedia,
      primitives.isGroup,
      primitives.fromMe,
      primitives.chatId,
    );
  }

  toPrimitives(): IncomingMessagePrimitives {
    return {
      messageId: this.messageId,
      from: this.from,
      body: this.body,
      timestamp: this.timestamp,
      hasMedia: this.hasMedia,
      isGroup: this.isGroup,
      fromMe: this.fromMe,
      chatId: this.chatId,
    };
  }
}
