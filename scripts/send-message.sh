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

# Determine server port (defaults to 3000 if not set)
PORT="${PORT:-3000}"
BASE_URL="http://localhost:${PORT}"

echo "=== WhatsApp Send Message Debug ==="
echo "URL: ${BASE_URL}/api/v1/send-message"
echo "API Key: ${API_KEY}"
echo "Chat ID: ${chatId}"
echo "==================================="
echo ""

# Add verbose flag and timeout
curl -v --max-time 10 -X POST "${BASE_URL}/api/v1/send-message" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"chatId\":\"$chatId\",\"message\":\"bananas taste great\"}"

echo ""
echo "==================================="
echo "Message request completed for $chatId"