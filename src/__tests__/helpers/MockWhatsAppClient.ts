import type { Client as WhatsAppWebClient, Message } from "whatsapp-web.js";
import { EventEmitter } from "node:events";

/**
 * Mock WhatsApp Client for testing
 * Simulates the whatsapp-web.js Client without requiring a real browser
 */
export class MockWhatsAppClient extends EventEmitter {
  private _isReady = false;
  private _isInitialized = false;

  async initialize(): Promise<void> {
    this._isInitialized = true;
    // Simulate initialization delay
    await new Promise((resolve) => setTimeout(resolve, 10));
    this._isReady = true;
    this.emit("ready");
  }

  async sendMessage(chatId: string, content: string): Promise<Message> {
    if (!this._isReady) {
      throw new Error("Client is not ready");
    }

    // Mock message response
    const mockMessage = {
      id: {
        _serialized: `mock_${Date.now()}`,
      },
      from: chatId,
      body: content,
      timestamp: Math.floor(Date.now() / 1000),
      hasMedia: false,
      fromMe: true,
    } as unknown as Message;

    return mockMessage;
  }

  async destroy(): Promise<void> {
    this._isReady = false;
    this._isInitialized = false;
    this.removeAllListeners();
  }

  // Helper method for tests to simulate incoming messages
  simulateIncomingMessage(from: string, body: string, options: Partial<Message> = {}): void {
    const mockMessage = {
      id: {
        _serialized: `mock_incoming_${Date.now()}`,
      },
      from,
      body,
      timestamp: Math.floor(Date.now() / 1000),
      hasMedia: false,
      fromMe: false,
      isStatus: false,
      ...options,
    } as unknown as Message;

    this.emit("message", mockMessage);
  }

  // Helper method to simulate ready state without full initialization
  setReady(ready: boolean): void {
    this._isReady = ready;
    if (ready) {
      this.emit("ready");
    }
  }

  // Helper method to check if client is ready
  isReady(): boolean {
    return this._isReady;
  }
}

/**
 * Factory function to create a mock client instance
 */
export function createMockWhatsAppClient(): MockWhatsAppClient {
  return new MockWhatsAppClient();
}
