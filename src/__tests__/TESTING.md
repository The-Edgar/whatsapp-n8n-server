# Testing Guide

## Overview

This project uses **integration tests** that verify real behavior, not mocked implementations. Tests work identically on **macOS** and **Linux** (including remote servers and CI/CD environments).

## Test Strategy

### What We Test

1. **Server Health & Responsiveness** - Server starts and responds to HTTP requests
2. **Send Message Endpoint** - Message sending API works correctly
3. **Incoming Message Forwarding** - Messages are forwarded to n8n webhook with proper retry logic

### What We DON'T Mock

- ❌ HTTP requests (real fetch calls)
- ❌ Server startup (real Hono server)
- ❌ Webhook delivery (real HTTP POST to mock server)
- ❌ Retry logic (real exponential backoff)

### What We DO Mock

- ✅ WhatsApp client (not initialized in test mode)
- ✅ n8n webhook server (lightweight mock HTTP server for testing)

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/__tests__/integration/api.test.ts

# Watch mode (re-run on changes)
bun test --watch
```

## Test Files

### 1. `api.test.ts` - API Integration Tests

Tests the complete HTTP server with real requests:

- ✅ Server starts and responds to health checks
- ✅ Server responds quickly (< 1 second)
- ✅ Authentication works (API key validation)
- ✅ Input validation works (missing fields rejected)
- ✅ 404 errors for unknown endpoints

**Key Features:**
- Starts real HTTP server on random port
- Makes real fetch() calls
- No mocks for HTTP layer

### 2. `incoming-messages.test.ts` - Webhook Forwarding Tests

Tests the incoming message forwarding behavior with real HTTP:

- ✅ Messages forwarded to webhook URL
- ✅ Correct payload structure (JSON body)
- ✅ Retry logic on 5xx errors (3 attempts)
- ✅ No retry on 4xx errors (client errors)
- ✅ Exponential backoff between retries
- ✅ Fire-and-forget (non-blocking)
- ✅ Group chat detection
- ✅ Media message handling

**Key Features:**
- Real HTTP POST to mock webhook server
- Tests actual retry behavior with delays
- Verifies exponential backoff timing
- No mocks for webhook service logic

## Cross-Platform Compatibility

### Guaranteed to Work On

- ✅ macOS (Apple Silicon & Intel)
- ✅ Linux (Ubuntu, Debian, RHEL, etc.)
- ✅ Remote servers (SSH, cloud instances)
- ✅ CI/CD pipelines (GitHub Actions, GitLab CI, etc.)

### Why It's Cross-Platform

1. **No Docker** - Pure Node.js/Bun tests
2. **No Browser** - WhatsApp client not initialized in test mode
3. **Dynamic Ports** - Auto-assigned ports prevent conflicts
4. **Pure HTTP** - Platform-agnostic networking
5. **No File System** - All in-memory testing

## Test Configuration

### Environment Variables

Tests use `.env.test`:

```env
PORT=0                                    # Auto-assign port
NODE_ENV=test
API_KEY=test-api-key
BROADCAST_DELAY_MS=100                    # Faster for tests
N8N_WEBHOOK_URL=http://localhost:9999/webhook
```

### Test Mode Behavior

When `NODE_ENV=test`:
- WhatsApp client is NOT initialized
- Server is NOT started automatically (tests start their own)
- Auth middleware allows health endpoint without API key

## Test Helpers

### MockWebhookServer

Lightweight HTTP server that:
- Records all received webhooks
- Can simulate failures (500, 400 errors)
- Supports dynamic port assignment
- Provides helper methods (waitForWebhooks, getReceivedWebhooks)

**Usage:**
```typescript
const server = createMockWebhookServer();
const port = await server.start();
// ... make requests ...
const webhooks = server.getReceivedWebhooks();
await server.stop();
```

## Common Issues

### Tests Timing Out

**Cause:** WhatsApp client trying to initialize
**Fix:** Ensure `NODE_ENV=test` is set

### Port Already in Use

**Cause:** Previous test didn't clean up
**Fix:** Tests use port `0` (auto-assign), shouldn't happen

### Webhook Not Received

**Cause:** Fire-and-forget timing
**Fix:** Use `await server.waitForWebhooks(count, timeout)`

## Adding New Tests

### Guidelines

1. **Test Behavior, Not Implementation**
   - ✅ "Message is forwarded to webhook"
   - ❌ "ForwardUseCase.execute() was called"

2. **Use Real HTTP Calls**
   - ✅ `await fetch(url)`
   - ❌ `mockFetch.mockResolvedValue()`

3. **Minimal Mocking**
   - Only mock external services (WhatsApp, n8n)
   - Never mock internal application logic

4. **Cross-Platform First**
   - Avoid platform-specific commands
   - Use dynamic port assignment
   - No hardcoded file paths

### Example Test

```typescript
test("server responds to health check", async () => {
  const response = await fetch(`${serverUrl}/api/v1/health`);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.status).toBe("ok");
});
```

## CI/CD Integration

Tests are designed to run in CI/CD without modifications:

```yaml
# GitHub Actions example
- name: Run tests
  run: bun test
```

No special setup, Docker, or environment configuration needed.
