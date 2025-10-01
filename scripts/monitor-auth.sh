#!/bin/bash

echo "Monitoring WhatsApp Authentication Status..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
    STATUS=$(curl -sS http://localhost:3000/api/v1/qr-code -H "x-api-key: your-api-key" 2>/dev/null | jq -r '.status' 2>/dev/null)
    
    if [ -z "$STATUS" ] || [ "$STATUS" = "null" ]; then
        echo "[$(date +%H:%M:%S)] ⏳ Server not responding yet..."
    else
        case "$STATUS" in
            "ready")
                echo "[$(date +%H:%M:%S)] ✅ READY - WhatsApp is authenticated!"
                echo ""
                echo "You can now send messages!"
                exit 0
                ;;
            "qr")
                echo "[$(date +%H:%M:%S)] 📱 QR CODE - Waiting for scan"
                echo "    Run this to get QR: curl -sS http://localhost:3000/api/v1/qr-code -H \"x-api-key: your-api-key\" | jq -r '.qrCode'"
                ;;
            "authenticating")
                echo "[$(date +%H:%M:%S)] ⏳ AUTHENTICATING - QR scanned, finalizing..."
                ;;
            "disconnected")
                echo "[$(date +%H:%M:%S)] ❌ DISCONNECTED - Waiting for initialization..."
                ;;
            *)
                echo "[$(date +%H:%M:%S)] ? Unknown status: $STATUS"
                ;;
        esac
    fi
    
    sleep 2
done


