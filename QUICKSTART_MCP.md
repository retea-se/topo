# Snabbstart: Chrome DevTools MCP

## 1. Konfigurera MCP i Cursor

1. Öppna Cursor-inställningar (Ctrl+,)
2. Sök efter "MCP" eller gå till MCP-inställningar
3. Lägg till konfigurationen från `.cursor/mcp-config.json`:

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

4. Starta om Cursor

## 2. Starta Chrome med Remote Debugging

### Windows (PowerShell):
```powershell
.\scripts\start-chrome-debug.ps1
```

### Eller manuellt:
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

## 3. Verifiera

Öppna `http://localhost:9222/json` i webbläsaren - du bör se JSON-data om öppna Chrome-flikar.

## Klart! 🎉

Nu kan du använda Chrome DevTools MCP i Cursor för att:
- Navigera till webbadresser
- Ta skärmdumpar
- Köra JavaScript
- Debugga webbsidor

Se `MCP_SETUP.md` för mer detaljerad information och felsökning.


