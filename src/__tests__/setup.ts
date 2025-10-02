/**
 * Test environment setup
 * Sets up test-specific environment variables
 */

process.env.NODE_ENV = "test";
process.env.PORT = "0"; // Auto-assign port
process.env.API_KEY = "test-api-key";
process.env.BROADCAST_DELAY_MS = "100"; // Faster for tests
process.env.N8N_WEBHOOK_URL = ""; // Will be set dynamically in tests
