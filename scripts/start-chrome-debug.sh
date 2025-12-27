#!/bin/bash
# Bash script för att starta Chrome med remote debugging
# Använd detta för att aktivera Chrome DevTools MCP

# Hitta Chrome-installation (för macOS/Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - försök olika vanliga platser
    CHROME_PATHS=(
        "/usr/bin/google-chrome"
        "/usr/bin/chromium-browser"
        "/usr/bin/chromium"
        "/snap/bin/chromium"
    )

    CHROME_PATH=""
    for path in "${CHROME_PATHS[@]}"; do
        if [ -f "$path" ]; then
            CHROME_PATH="$path"
            break
        fi
    done
else
    echo "OS-typ stöds inte av detta script. Använd PowerShell-scriptet för Windows."
    exit 1
fi

if [ -z "$CHROME_PATH" ] || [ ! -f "$CHROME_PATH" ]; then
    echo "Kunde inte hitta Chrome-installation."
    echo "För macOS: Kontrollera att Chrome är installerat i /Applications/"
    echo "För Linux: Installera Google Chrome eller Chromium"
    exit 1
fi

echo "Startar Chrome med remote debugging på port 9222..."
echo "Chrome-sökväg: $CHROME_PATH"

# Starta Chrome med remote debugging
"$CHROME_PATH" --remote-debugging-port=9222 &

echo "Chrome har startats med remote debugging aktiverat."
echo "Du kan nu använda Chrome DevTools MCP i Cursor."





