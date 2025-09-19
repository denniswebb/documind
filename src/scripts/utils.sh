#!/bin/bash

# DocuMind Bash Utilities - Shared Functions Library
# Provides common functions for logging, error handling, dependency checking, and file operations

# Version and metadata
DOCUMIND_UTILS_VERSION="1.0.0"

# Colors for output (compatible with bash 3.2+)
COLOR_RESET="\033[0m"
COLOR_BRIGHT="\033[1m"
COLOR_NEON_PINK="\033[95m"
COLOR_NEON_CYAN="\033[96m"
COLOR_ELECTRIC_BLUE="\033[94m"
COLOR_HOT_PINK="\033[91m"
COLOR_SYNTH_WAVE="\033[93m"
COLOR_WHITE="\033[37m"
COLOR_RED="\033[31m"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_GRAY="\033[90m"

# Function to get color by name (for compatibility)
get_color() {
    case "$1" in
        reset) echo "$COLOR_RESET" ;;
        bright) echo "$COLOR_BRIGHT" ;;
        neon_pink) echo "$COLOR_NEON_PINK" ;;
        neon_cyan) echo "$COLOR_NEON_CYAN" ;;
        electric_blue) echo "$COLOR_ELECTRIC_BLUE" ;;
        hot_pink) echo "$COLOR_HOT_PINK" ;;
        synth_wave) echo "$COLOR_SYNTH_WAVE" ;;
        white) echo "$COLOR_WHITE" ;;
        red) echo "$COLOR_RED" ;;
        green) echo "$COLOR_GREEN" ;;
        yellow) echo "$COLOR_YELLOW" ;;
        gray) echo "$COLOR_GRAY" ;;
        *) echo "" ;;
    esac
}

# COLORS associative array for bash 4+ compatibility
# For bash 3.2, fall back to get_color function
if [[ ${BASH_VERSION%%.*} -ge 4 ]]; then
    declare -A COLORS=(
        ["reset"]="$COLOR_RESET"
        ["bright"]="$COLOR_BRIGHT"
        ["neon_pink"]="$COLOR_NEON_PINK"
        ["neon_cyan"]="$COLOR_NEON_CYAN"
        ["electric_blue"]="$COLOR_ELECTRIC_BLUE"
        ["hot_pink"]="$COLOR_HOT_PINK"
        ["synth_wave"]="$COLOR_SYNTH_WAVE"
        ["white"]="$COLOR_WHITE"
        ["red"]="$COLOR_RED"
        ["green"]="$COLOR_GREEN"
        ["yellow"]="$COLOR_YELLOW"
        ["gray"]="$COLOR_GRAY"
    )
fi
# Note: For bash 3.2, COLORS array is not available, use get_color function instead

# Legacy COLORS array for backward compatibility (simple variable approach)
# Uses eval to simulate associative array access: ${COLORS[key]} becomes $(get_colors key)
get_colors() {
    get_color "$1"
}

# Get the directory where utils.sh lives - reliable in all environments
UTILS_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Global configuration
DOCUMIND_DEBUG=${DOCUMIND_DEBUG:-false}
DOCUMIND_QUIET=${DOCUMIND_QUIET:-false}

# Initialize DocuMind paths based on utils.sh location
init_documind_paths() {
    if [[ "$UTILS_SCRIPT_DIR" == */src/scripts ]]; then
        # Development mode - utils.sh is in src/scripts
        DOCUMIND_ROOT_DIR="$(dirname "$(dirname "$UTILS_SCRIPT_DIR")")"
        DOCUMIND_SCRIPTS_DIR="$UTILS_SCRIPT_DIR"
        DOCUMIND_NODE_SCRIPTS_DIR="$UTILS_SCRIPT_DIR"
    elif [[ "$UTILS_SCRIPT_DIR" == */.documind/scripts ]]; then
        # Installed mode - utils.sh is in .documind/scripts
        DOCUMIND_ROOT_DIR="$(dirname "$(dirname "$UTILS_SCRIPT_DIR")")"
        DOCUMIND_SCRIPTS_DIR="$UTILS_SCRIPT_DIR"
        DOCUMIND_NODE_SCRIPTS_DIR="$UTILS_SCRIPT_DIR"
    else
        # Simple fallback using utils.sh location
        DOCUMIND_ROOT_DIR="$(dirname "$(dirname "$UTILS_SCRIPT_DIR")")"
        DOCUMIND_SCRIPTS_DIR="$UTILS_SCRIPT_DIR"
        DOCUMIND_NODE_SCRIPTS_DIR="$UTILS_SCRIPT_DIR"
    fi
}

DOCUMIND_ROOT_DIR=""
DOCUMIND_SCRIPTS_DIR=""
DOCUMIND_NODE_SCRIPTS_DIR=""

# Logging functions
log_info() {
    if [[ "$DOCUMIND_QUIET" != "true" ]]; then
        echo -e "${COLOR_ELECTRIC_BLUE}ℹ️  $*${COLOR_RESET}"
    fi
}

log_success() {
    if [[ "$DOCUMIND_QUIET" != "true" ]]; then
        echo -e "${COLOR_GREEN}✅ $*${COLOR_RESET}"
    fi
}

log_warning() {
    echo -e "${COLOR_SYNTH_WAVE}⚠️  $*${COLOR_RESET}" >&2
}

log_error() {
    echo -e "${COLOR_HOT_PINK}❌ $*${COLOR_RESET}" >&2
}

log_debug() {
    if [[ "$DOCUMIND_DEBUG" == "true" ]]; then
        echo -e "${COLOR_GRAY}🐛 DEBUG: $*${COLOR_RESET}" >&2
    fi
}

log_header() {
    if [[ "$DOCUMIND_QUIET" != "true" ]]; then
        echo -e "${COLOR_NEON_PINK}$*${COLOR_RESET}"
    fi
}

log_subheader() {
    if [[ "$DOCUMIND_QUIET" != "true" ]]; then
        echo -e "${COLOR_NEON_CYAN}$*${COLOR_RESET}"
    fi
}

# Error handling
die() {
    log_error "$*"
    exit 1
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if file exists and is readable
file_readable() {
    [[ -r "$1" ]]
}

# Check if directory exists
dir_exists() {
    [[ -d "$1" ]]
}

# Create directory safely
safe_mkdir() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        mkdir -p "$dir" || die "Failed to create directory: $dir"
        log_debug "Created directory: $dir"
    fi
}

# Get absolute path
get_abs_path() {
    local path="$1"
    if [[ -d "$path" ]]; then
        (cd "$path" && pwd)
    elif [[ -f "$path" ]]; then
        local dir=$(dirname "$path")
        local file=$(basename "$path")
        (cd "$dir" && echo "$PWD/$file")
    else
        echo "$(cd "$(dirname "$path")" 2>/dev/null && pwd)/$(basename "$path")"
    fi
}

# Validate JSON output
is_valid_json() {
    local input="$1"
    echo "$input" | jq . >/dev/null 2>&1
}

# Safe JSON parsing with error handling
safe_jq() {
    local json_input="$1"
    local query="$2"
    local default_value="${3:-}"

    if [[ -z "$json_input" ]]; then
        echo "$default_value"
        return 1
    fi

    if ! is_valid_json "$json_input"; then
        if [[ "$DOCUMIND_DEBUG" == "true" ]]; then
            echo "Warning: Invalid JSON input for query '$query'" >&2
        fi
        echo "$default_value"
        return 1
    fi

    local result
    if result=$(echo "$json_input" | jq -r "$query" 2>/dev/null); then
        echo "$result"
        return 0
    else
        if [[ "$DOCUMIND_DEBUG" == "true" ]]; then
            echo "Warning: JSON query failed: '$query'" >&2
        fi
        echo "$default_value"
        return 1
    fi
}

# Parse command line arguments helper
parse_args() {
    local -n args_ref=$1
    shift

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                args_ref["help"]=true
                shift
                ;;
            -v|--verbose|--debug)
                DOCUMIND_DEBUG=true
                args_ref["debug"]=true
                shift
                ;;
            -q|--quiet)
                DOCUMIND_QUIET=true
                args_ref["quiet"]=true
                shift
                ;;
            --json)
                args_ref["output_format"]="json"
                shift
                ;;
            --format=*)
                args_ref["output_format"]="${1#*=}"
                shift
                ;;
            --budget=*)
                args_ref["budget"]="${1#*=}"
                shift
                ;;
            --strategy=*)
                args_ref["strategy"]="${1#*=}"
                shift
                ;;
            --level=*)
                args_ref["level"]="${1#*=}"
                shift
                ;;
            --method=*)
                args_ref["method"]="${1#*=}"
                shift
                ;;
            -*)
                die "Unknown option: $1"
                ;;
            *)
                if [[ -z "${args_ref["input"]}" ]]; then
                    args_ref["input"]="$1"
                else
                    args_ref["files"]+="$1 "
                fi
                shift
                ;;
        esac
    done
}

# Node.js script execution helper
run_node_script() {
    local script_name="$1"
    shift
    local script_path="$DOCUMIND_NODE_SCRIPTS_DIR/$script_name"

    # Try local script path first
    if [[ ! -f "$script_path" ]]; then
        # Fallback: try to resolve via require.resolve for installed packages
        if command_exists node; then
            local resolved_path
            resolved_path=$(node -p "try { require.resolve('@dennis-webb/documind/src/scripts/$script_name') } catch(e) { '' }" 2>/dev/null)
            if [[ -n "$resolved_path" && -f "$resolved_path" ]]; then
                script_path="$resolved_path"
                log_debug "Resolved script via require.resolve: $script_path"
            else
                # Try ESM import resolution
                local esm_resolved_path
                esm_resolved_path=$(node -e "
                    import('@dennis-webb/documind/src/scripts/$script_name').then(
                        () => console.log('ESM_AVAILABLE'),
                        () => console.log('ESM_FAILED')
                    ).catch(() => console.log('ESM_FAILED'))
                " 2>/dev/null)

                if [[ "$esm_resolved_path" == "ESM_AVAILABLE" ]]; then
                    # Try to get package root and build path
                    local package_root
                    package_root=$(node -p "try { require.resolve('@dennis-webb/documind/package.json') } catch(e) { '' }" 2>/dev/null)
                    if [[ -n "$package_root" ]]; then
                        local package_dir
                        package_dir=$(dirname "$package_root")
                        local potential_script="$package_dir/src/scripts/$script_name"
                        if [[ -f "$potential_script" ]]; then
                            script_path="$potential_script"
                            log_debug "Resolved script via package path: $script_path"
                        else
                            die "Node.js script not found: $script_name (tried local, require.resolve, and package path resolution)"
                        fi
                    else
                        die "Node.js script not found: $script_name (package resolution failed)"
                    fi
                else
                    die "Node.js script not found: $script_name (tried local and package resolution)"
                fi
            fi
        else
            die "Node.js script not found: $script_path (Node.js required for fallback resolution)"
        fi
    fi

    if ! command_exists node; then
        die "Node.js is required but not installed"
    fi

    log_debug "Running Node.js script: $script_path $*"
    node "$script_path" "$@"
}

# Check Node.js package availability
check_node_package() {
    local package="$1"
    local package_path="$DOCUMIND_ROOT_DIR/node_modules/$package"

    if [[ -d "$package_path" ]]; then
        return 0
    fi

    # Try to check if package is available globally or in current project
    if command_exists npm; then
        npm list "$package" >/dev/null 2>&1 && return 0
        npm list -g "$package" >/dev/null 2>&1 && return 0
    fi

    return 1
}

# Get file count in directory with pattern
count_files() {
    local dir="$1"
    local pattern="${2:-*}"

    if [[ ! -d "$dir" ]]; then
        echo "0"
        return
    fi

    find "$dir" -name "$pattern" -type f 2>/dev/null | wc -l
}

# Format bytes to human readable
format_bytes() {
    local bytes="$1"
    if [[ $bytes -lt 1024 ]]; then
        echo "${bytes}B"
    elif [[ $bytes -lt 1048576 ]]; then
        echo "$(($bytes / 1024))KB"
    elif [[ $bytes -lt 1073741824 ]]; then
        echo "$(($bytes / 1048576))MB"
    else
        echo "$(($bytes / 1073741824))GB"
    fi
}

# Get file size
get_file_size() {
    local file="$1"
    if [[ -f "$file" ]]; then
        wc -c < "$file" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Get line count
get_line_count() {
    local file="$1"
    if [[ -f "$file" ]]; then
        wc -l < "$file" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# JSON output helpers
output_json() {
    local json="$1"
    if is_valid_json "$json"; then
        echo "$json"
    else
        echo '{"error": "Invalid JSON output", "raw": "'"$json"'"}'
    fi
}

# Create JSON status object
create_status_json() {
    local status="$1"
    local message="$2"
    local data="${3:-{}}"

    jq -n \
        --arg status "$status" \
        --arg message "$message" \
        --argjson data "$data" \
        '{status: $status, message: $message, data: $data, timestamp: now}'
}

# Validate file path
validate_file_path() {
    local file="$1"
    local require_exists="${2:-false}"
    local max_size_mb="${3:-50}"  # Default 50MB limit

    if [[ -z "$file" ]]; then
        die "File path cannot be empty"
    fi

    if [[ "$require_exists" == "true" && ! -f "$file" ]]; then
        die "File does not exist: $file"
    fi

    # Check file size if it exists
    if [[ -f "$file" ]]; then
        local file_size_bytes
        if command -v stat >/dev/null 2>&1; then
            # Try different stat formats for cross-platform compatibility
            if stat -c "%s" "$file" >/dev/null 2>&1; then
                file_size_bytes=$(stat -c "%s" "$file")
            elif stat -f "%z" "$file" >/dev/null 2>&1; then
                file_size_bytes=$(stat -f "%z" "$file")
            else
                # Fallback: use wc -c
                file_size_bytes=$(wc -c < "$file" | xargs)
            fi
        else
            file_size_bytes=$(wc -c < "$file" | xargs)
        fi

        # Convert to MB and check limit
        local file_size_mb=$((file_size_bytes / 1048576))
        if [[ "$file_size_mb" -gt "$max_size_mb" ]]; then
            die "File too large: ${file_size_mb}MB exceeds limit of ${max_size_mb}MB: $file"
        fi
    fi

    # Check if file is in a reasonable location (not system directories)
    local abs_path
    abs_path=$(get_abs_path "$file")

    case "$abs_path" in
        /bin/*|/sbin/*|/usr/bin/*|/usr/sbin/*|/system/*|/System/*)
            die "Refusing to operate on system file: $abs_path"
            ;;
    esac
}

# Show script usage template
show_usage() {
    local script_name="$1"
    local description="$2"
    local usage_line="$3"
    local examples="$4"

    cat << EOF
${COLOR_NEON_PINK}$script_name${COLOR_RESET} - $description

${COLOR_NEON_CYAN}USAGE:${COLOR_RESET}
  $usage_line

${COLOR_NEON_CYAN}OPTIONS:${COLOR_RESET}
  -h, --help              Show this help message
  -v, --verbose, --debug  Enable debug output
  -q, --quiet             Suppress non-essential output
  --json                  Output in JSON format

${COLOR_NEON_CYAN}EXAMPLES:${COLOR_RESET}
$examples

${COLOR_NEON_CYAN}ENVIRONMENT:${COLOR_RESET}
  DOCUMIND_DEBUG=true     Enable debug output
  DOCUMIND_QUIET=true     Suppress non-essential output

For more information, see: .documind/scripts/README.md
EOF
}

# Progress indicator for long operations
show_progress() {
    local current="$1"
    local total="$2"
    local description="${3:-Processing}"

    if [[ "$DOCUMIND_QUIET" == "true" ]]; then
        return
    fi

    local percent=$((current * 100 / total))
    local filled=$((percent / 4))
    local empty=$((25 - filled))

    printf "\r${COLOR_ELECTRIC_BLUE}%s: [" "$description"
    printf "%*s" $filled | tr ' ' '█'
    printf "%*s" $empty | tr ' ' '░'
    printf "] %d%% (%d/%d)${COLOR_RESET}" $percent $current $total

    if [[ $current -eq $total ]]; then
        echo
    fi
}

# Initialize paths when sourced
init_documind_paths

# Export functions and variables for use in other scripts
export -f log_info log_success log_warning log_error log_debug log_header log_subheader
export -f die command_exists file_readable dir_exists safe_mkdir get_abs_path
export -f is_valid_json parse_args run_node_script check_node_package
export -f count_files format_bytes get_file_size get_line_count
export -f output_json create_status_json validate_file_path show_usage show_progress is_valid_json safe_jq
export -f get_color get_colors
export DOCUMIND_ROOT_DIR DOCUMIND_SCRIPTS_DIR DOCUMIND_NODE_SCRIPTS_DIR
export DOCUMIND_DEBUG DOCUMIND_QUIET DOCUMIND_UTILS_VERSION

# Export COLORS array if available (bash 4+)
if [[ ${BASH_VERSION%%.*} -ge 4 ]]; then
    export COLORS
fi

log_debug "DocuMind utilities v$DOCUMIND_UTILS_VERSION loaded"
log_debug "Root: $DOCUMIND_ROOT_DIR"
log_debug "Scripts: $DOCUMIND_SCRIPTS_DIR"
log_debug "Node scripts: $DOCUMIND_NODE_SCRIPTS_DIR"