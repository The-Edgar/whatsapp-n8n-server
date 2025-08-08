export class MessageContent {
  public readonly value: string;

  constructor(value: string) {
    this.validateContent(value);
    this.value = value;
  }

  private validateContent(value: string) {
    if (value.length < 3) {
      throw new Error("Message must be at least 3 characters long");
    }
  }
}
