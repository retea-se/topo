# Test exports end-to-end for Demo A and Demo B
# Usage: .\test_exports.ps1

$ErrorActionPreference = "Continue"
Add-Type -AssemblyName System.Web

Write-Host "=== Testing Exports End-to-End ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Demo A - Screen mode export
Write-Host "Test 1: Demo A - Screen mode export" -ForegroundColor Yellow
$screenBaseUrl = "http://localhost:8082/render"
$screenParams = "bbox_preset=stockholm_core&theme=paper&render_mode=screen&dpi=150&width_mm=210&height_mm=297"
$screenUrl = "$screenBaseUrl`?$screenParams"
$screenOutput = "export_demo_a_screen.png"

try {
    $response = Invoke-WebRequest -Uri $screenUrl -TimeoutSec 60 -OutFile $screenOutput -ErrorAction Stop
    if (Test-Path $screenOutput) {
        $fileInfo = Get-Item $screenOutput
        Write-Host "OK Screen export successful: $($fileInfo.Length) bytes" -ForegroundColor Green
    } else {
        Write-Host "FAIL Screen export failed: file not created" -ForegroundColor Red
    }
} catch {
    Write-Host "FAIL Screen export failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: Demo A - Print mode export
Write-Host "Test 2: Demo A - Print mode export" -ForegroundColor Yellow
$printBaseUrl = "http://localhost:8082/render"
$printParams = "bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594"
$printUrl = "$printBaseUrl`?$printParams"
$printOutput = "export_demo_a_print.png"

try {
    $response = Invoke-WebRequest -Uri $printUrl -TimeoutSec 120 -OutFile $printOutput -ErrorAction Stop
    if (Test-Path $printOutput) {
        $fileInfo = Get-Item $printOutput
        Write-Host "OK Print export successful: $($fileInfo.Length) bytes" -ForegroundColor Green
    } else {
        Write-Host "FAIL Print export failed: file not created" -ForegroundColor Red
    }
} catch {
    Write-Host "FAIL Print export failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Demo B - PNG export
Write-Host "Test 3: Demo B - PNG export" -ForegroundColor Yellow
$demoBUrl = "http://localhost:5000/render"
$demoBBody = @{
    bbox_preset = "stockholm_core"
    theme = "paper"
    render_mode = "print"
    dpi = 150
    width_mm = 420
    height_mm = 594
    format = "png"
} | ConvertTo-Json
$demoBOutput = "export_demo_b.png"

try {
    $response = Invoke-WebRequest -Uri $demoBUrl -Method Post -Body $demoBBody -ContentType "application/json" -TimeoutSec 120 -OutFile $demoBOutput -ErrorAction Stop
    if (Test-Path $demoBOutput) {
        $fileInfo = Get-Item $demoBOutput
        Write-Host "OK Demo B export successful: $($fileInfo.Length) bytes" -ForegroundColor Green
    } else {
        Write-Host "FAIL Demo B export failed: file not created" -ForegroundColor Red
    }
} catch {
    Write-Host "FAIL Demo B export failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Check exported files:" -ForegroundColor Yellow
if (Test-Path $screenOutput) { Write-Host "  - $screenOutput" }
if (Test-Path $printOutput) { Write-Host "  - $printOutput" }
if (Test-Path $demoBOutput) { Write-Host "  - $demoBOutput" }
