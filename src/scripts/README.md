# DocuMind Bash Utilities

A comprehensive collection of bash utilities for documentation generation, token management, and content validation in DocuMind projects.

## Overview

The DocuMind bash utilities provide powerful command-line tools for managing documentation workflows, token budgets, and content quality. These scripts integrate seamlessly with the DocuMind ecosystem while offering standalone functionality for CI/CD pipelines and development workflows.

## Installation

The bash utilities are automatically installed when you set up DocuMind in your project:

```bash
npx @dennis-webb/documind init
```

After installation, the utilities are available via npm scripts:

```bash
npm run token-count [file]      # Count tokens in files
npm run validate-yaml [file]    # Validate YAML manifests
npm run split-markdown [file]   # Split large markdown files
npm run check-deps              # Check system dependencies
npm run generate-docs [mode]    # Generate documentation
npm run budget-monitor [dir]    # Monitor token budgets
```

## Available Utilities

### 🔢 token-count

Count tokens in text files with tiktoken integration and budget validation.

```bash
# Count tokens in a single file
npm run token-count document.md

# Check against budget
npm run token-count -- --budget=500 *.md

# JSON output for automation
npm run token-count -- --json document.md

# Multiple output formats
npm run token-count -- --format=csv docs/
```

**Features:**
- Tiktoken integration for accurate token counting
- Fallback to heuristic methods when tiktoken unavailable
- Budget validation and compliance checking
- Multiple output formats (text, JSON, CSV)
- Batch processing for multiple files
- Stdin support for pipeline integration

### ✅ validate-yaml

Validate YAML files against DocuMind schemas with comprehensive error reporting.

```bash
# Validate single file
npm run validate-yaml manifest.yaml

# Batch validation
npm run validate-yaml -- docs/ai/*.yaml

# Strict validation mode
npm run validate-yaml -- --strict config.yml

# CI/CD integration
npm run validate-yaml -- --junit --output=results.xml manifests/
```

**Features:**
- Schema validation for DocuMind manifests
- Multiple validation modes (default, strict, syntax-only)
- Batch processing with summary reports
- CI/CD integration with JUnit XML output
- Detailed error messages with line numbers

### ✂️ split-markdown

Intelligently split large markdown files with token budget management.

```bash
# Split by headings
npm run split-markdown -- --strategy=heading large-doc.md

# Split by token budget
npm run split-markdown -- --budget=500 --strategy=token document.md

# Generate navigation index
npm run split-markdown -- --index --output=chunks/ README.md

# Merge split files back
npm run split-markdown -- --merge chunks/
```

**Features:**
- Multiple splitting strategies (heading, token, size, paragraph)
- Token budget compliance
- Navigation index generation
- Cross-reference preservation
- Merge functionality for reconstructing documents
- Integration with `@scil/mdsplit-js` when available

### 🔍 check-dependencies

Verify system dependencies and install missing packages.

```bash
# Check all dependencies
npm run check-deps

# Install missing packages
npm run check-deps -- --install

# System dependencies only
npm run check-deps -- --system-only

# Generate JSON report
npm run check-deps -- --json
```

**Features:**
- System dependency verification
- Node.js package checking
- Automatic installation of missing packages
- Detailed installation instructions
- Multiple output formats

### 📚 generate-docs

Master documentation generation script coordinating the full pipeline.

```bash
# Bootstrap complete documentation
npm run generate-docs bootstrap

# Update existing docs
npm run generate-docs update

# Enable automatic splitting
npm run generate-docs -- --split --budget=4000 bootstrap

# Dry run mode
npm run generate-docs -- --dry-run update
```

**Features:**
- Multiple generation modes (bootstrap, update, expand, analyze)
- Automatic markdown splitting for large files
- Content validation and quality checks
- Dependency verification
- Progress reporting and cleanup

### 📊 budget-monitor

Monitor token budgets across documentation files with real-time tracking.

```bash
# Monitor directory
npm run budget-monitor docs/

# Continuous monitoring
npm run budget-monitor -- --watch docs/

# Alert mode for CI/CD
npm run budget-monitor -- --alert --budget=500 docs/

# Generate Prometheus metrics
npm run budget-monitor -- --prometheus docs/
```

**Features:**
- Real-time budget monitoring
- Multiple output formats (text, JSON, CSV, Prometheus)
- Watch mode for continuous monitoring
- Alert mode with exit codes for automation
- Optimization suggestions and insights

## Shared Utilities

### utils.sh

Common functions library providing consistent behavior across all scripts.

**Key Functions:**
- Logging and error handling
- Color output support
- Dependency checking
- File operations
- JSON processing
- Path management

**Environment Variables:**
- `DOCUMIND_DEBUG=true` - Enable debug output
- `DOCUMIND_QUIET=true` - Suppress non-essential output

## Integration with DocuMind

The bash utilities integrate seamlessly with the DocuMind ecosystem:

### With AI Commands

Use within AI documentation commands for enhanced functionality:

```bash
# Use in /document command workflows
/document "Check token budgets and split any large files"
```

### With Node.js Scripts

Bash utilities complement existing Node.js scripts:

- `token-count` wraps `token_count.js` with enhanced CLI interface
- `validate-yaml` extends `validate_yaml.js` with batch processing
- Both provide fallback methods when Node.js unavailable

### With CI/CD Pipelines

Perfect for automated workflows:

```yaml
# GitHub Actions example
- name: Validate Documentation
  run: |
    npm run check-deps
    npm run validate-yaml docs/
    npm run budget-monitor --alert docs/
```

## Advanced Usage

### Token Budget Management

Create manifest files for per-file budgets:

```yaml
# manifest.yaml
name: project-docs
description: Documentation with custom budgets
budget: 4000  # Default budget
files:
  - path: "README.md"
    budget: 6000
  - path: "api-reference.md"
    budget: 8000
```

Use with budget monitor:

```bash
npm run budget-monitor -- --manifest=manifest.yaml docs/
```

### Pipeline Automation

Chain utilities for complete documentation workflows:

```bash
#!/bin/bash
# docs-pipeline.sh

# Check dependencies
npm run check-deps --fix

# Validate all YAML manifests
npm run validate-yaml docs/

# Generate documentation
npm run generate-docs --split --validate bootstrap

# Monitor final budgets
npm run budget-monitor --alert docs/
```

### Custom Integration

Use utilities in custom scripts:

```bash
#!/bin/bash
source .documind/scripts/utils.sh

# Use shared functions
log_info "Starting custom documentation workflow"

# Call other utilities
.documind/scripts/token-count --json document.md | jq '.tokens'
```

## Output Formats

All utilities support multiple output formats for different use cases:

### Text Format (Default)
Human-readable output with colors and formatting.

### JSON Format
Structured data for programmatic processing:

```json
{
  "file": "document.md",
  "tokens": 1234,
  "status": "ok",
  "timestamp": 1703097600
}
```

### CSV Format
Spreadsheet-compatible for analysis:

```csv
file,tokens,budget,status
document.md,1234,4000,within
```

### Prometheus Format
Metrics for monitoring systems:

```
documind_file_tokens{file="document.md"} 1234
documind_file_budget_usage{file="document.md"} 0.31
```

## Error Handling

The utilities provide comprehensive error handling:

- **Exit Codes**: Standard exit codes for automation
- **Error Messages**: Clear, actionable error descriptions
- **Validation**: Input validation with helpful suggestions
- **Fallbacks**: Graceful degradation when dependencies unavailable

## Performance Considerations

### Token Counting
- Tiktoken (most accurate, requires Node.js + package)
- Heuristic (fast, reasonably accurate)
- Basic (fastest, least accurate)

### File Processing
- Batch operations for efficiency
- Progress indicators for large datasets
- Memory-conscious processing for large files

### Caching
- Dependency checks cached per session
- Token counts cached for unchanged files
- Validation results cached when appropriate

## Troubleshooting

### Common Issues

**Scripts not executable:**
```bash
chmod +x .documind/scripts/*
```

**Missing dependencies:**
```bash
npm run check-deps --fix
```

**Token counting inaccurate:**
```bash
npm install tiktoken  # For accurate token counting
```

**YAML validation failing:**
```bash
npm run validate-yaml --debug manifest.yaml
```

### Debug Mode

Enable debug output for detailed information:

```bash
DOCUMIND_DEBUG=true npm run token-count document.md
```

### Getting Help

Each utility provides comprehensive help:

```bash
npm run token-count -- --help
npm run validate-yaml -- --help
npm run split-markdown -- --help
npm run check-dependencies -- --help
npm run generate-docs -- --help
npm run budget-monitor -- --help
```

## Development

### Architecture

```
src/scripts/
├── utils.sh              # Shared utility functions
├── token-count           # Token counting utility
├── validate-yaml         # YAML validation utility
├── split-markdown        # Markdown splitting utility
├── check-dependencies    # Dependency verification
├── generate-docs         # Documentation generation
├── budget-monitor        # Budget monitoring
└── README.md            # This documentation
```

### Adding New Utilities

1. Create script in `src/scripts/`
2. Source `utils.sh` for shared functions
3. Follow naming conventions and patterns
4. Add to `isBashUtility()` in `install.js`
5. Add npm script in `package.json`
6. Create tests in `tests/unit/bash-scripts.test.js`

### Testing

Run the test suite:

```bash
npm test tests/unit/bash-scripts.test.js
```

## Contributing

When contributing to the bash utilities:

1. Follow existing code style and patterns
2. Use shared utility functions from `utils.sh`
3. Provide comprehensive help text
4. Support multiple output formats
5. Include error handling and validation
6. Add appropriate tests
7. Update this documentation

## License

MIT License - see the main project LICENSE file.

---

*Generated by DocuMind bash utilities system*