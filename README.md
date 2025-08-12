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

## 🧑‍💻 Author

Developed by [Nicolas Del Rosario](https://github.com/nicolasdelrosario)

## 📜 License

MIT
