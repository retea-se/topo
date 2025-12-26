#!/bin/bash
# Build utilities for tile pipeline
# Provides preflight checks, progress logging, and timing

# Global variables
BUILD_START_TIME=""
CURRENT_STEP=""
LOG_FILE=""
declare -A STEP_TIMES
declare -A STEP_STATUS

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

initialize_build_run() {
    local preset=$1
    local log_dir=${2:-"logs"}

    BUILD_START_TIME=$(date +%s)
    local timestamp=$(date +%Y%m%d_%H%M%S)

    # Create log directory if it doesn't exist
    mkdir -p "$log_dir"
    LOG_FILE="$log_dir/build_${preset}_${timestamp}.log"

    log_message "Build started for preset: $preset"
    log_message "Log file: $LOG_FILE"
}

log_message() {
    local message=$1
    local level=${2:-"INFO"}

    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_line="[$timestamp] [$level] $message"

    # Write to console with color
    case $level in
        "ERROR") echo -e "${RED}$log_line${NC}" ;;
        "WARN")  echo -e "${YELLOW}$log_line${NC}" ;;
        "OK")    echo -e "${GREEN}$log_line${NC}" ;;
        "STEP")  echo -e "${CYAN}$log_line${NC}" ;;
        *)       echo -e "${GRAY}$log_line${NC}" ;;
    esac

    # Write to log file
    if [ -n "$LOG_FILE" ]; then
        echo "$log_line" >> "$LOG_FILE"
    fi
}

start_build_step() {
    local step_name=$1
    CURRENT_STEP=$step_name
    STEP_TIMES[$step_name]=$(date +%s)
    STEP_STATUS[$step_name]="running"

    log_message "=== Starting: $step_name ===" "STEP"
}

complete_build_step() {
    local step_name=${1:-$CURRENT_STEP}
    local skipped=${2:-false}

    local end_time=$(date +%s)
    local start_time=${STEP_TIMES[$step_name]}
    local duration=$((end_time - start_time))
    local duration_str=$(printf '%02d:%02d' $((duration/60)) $((duration%60)))

    if [ "$skipped" = true ]; then
        STEP_STATUS[$step_name]="skipped"
        log_message "Step '$step_name' skipped" "WARN"
    else
        STEP_STATUS[$step_name]="completed"
        log_message "Step '$step_name' completed in $duration_str" "OK"
    fi
}

fail_build_step() {
    local step_name=${1:-$CURRENT_STEP}
    local error_msg=$2

    STEP_STATUS[$step_name]="failed"
    log_message "Step '$step_name' FAILED: $error_msg" "ERROR"
}

get_build_summary() {
    local end_time=$(date +%s)
    local total_duration=$((end_time - BUILD_START_TIME))
    local total_str=$(printf '%02d:%02d:%02d' $((total_duration/3600)) $(((total_duration%3600)/60)) $((total_duration%60)))

    log_message ""
    log_message "==============================================="
    log_message "BUILD SUMMARY"
    log_message "==============================================="
    log_message "Total duration: $total_str"
    log_message ""
    log_message "Step durations:"

    local completed=0
    local failed=0
    local skipped=0

    for step in "${!STEP_STATUS[@]}"; do
        local status=${STEP_STATUS[$step]}
        case $status in
            "completed") completed=$((completed + 1)); icon="[OK]" ;;
            "failed")    failed=$((failed + 1)); icon="[FAIL]" ;;
            "skipped")   skipped=$((skipped + 1)); icon="[SKIP]" ;;
            *)           icon="[?]" ;;
        esac
        log_message "  $icon $step"
    done

    log_message ""
    log_message "Completed: $completed | Skipped: $skipped | Failed: $failed"
}

test_preflight() {
    local preset=$1
    local required_disk_gb=${2:-5}
    local required_memory_gb=${3:-4}

    log_message "Running preflight checks..." "STEP"
    local all_passed=true

    # Check Docker is running
    if docker info >/dev/null 2>&1; then
        log_message "Docker: OK" "OK"
    else
        log_message "Docker is not running!" "ERROR"
        all_passed=false
    fi

    # Check disk space
    local free_space_gb=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$free_space_gb" -lt "$required_disk_gb" ]; then
        log_message "Disk space: INSUFFICIENT (${free_space_gb}GB free, need ${required_disk_gb}GB)" "ERROR"
        all_passed=false
    else
        log_message "Disk space: OK (${free_space_gb}GB free)" "OK"
    fi

    # Check available memory
    if command -v free >/dev/null 2>&1; then
        local free_memory_gb=$(free -g | awk '/^Mem:/{print $7}')
        if [ "$free_memory_gb" -lt "$required_memory_gb" ]; then
            log_message "Memory: LOW (${free_memory_gb}GB free, recommend ${required_memory_gb}GB)" "WARN"
        else
            log_message "Memory: OK (${free_memory_gb}GB free)" "OK"
        fi
    else
        log_message "Memory check: Skipped (free command not available)" "WARN"
    fi

    # Check Docker volumes/data
    if docker volume ls -q 2>/dev/null | grep -q "topo"; then
        log_message "Docker volumes: Found topo volumes" "OK"
    else
        log_message "Docker volumes: No topo volumes found (will be created)" "WARN"
    fi

    if [ "$all_passed" = true ]; then
        return 0
    else
        return 1
    fi
}

get_estimated_build_time() {
    local preset=$1

    case $preset in
        "stockholm_core")
            echo "15"
            ;;
        "stockholm_wide")
            echo "40"
            ;;
        "svealand")
            echo "180"
            ;;
        *)
            echo "60"
            ;;
    esac
}

show_build_plan() {
    local preset=$1
    local skip_osm=${2:-false}
    local skip_terrain=${3:-false}

    local estimate=$(get_estimated_build_time "$preset")

    echo ""
    echo -e "${CYAN}BUILD PLAN${NC}"
    echo -e "${CYAN}==========${NC}"
    echo ""
    echo "Preset: $preset"
    echo "Estimated total time: ~$estimate minutes"
    echo ""
    echo "Steps to execute:"

    if [ "$skip_osm" = false ]; then
        echo "  1. Download/clip OSM data"
        echo "  2. Generate OSM tiles"
    else
        echo "  1-2. [SKIP] OSM data"
    fi

    if [ "$skip_terrain" = false ]; then
        echo "  3. Generate hillshade"
        echo "  4. Generate hillshade tiles"
        echo "  5. Extract contours"
        echo "  6. Generate contour tiles"
    else
        echo "  3-6. [SKIP] Terrain data"
    fi

    echo "  7. Verification"
    echo ""
}

save_build_state() {
    local preset=$1
    local state_file="logs/build_${preset}_state.json"

    # Simple state save (could be expanded)
    echo "{\"preset\": \"$preset\", \"timestamp\": \"$(date -Iseconds)\"}" > "$state_file"
    log_message "Build state saved to: $state_file"
}

get_build_state() {
    local preset=$1
    local state_file="logs/build_${preset}_state.json"

    if [ -f "$state_file" ]; then
        cat "$state_file"
    else
        echo ""
    fi
}
