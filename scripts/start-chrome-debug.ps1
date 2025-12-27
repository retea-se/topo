# PowerShell script för att starta Chrome med remote debugging
# Använd detta för att aktivera Chrome DevTools MCP

$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
)

$chromePath = $null
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chromePath = $path
        break
    }
}

if ($null -eq $chromePath) {
    Write-Host "Kunde inte hitta Chrome-installation. Kontrollera att Chrome är installerat." -ForegroundColor Red
    Write-Host "Du kan också ange sökvägen manuellt:" -ForegroundColor Yellow
    Write-Host "  & 'C:\Sökväg\Till\Chrome\chrome.exe' --remote-debugging-port=9222" -ForegroundColor Yellow
    exit 1
}

Write-Host "Startar Chrome med remote debugging på port 9222..." -ForegroundColor Green
Write-Host "Chrome-sökväg: $chromePath" -ForegroundColor Cyan

# Starta Chrome med remote debugging
Start-Process -FilePath $chromePath -ArgumentList "--remote-debugging-port=9222"

Write-Host "Chrome har startats med remote debugging aktiverat." -ForegroundColor Green
Write-Host "Du kan nu använda Chrome DevTools MCP i Cursor." -ForegroundColor Green





