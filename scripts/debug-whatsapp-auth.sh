#!/bin/bash

echo "=== WhatsApp Authentication Debug ==="
echo ""

# Check session directory
echo "1. Session Directory Status:"
if [ -d ".wwebjs_auth/session-whatsapp-n8n-server" ]; then
    echo "   ✓ Session directory exists"
    echo "   Contents:"
    ls -la .wwebjs_auth/session-whatsapp-n8n-server/ | head -10
else
    echo "   ✗ Session directory does NOT exist (first time setup)"
fi
echo ""

# Check running processes
echo "2. Running Chromium Processes:"
CHROMIUM_COUNT=$(ps aux | grep -c "[C]hromium.*whatsapp-n8n-server")
echo "   Count: $CHROMIUM_COUNT"
if [ "$CHROMIUM_COUNT" -gt 0 ]; then
    ps aux | grep "[C]hromium.*whatsapp-n8n-server" | head -3
fi
echo ""

# Check server status
echo "3. Server Status:"
if curl -sS http://localhost:3000/api/v1/qr-code -H "x-api-key: your-api-key" > /dev/null 2>&1; then
    echo "   ✓ Server is responding"
    STATUS=$(curl -sS http://localhost:3000/api/v1/qr-code -H "x-api-key: your-api-key" | jq -r '.status')
    echo "   WhatsApp Status: $STATUS"
    
    case "$STATUS" in
        "ready")
            echo "   ✓ WhatsApp is AUTHENTICATED and READY"
            ;;
        "qr")
            echo "   ⚠ Waiting for QR code scan"
            echo ""
            echo "   Get QR code with:"
            echo "   curl -sS http://localhost:3000/api/v1/qr-code -H \"x-api-key: your-api-key\" | jq -r '.qrCode'"
            ;;
        "authenticating")
            echo "   ⏳ QR scanned, waiting for authentication to complete"
            ;;
        "disconnected")
            echo "   ✗ WhatsApp client is DISCONNECTED"
            ;;
        *)
            echo "   ? Unknown status: $STATUS"
            ;;
    esac
else
    echo "   ✗ Server is NOT responding"
fi
echo ""

# What should happen
echo "4. Expected Authentication Flow:"
echo "   Step 1: Server starts → Client initializes → Status: 'disconnected'"
echo "   Step 2: Client checks for session → Not found (first time)"
echo "   Step 3: Client generates QR code → Status: 'qr'"
echo "   Step 4: User scans QR with WhatsApp mobile"
echo "   Step 5: WhatsApp emits 'authenticated' event → Status: 'authenticating'"
echo "   Step 6: WhatsApp emits 'ready' event → Status: 'ready' ✓"
echo "   Step 7: Session saved to .wwebjs_auth/"
echo ""

# What's actually happening
echo "5. Current Issue:"
echo "   ERROR: Puppeteer/Chromium is crashing with 'ProtocolError: Target closed'"
echo "   This means the browser process is terminating unexpectedly"
echo ""
echo "   Possible causes:"
echo "   - Multiple Chromium instances conflicting"
echo "   - Insufficient system resources"
echo "   - Corrupted Chromium installation"
echo "   - macOS security restrictions"
echo ""

echo "6. Recommended Actions:"
echo "   a) Kill all Chromium processes:"
echo "      pkill -f 'whatsapp-n8n-server.*Chromium'"
echo ""
echo "   b) Clear session data:"
echo "      rm -rf .wwebjs_auth/session-whatsapp-n8n-server"
echo ""
echo "   c) Reinstall Chromium (whatsapp-web.js dependency):"
echo "      rm -rf node_modules/puppeteer-core/.local-chromium"
echo "      bun install --force"
echo ""
echo "   d) Restart server:"
echo "      bun dev"
echo ""

echo "=== End Debug ==="


