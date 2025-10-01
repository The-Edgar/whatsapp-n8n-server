# WhatsApp n8n Server – Automate WhatsApp Messaging via REST API + n8n

A Node.js server that integrates with WhatsApp Web via [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js), enabling automated message sending through a REST API. Built with Clean Architecture principles.


## ✨ Features

- WhatsApp Web integration using [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js)
- REST API endpoint for sending, replying and broadcasting messages
- QR code authentication
- Session persistence with `LocalAuth`
- Clean Architecture
- Ready to integrate with [`n8n`](https://n8n.io/) via HTTP requests

## ⚙️ Prerequisites

- Node.js v18 or higher
- Bun (recommended) or any Node.js-compatible package manager
- A WhatsApp account
- A smartphone with WhatsApp installed

> [!NOTE]
> Bun is used for local development and scripts, but the server works with npm, pnpm, or yarn.

> [!IMPORTANT]
> **Chrome/Chromium Compatibility**: This project uses Puppeteer 18.2.1 (bundled with whatsapp-web.js 1.34.1), which downloads and uses Chromium 107. **Do NOT configure a custom Chrome/Chromium path** in the code - let Puppeteer manage its own browser. Using system Chrome 130+ will cause "ProtocolError: Target closed" crashes due to DevTools Protocol incompatibilities.

## 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/nicolasdelrosario/whatsapp-n8n-server.git
cd whatsapp-n8n-server
```

Install dependencies

```bash
bun install
```

Configure environment variables:

```bash
cp .env.example .env
```

Edit the `.env` and set:  

```
API_KEY=your-secure-api-key
BROADCAST_DELAY_MS=1500
```

- `API_KEY`: Secure key for API authentication.
- `BROADCAST_DELAY_MS`: Delay in milliseconds between each broadcast message (default: `1500` ms).

## 🧪 Usage

Start development mode

```bash
bun dev
```

- On first run, a QR code will appear in the terminal.
- Scan it with WhatsApp on your phone to authenticate.
- Once authenticated, your session will be saved.

Server will run on:

```bash
http://localhost:3000
```

## 🐛 Troubleshooting

### "ProtocolError: Target closed" or Browser Crashes

If you encounter `ProtocolError: Protocol error (Target.setAutoAttach): Target closed` or similar Puppeteer errors:

**Root Cause**: Version mismatch between Puppeteer (expecting Chromium 107 from 2022) and system Chrome/Chromium (versions 130+).

**Solution**:
1. **Never hardcode `executablePath`** in Puppeteer configuration - Remove any custom Chrome/Chromium paths
2. **Let Puppeteer download its own Chromium** - On first run, Puppeteer will download compatible Chromium 107 to `node_modules/puppeteer-core/.local-chromium/`
3. **Keep whatsapp-web.js updated** - Use version 1.34.1+ which includes fixes for "ready event stuck" issues
4. **Use `headless: true`** - Works reliably with Puppeteer's bundled Chromium

**What We Fixed**:
- Upgraded `whatsapp-web.js` from 1.32.0 → 1.34.1
- Removed hardcoded `executablePath: "/Applications/Chromium.app/..."`
- Added proper error handling with promise rejection
- Added `loading_screen` and `error` event listeners
- Simplified Puppeteer args (removed `--no-zygote`, `--single-process`)

### QR Code Not Appearing

If the QR code doesn't appear after 30-60 seconds:
1. Check if Chromium is downloading: `ls -la node_modules/puppeteer-core/.local-chromium/`
2. Check for errors in terminal output
3. Ensure no other process is using port 3000: `lsof -ti:3000`
4. Delete auth folder and restart: `rm -rf .wwebjs_auth/ && bun dev`

### Session Persistence Issues

If you need to re-authenticate frequently:
1. Don't delete `.wwebjs_auth/` folder - This contains your session
2. Ensure the folder has write permissions
3. Check `LocalAuth` configuration in `WhatsappClient.ts`

## 📡 API

All requests require:

```bash
x-api-key: your-api-key
```

If the API key is missing or invalid, you’ll get:

```json
{
    "message": "Unauthorized"
}
```


### Get QR Code

```bash
GET /api/v1/qr-code
x-api-key: your-api-key
```

Gets the QR code needed for initial authentication with WhatsApp Web.

Response – QR Available

```json
{
    "message": "Scan this QR code with WhatsApp",
    "status": "qr",
    "qrCode": "QR_CODE_DATA"
}
```

Response – Already Connected

```json
{
    "message": "Whatsapp is already connected",
    "status": "ready"
}
```

Response – Not Available Yet

```json
{
    "message": "QR code not available yet. Please try again.",
    "status": "initializing"
}
```

### Send Message
 ```bash
POST /api/v1/send-message
x-api-key: your-api-key
Content-Type: application/json
```

Sends a WhatsApp message to a phone number.

Request Body

```json
{
    "chatId": "51123456789",
    "message": "Hello from WhatsApp n8n Server"
}
```

> [!NOTE]
> Note: You only need to send the number in international format without the + or @c.us. The server automatically formats it.

Response

```json
{
    "status": "OK",
    "message": "Message sent successfully",
    "data": {
        "chatId": "51123456789",
        "message": "Hello from WhatsApp n8n Server"
    }
}
```

### Reply to a Message

```bash
POST /api/v1/reply-message
x-api-key: your-api-key
Content-Type: application/json
```

Replies to a specific WhatsApp message.

Request Body

```json
{
    "chatId": "51123456789",
    "messageId": "MESSAGE_ID",
    "message": "This is a reply message from Whatsapp n8n Server"
}
```

Response

```json
{
    "status": "OK",
    "message": "Reply sent successfully",
    "data": {
        "chatId": "51123456789",
        "messageId": "MESSAGE_ID",
        "message": "This is a reply to your message"
    }
}
```

### Broadcast Message

```bash
POST /api/v1/broadcast-message
x-api-key: your-api-key
Content-Type: application/json
```

Sends the same WhatsApp message to multiple phone numbers with anti-ban protection.

Request Body

```json
{
    "chatIds": ["51123456789", "51987654321", "51555666777"],
    "message": "Hello everyone from WhatsApp n8n Server."
}
```

Response

```json
    {
        "status": "OK",
        "message": "Broadcast message sent successfully",
        "data": {
            "chatIds": ["51123456789", "51987654321", "51555666777"],
            "message": "Hello everyone from WhatsApp n8n Server."
        }
    }
```

> [!IMPORTANT]
> Anti-Ban Protection: Each broadcast message has a configurable delay (BROADCAST_DELAY_MS). Sending too quickly may result in account restrictions.

## 🔗 Quick Integration with n8n

Here’s how to quickly send a WhatsApp message from n8n using this API:

1. In your n8n workflow, add an HTTP Request node.
2. Configure it as follows:

Method: POST

URL: http://your-server.com/api/v1/send-message

Headers:

```bash
x-api-key: your-api-key
Content-Type: application/json
```

Body (JSON):

```json
{
    "chatId": "51123456789",
    "message": "Hello from WhatsApp n8n Server."
}
```

3. Connect the node to your workflow and execute.

>[!TIP]
>You can use dynamic data from previous nodes in chatId or message to send personalized messages in your workflows.

## 🔧 Technical Details

### Puppeteer & Chrome Compatibility

This project uses:
- **whatsapp-web.js**: 1.34.1
- **Puppeteer**: 18.2.1 (bundled dependency)
- **Compatible Chromium**: 107.0.5296.0 (auto-downloaded by Puppeteer)

**Important Notes**:
- Puppeteer automatically downloads Chromium to `node_modules/puppeteer-core/.local-chromium/mac-1045629/` (or equivalent for your OS)
- The DevTools Protocol has breaking changes between Chromium 107 and modern Chrome 130+
- Using newer Chrome versions causes `ProtocolError: Target closed` crashes
- The `WhatsappClient.ts` configuration intentionally does NOT specify `executablePath` to let Puppeteer use its bundled browser

### Architecture

The codebase follows Clean Architecture with clear separation:
- **Domain Layer**: Entities, Value Objects, Repository interfaces
- **Application Layer**: Use Cases that orchestrate domain logic
- **Infrastructure Layer**: Controllers, Services, Routes, WhatsApp client management
- **Shared Layer**: Configuration, middlewares, dependency injection

See `CLAUDE.md` for detailed architecture documentation.

## 🧑‍💻 Author

Developed by [Nicolas Del Rosario](https://github.com/nicolasdelrosario)

## 📜 License

MIT
