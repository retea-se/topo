# Chrome DevTools MCP Setup

Denna guide förklarar hur du konfigurerar Chrome DevTools MCP (Model Context Protocol) i din workspace.

## Steg 1: Konfigurera MCP-servern i Cursor

1. Öppna Cursor-inställningar (Ctrl+, eller Cmd+,)
2. Sök efter "MCP" eller "Model Context Protocol"
3. Lägg till följande konfiguration i din MCP-servers lista:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

Alternativt kan du kopiera innehållet från `.cursor/mcp-config.json` till din Cursor MCP-konfiguration.

## Steg 2: Starta Chrome med Remote Debugging

För att Chrome DevTools MCP ska fungera måste Chrome köras med remote debugging aktiverat.

### Windows (PowerShell):
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

### Windows (Command Prompt):
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

### Om Chrome är installerat på annan plats:
Hitta din Chrome-installation och kör:
```bash
chrome.exe --remote-debugging-port=9222
```

## Steg 3: Verifiera installationen

1. Starta om Cursor efter att ha lagt till MCP-konfigurationen
2. Kontrollera att Chrome körs med remote debugging (port 9222)
3. Testa genom att be AI:n att använda Chrome DevTools MCP-verktygen

## Användning

När Chrome DevTools MCP är konfigurerat kan du använda följande funktioner:
- Navigera till webbadresser
- Ta skärmdumpar
- Köra JavaScript i webbläsaren
- Övervaka nätverkstrafik
- Interagera med webbsidor

## Felsökning

**Problem: MCP-servern startar inte**
- Kontrollera att Node.js version 20.19 eller senare är installerat
- Verifiera att `npx` fungerar genom att köra `npx --version`

**Problem: Kan inte ansluta till Chrome**
- Se till att Chrome körs med `--remote-debugging-port=9222`
- Kontrollera att port 9222 inte används av någon annan process
- Försök öppna `http://localhost:9222/json` i webbläsaren för att verifiera att remote debugging fungerar

**Problem: MCP-verktyg visas inte i Cursor**
- Starta om Cursor efter att ha lagt till konfigurationen
- Kontrollera att konfigurationen är korrekt formaterad JSON
- Se till att du har rätt behörigheter i Cursor-inställningarna



