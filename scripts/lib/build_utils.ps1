# Build utilities for tile pipeline
# Provides preflight checks, progress logging, and timing

# Global variables
$script:BuildStartTime = $null
$script:StepTimes = @{}
$script:CurrentStep = $null
$script:LogFile = $null

function Initialize-BuildRun {
    param(
        [string]$Preset,
        [string]$LogDir = "logs"
    )

    $script:BuildStartTime = Get-Date
    $timestamp = $script:BuildStartTime.ToString("yyyyMMdd_HHmmss")

    # Create log directory if it doesn't exist
    $logPath = Join-Path $PWD $LogDir
    if (-not (Test-Path $logPath)) {
        New-Item -ItemType Directory -Path $logPath -Force | Out-Null
    }

    $script:LogFile = Join-Path $logPath "build_${Preset}_${timestamp}.log"

    Write-Log "Build started for preset: $Preset"
    Write-Log "Log file: $($script:LogFile)"
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")

    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $logMessage = "[$timestamp] [$Level] $Message"

    # Write to console with color
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARN"  { Write-Host $logMessage -ForegroundColor Yellow }
        "OK"    { Write-Host $logMessage -ForegroundColor Green }
        "STEP"  { Write-Host $logMessage -ForegroundColor Cyan }
        default { Write-Host $logMessage -ForegroundColor Gray }
    }

    # Write to log file
    if ($script:LogFile) {
        Add-Content -Path $script:LogFile -Value $logMessage
    }
}

function Start-BuildStep {
    param([string]$StepName)

    $script:CurrentStep = $StepName
    $script:StepTimes[$StepName] = @{
        Start = Get-Date
        End = $null
        Duration = $null
        Status = "running"
    }

    Write-Log "=== Starting: $StepName ===" -Level "STEP"
}

function Complete-BuildStep {
    param(
        [string]$StepName = $script:CurrentStep,
        [switch]$Skipped
    )

    if ($script:StepTimes.ContainsKey($StepName)) {
        $script:StepTimes[$StepName].End = Get-Date
        $script:StepTimes[$StepName].Duration = $script:StepTimes[$StepName].End - $script:StepTimes[$StepName].Start

        if ($Skipped) {
            $script:StepTimes[$StepName].Status = "skipped"
            Write-Log "Step '$StepName' skipped" -Level "WARN"
        } else {
            $script:StepTimes[$StepName].Status = "completed"
            $duration = $script:StepTimes[$StepName].Duration.ToString("mm\:ss")
            Write-Log "Step '$StepName' completed in $duration" -Level "OK"
        }
    }
}

function Fail-BuildStep {
    param(
        [string]$StepName = $script:CurrentStep,
        [string]$Error
    )

    if ($script:StepTimes.ContainsKey($StepName)) {
        $script:StepTimes[$StepName].End = Get-Date
        $script:StepTimes[$StepName].Duration = $script:StepTimes[$StepName].End - $script:StepTimes[$StepName].Start
        $script:StepTimes[$StepName].Status = "failed"
        $script:StepTimes[$StepName].Error = $Error
    }

    Write-Log "Step '$StepName' FAILED: $Error" -Level "ERROR"
}

function Get-BuildSummary {
    $totalDuration = (Get-Date) - $script:BuildStartTime

    Write-Log ""
    Write-Log "==============================================="
    Write-Log "BUILD SUMMARY"
    Write-Log "==============================================="
    Write-Log "Total duration: $($totalDuration.ToString('hh\:mm\:ss'))"
    Write-Log ""
    Write-Log "Step durations:"

    $completedSteps = 0
    $failedSteps = 0
    $skippedSteps = 0

    foreach ($step in $script:StepTimes.Keys) {
        $info = $script:StepTimes[$step]
        $durationStr = if ($info.Duration) { $info.Duration.ToString("mm\:ss") } else { "N/A" }
        $statusIcon = switch ($info.Status) {
            "completed" { "[OK]"; $completedSteps++ }
            "failed"    { "[FAIL]"; $failedSteps++ }
            "skipped"   { "[SKIP]"; $skippedSteps++ }
            default     { "[?]" }
        }
        Write-Log "  $statusIcon $step : $durationStr"
    }

    Write-Log ""
    Write-Log "Completed: $completedSteps | Skipped: $skippedSteps | Failed: $failedSteps"

    return @{
        TotalDuration = $totalDuration
        Steps = $script:StepTimes
        Completed = $completedSteps
        Failed = $failedSteps
        Skipped = $skippedSteps
    }
}

function Test-Preflight {
    param(
        [string]$Preset,
        [int]$RequiredDiskGB = 5,
        [int]$RequiredMemoryGB = 4
    )

    Write-Log "Running preflight checks..." -Level "STEP"
    $allPassed = $true

    # Check Docker is running
    try {
        $null = docker info 2>$null
        Write-Log "Docker: OK" -Level "OK"
    } catch {
        Write-Log "Docker is not running!" -Level "ERROR"
        $allPassed = $false
    }

    # Check disk space
    $drive = (Get-Location).Drive
    $freeSpaceGB = [math]::Round((Get-PSDrive $drive.Name).Free / 1GB, 2)
    if ($freeSpaceGB -lt $RequiredDiskGB) {
        Write-Log "Disk space: INSUFFICIENT ($freeSpaceGB GB free, need $RequiredDiskGB GB)" -Level "ERROR"
        $allPassed = $false
    } else {
        Write-Log "Disk space: OK ($freeSpaceGB GB free)" -Level "OK"
    }

    # Check available memory
    $os = Get-CimInstance Win32_OperatingSystem
    $freeMemoryGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
    if ($freeMemoryGB -lt $RequiredMemoryGB) {
        Write-Log "Memory: LOW ($freeMemoryGB GB free, recommend $RequiredMemoryGB GB)" -Level "WARN"
    } else {
        Write-Log "Memory: OK ($freeMemoryGB GB free)" -Level "OK"
    }

    # Check Docker volumes/data
    $volumeCheck = docker volume ls -q 2>$null | Select-String "topo"
    if ($volumeCheck) {
        Write-Log "Docker volumes: Found topo volumes" -Level "OK"
    } else {
        Write-Log "Docker volumes: No topo volumes found (will be created)" -Level "WARN"
    }

    return $allPassed
}

function Get-EstimatedBuildTime {
    param([string]$Preset)

    # Estimated build times based on preset complexity
    $estimates = @{
        "stockholm_core" = @{
            OSM = 2
            Hillshade = 1
            HillshadeTiles = 2
            Contours = 3
            ContourTiles = 5
            Total = 15
        }
        "stockholm_wide" = @{
            OSM = 5
            Hillshade = 3
            HillshadeTiles = 5
            Contours = 8
            ContourTiles = 15
            Total = 40
        }
        "svealand" = @{
            OSM = 20
            Hillshade = 15
            HillshadeTiles = 30
            Contours = 45
            ContourTiles = 60
            Total = 180
        }
    }

    if ($estimates.ContainsKey($Preset)) {
        return $estimates[$Preset]
    }

    return @{ Total = 60 }  # Default estimate
}

function Show-BuildPlan {
    param(
        [string]$Preset,
        [switch]$SkipOsm,
        [switch]$SkipTerrain
    )

    $estimates = Get-EstimatedBuildTime -Preset $Preset

    Write-Host ""
    Write-Host "BUILD PLAN" -ForegroundColor Cyan
    Write-Host "==========" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Preset: $Preset"
    Write-Host "Estimated total time: ~$($estimates.Total) minutes"
    Write-Host ""
    Write-Host "Steps to execute:"

    if (-not $SkipOsm) {
        Write-Host "  1. Download/clip OSM data (~$($estimates.OSM) min)"
        Write-Host "  2. Generate OSM tiles"
    } else {
        Write-Host "  1-2. [SKIP] OSM data"
    }

    if (-not $SkipTerrain) {
        Write-Host "  3. Generate hillshade (~$($estimates.Hillshade) min)"
        Write-Host "  4. Generate hillshade tiles (~$($estimates.HillshadeTiles) min)"
        Write-Host "  5. Extract contours (~$($estimates.Contours) min)"
        Write-Host "  6. Generate contour tiles (~$($estimates.ContourTiles) min)"
    } else {
        Write-Host "  3-6. [SKIP] Terrain data"
    }

    Write-Host "  7. Verification"
    Write-Host ""
}

function Save-BuildState {
    param(
        [string]$Preset,
        [hashtable]$State
    )

    $stateFile = Join-Path $PWD "logs" "build_${Preset}_state.json"
    $State | ConvertTo-Json -Depth 10 | Set-Content -Path $stateFile
    Write-Log "Build state saved to: $stateFile"
}

function Get-BuildState {
    param([string]$Preset)

    $stateFile = Join-Path $PWD "logs" "build_${Preset}_state.json"
    if (Test-Path $stateFile) {
        return Get-Content -Path $stateFile | ConvertFrom-Json
    }
    return $null
}

# Export functions
Export-ModuleMember -Function @(
    'Initialize-BuildRun',
    'Write-Log',
    'Start-BuildStep',
    'Complete-BuildStep',
    'Fail-BuildStep',
    'Get-BuildSummary',
    'Test-Preflight',
    'Get-EstimatedBuildTime',
    'Show-BuildPlan',
    'Save-BuildState',
    'Get-BuildState'
)
