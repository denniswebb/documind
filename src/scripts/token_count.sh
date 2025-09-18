#!/bin/bash

# Token Count Fallback Script for DocuMind
# Uses basic word counting when Node.js/tiktoken unavailable
# 
# Usage: 
#   ./token_count.sh [file]
#   echo "text" | ./token_count.sh

set -euo pipefail

# Configuration
MULTIPLIER="1.33"  # words to tokens approximation
DEBUG=${DEBUG:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    if [[ "$DEBUG" == "true" ]]; then
        echo -e "${YELLOW}[token_count.sh]${NC} $1" >&2
    fi
}

error() {
    echo -e "${RED}Error:${NC} $1" >&2
    exit 1
}

success() {
    echo -e "${GREEN}✓${NC} $1" >&2
}

# Help function
show_help() {
    cat << EOF
Token Count Fallback Script for DocuMind

USAGE:
    $0 [FILE]
    echo "text" | $0

DESCRIPTION:
    Basic token counting using word count approximation.
    Use this when tiktoken/Node.js are not available.

OPTIONS:
    -h, --help      Show this help
    -j, --json      Output JSON format
    -d, --debug     Enable debug output

EXAMPLES:
    $0 README.md
    echo "Hello world" | $0
    $0 --json docs/architecture.md

OUTPUT:
    Default: Just the token count number
    JSON: Structured output with details

ENVIRONMENT:
    DEBUG=true      Enable debug logging
EOF
}

# Parse arguments
JSON_OUTPUT=false
INPUT_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -j|--json)
            JSON_OUTPUT=true
            shift
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -*)
            error "Unknown option: $1"
            ;;
        *)
            INPUT_FILE="$1"
            shift
            ;;
    esac
done

# Check if wc is available
if ! command -v wc &> /dev/null; then
    error "wc command not found. This script requires POSIX wc."
fi

# Function to count words and estimate tokens
count_tokens() {
    local text="$1"
    local words
    local chars
    local lines
    local tokens
    
    # Count words (remove punctuation, split on whitespace)
    words=$(echo "$text" | tr -d '[:punct:]' | wc -w | tr -d ' ')
    
    # Count characters and lines for additional info
    chars=$(echo "$text" | wc -c | tr -d ' ')
    lines=$(echo "$text" | wc -l | tr -d ' ')
    
    # Estimate tokens (words * multiplier, rounded up)
    tokens=$(echo "$words * $MULTIPLIER" | bc -l | cut -d. -f1)
    
    # Add 1 if there was a decimal part (ceiling function)
    if echo "$words * $MULTIPLIER" | bc -l | grep -q '\.'; then
        tokens=$((tokens + 1))
    fi
    
    log "Words: $words, Characters: $chars, Lines: $lines"
    log "Estimated tokens: $tokens (using ${MULTIPLIER}x multiplier)"
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        cat << EOF
{
  "method": "wc",
  "tokens": $tokens,
  "model": "estimated",
  "details": {
    "words": $words,
    "characters": $chars,
    "lines": $lines,
    "multiplier": $MULTIPLIER,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF
    else
        echo "$tokens"
    fi
}

# Main logic
main() {
    local text=""
    
    if [[ -n "$INPUT_FILE" ]]; then
        # Read from file
        if [[ ! -f "$INPUT_FILE" ]]; then
            error "File not found: $INPUT_FILE"
        fi
        
        if [[ ! -r "$INPUT_FILE" ]]; then
            error "File not readable: $INPUT_FILE"
        fi
        
        # Check file size (10MB limit)
        local file_size
        file_size=$(wc -c < "$INPUT_FILE" | tr -d ' ')
        local max_size=$((10 * 1024 * 1024))
        
        if [[ $file_size -gt $max_size ]]; then
            error "File too large: $file_size bytes (max: $max_size)"
        fi
        
        log "Reading file: $INPUT_FILE ($file_size bytes)"
        text=$(cat "$INPUT_FILE")
        
    else
        # Read from stdin
        log "Reading from stdin..."
        
        # Check if stdin has data
        if [[ -t 0 ]]; then
            error "No input provided. Use: $0 <file> or echo 'text' | $0"
        fi
        
        text=$(cat)
    fi
    
    # Check if text is empty
    if [[ -z "$text" ]]; then
        if [[ "$JSON_OUTPUT" == "true" ]]; then
            echo '{"method": "wc", "tokens": 0, "details": {"words": 0, "characters": 0, "lines": 0}}'
        else
            echo "0"
        fi
        return
    fi
    
    # Count tokens
    count_tokens "$text"
}

# Check for bc (basic calculator) for floating point math
if ! command -v bc &> /dev/null; then
    log "bc not found, using integer math (less accurate)"
    # Fallback to integer math
    MULTIPLIER="1"  # Just use word count
fi

# Run main function
main

log "Token counting completed"