# WhatsApp N8N Server – Automate WhatsApp Messaging via REST API + N8N

A Node.js server that integrates with WhatsApp Web via `whatsapp-web.js`, enabling automated message sending through a REST API. Built with Clean Architecture principles.


## ✨ Features

- WhatsApp Web integration using [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js)
- REST API endpoint for sending and replying to messages
- QR code authentication
- Session persistence with `LocalAuth`
- Clean Architecture

## ⚙️ Prerequisites

- Node.js v18 or higher
- A WhatsApp account
- A smartphone with WhatsApp installed
- Package manager: Bun (recommended)

> [!NOTE]
> This project uses Bun for local development and scripting, but is fully compatible with any Node.js-compatible package manager.

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

Edit the `.env` file and set your own API key:  

```
    API_KEY=your-secure-api-key
```

## 🧪 Usage

Start development mode

```bash
    bun dev
```

- On first run, a QR code will appear in the terminal.
- Scan it using WhatsApp on your phone to authenticate.
- Once authenticated, your session will be saved.

Server will run on:

```bash
    http://localhost:3000
```

## 📡 API

All API requests require authentication using the `x-api-key` header.

```bash
    x-api-key: your-api-key
```

The API key must be configured in the `.env` file following the example in `.env.example`:

```bash
    POST /api/v1/send-message
```

 If a valid API key is not provided, the API will respond with a 401 Unauthorized error:

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

🔸 Response (when QR code is available)

```json
    {
        "message": "Scan this QR code with WhatsApp",
        "status": "qr",
        "qrCode": "QR_CODE_DATA"
    }
```

🔸 Response (when WhatsApp is already connected)

```json
    {
        "message": "Whatsapp is already connected",
        "status": "ready"
    }
```

🔸 Response (when QR code is not yet available)

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

🔸 Request Body (JSON)

```json
    {
        "chatId": "51123456789",
        "message": "Hello from WhatsApp N8N Server"
    }
```

`chatId:` Phone number in international format (without +)

`message:` The message to send

🔸 Response

```json
    {
        "status": "OK",
        "message": "Message sent successfully",
        "data": {
            "chatId": "51123456789",
            "message": "Hello from WhatsApp N8N Server"
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

🔸 Request Body (JSON)

```json
    {
        "chatId": "51123456789",
        "messageId": "MESSAGE_ID",
        "message": "This is a reply message"
    }
```

`chatId:` Phone number in international format (without +)

`messageId:` ID of the message being replied to

`message:` The reply message

🔸 Response

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

## 🧑‍💻 Author

Developed by [Nicolas Del Rosario](https://github.com/nicolasdelrosario)

## 📜 License

MIT
