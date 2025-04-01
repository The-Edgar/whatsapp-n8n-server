export class MessageNumber {
  public readonly value: string;

  constructor(value: string) {
    this.validateNumber(value);
    this.value = value;
  }

  private validateNumber(number: string): void {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    if (!phoneRegex.test(number))
      throw new Error("Number must be a valid number");
  }
}
