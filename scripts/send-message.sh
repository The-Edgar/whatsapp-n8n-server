#!/bin/bash

# Load API_KEY from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found!"
  exit 1
fi

if [ -z "$API_KEY" ]; then
  echo "API_KEY not set in .env"
  exit 1
fi

chatId="37253451363"

# Check if message argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <message>"
  echo "Example: $0 'Hello, world!'"
  exit 1
fi

message="$1"

# Determine server port (defaults to 3000 if not set)
PORT="${PORT:-3000}"
BASE_URL="http://localhost:${PORT}"

echo "=== WhatsApp Send Message Debug ==="
echo "URL: ${BASE_URL}/api/v1/send-message"
echo "API Key: ${API_KEY}"
echo "Chat ID: ${chatId}"
echo "Message: ${message}"
echo "==================================="
echo ""

# Escape the message for JSON (handle quotes, backslashes, newlines, etc.)
escaped_message=$(printf '%s' "$message" | jq -Rs .)

# Add verbose flag and timeout
curl -v --max-time 10 -X POST "${BASE_URL}/api/v1/send-message" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"chatId\":\"$chatId\",\"message\":$escaped_message}"

echo ""
echo "==================================="
echo "Message request completed for $chatId"