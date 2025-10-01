# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WhatsApp n8n Server is a Node.js REST API that integrates with WhatsApp Web via `whatsapp-web.js`, enabling automated message sending for n8n workflows. Built with Clean Architecture principles using Hono framework.

## Common Commands

### Development
```bash
bun dev              # Start development server with auto-reload (tsx watch)
bun start            # Start production server
```

### Code Quality
```bash
bunx biome format --write src    # Format code
bunx biome lint --write src      # Lint and auto-fix
bunx biome check src             # Run all checks (format + lint)
```

## Architecture

### Clean Architecture Layers

The codebase follows Clean Architecture with clear separation:

1. **Domain Layer** (`src/lib/Whatsapp/domain/`)
   - `model/`: Core entities (Message, BroadcastMessage, ReplyMessage)
   - `value-objects/`: Value objects (ChatId, MessageContent, MessageId)
   - `repository/`: Repository interface (WhatsappRepository)
   - `exceptions/`: Domain-specific errors

2. **Application Layer** (`src/lib/Whatsapp/application/use-cases/`)
   - Use cases orchestrate domain logic (SendMessageUseCase, ReplyMessageUseCase, BroadcastMessageUseCase)

3. **Infrastructure Layer** (`src/lib/Whatsapp/infrastructure/`)
   - `controllers/`: HTTP request handlers implementing Controller interface
   - `services/`: Repository implementations (WhatsappService)
   - `routes/`: Route registration (honoWhatsappRoutes)
   - `WhatsappClient.ts`: Singleton WhatsApp client manager

4. **Shared Layer** (`src/lib/Shared/`)
   - `infrastructure/config/`: Environment configuration
   - `infrastructure/hono/`: Framework setup and middlewares
   - `infrastructure/services/`: Dependency injection container

### Key Patterns

- **Dependency Injection**: Services container created in `createServicesContainer()` and injected via `servicesMiddleware`
- **Controller Pattern**: All controllers implement the `Controller` interface with `run(c: Context)` method
- **Repository Pattern**: `WhatsappRepository` interface with `WhatsappService` implementation
- **Value Objects**: Domain primitives wrapped in classes with validation (ChatId, MessageContent)

### Application Flow

1. Request → Hono middleware chain (auth, services, logger)
2. Controller receives Context with injected services
3. Controller calls Use Case with validated input
4. Use Case creates Domain entities/value objects
5. Use Case calls Repository (WhatsappService)
6. WhatsappService gets WhatsApp client and executes operation

### WhatsApp Client Management

The WhatsApp client (`WhatsappClient.ts`) is a singleton that:
- Initializes once on server startup via `initializeClient()`
- Manages connection states: initializing → qr → authenticating → ready
- Uses LocalAuth for session persistence in `.wwebjs_auth/`
- Provides QR code for initial authentication
- **Important**: Client must be in "ready" state before sending messages

### Path Aliases

TypeScript paths configured with `@/*` pointing to `src/`:
```typescript
import { env } from "@/lib/Shared/infrastructure/config/env"
```

## Environment Variables

Required variables (see `.env.example`):
- `PORT`: Server port (default: 3000)
- `API_KEY`: API authentication key
- `BROADCAST_DELAY_MS`: Delay between broadcast messages to prevent bans (default: 1500ms)
- `NODE_ENV`: Environment (development/production)

## API Structure

All routes use base path `/api/v1/` and require `x-api-key` header:
- `GET /qr-code`: Get QR code for authentication
- `POST /send-message`: Send message to single recipient
- `POST /reply-message`: Reply to specific message
- `POST /broadcast-message`: Send message to multiple recipients with delay

## Adding New Features

### New WhatsApp Endpoint
1. Create domain model in `domain/model/`
2. Add method to `WhatsappRepository` interface
3. Implement method in `WhatsappService`
4. Create use case in `application/use-cases/`
5. Add use case to services container in `createServicesContainer()`
6. Create controller in `infrastructure/controllers/`
7. Register route in `honoWhatsappRoutes.ts`

### New Module
Follow the same domain/application/infrastructure structure under `src/lib/YourModule/`
