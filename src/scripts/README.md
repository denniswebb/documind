# DocuMind Bash Utilities

A focused collection of bash helpers that support DocuMind's AI-driven documentation workflows with local tooling for token accounting, content validation, and environment checks.

## Overview

These utilities complement the `/document` slash commands that now power end-to-end documentation creation directly through your AI assistant. Use the scripts for guardrails—count tokens, validate manifests, split large files, and monitor budgets—while delegating narrative generation to prompt sequences.

## Installation

The utilities install automatically with DocuMind:

```bash
npx @dennis-webb/documind init
```

After installation they are exposed through npm run scripts:

```bash
npm run token-count [file]      # Count tokens in files
npm run validate-yaml [file]    # Validate YAML manifests
npm run split-markdown [file]   # Split large markdown files
npm run check-deps              # Check system dependencies
npm run budget-monitor [dir]    # Monitor token budgets
```

## Available Utilities

### 🔢 token-count

Count tokens in text files with `tiktoken` integration, per-file budgets, and multiple output formats.

```bash
npm run token-count document.md
npm run token-count -- --budget=500 *.md
npm run token-count -- --json document.md
npm run token-count -- --format=csv docs/
```

### ✅ validate-yaml

Validate DocuMind YAML manifests with strict schema enforcement and CI-friendly output.

```bash
npm run validate-yaml manifest.yaml
npm run validate-yaml -- docs/ai/*.yaml
npm run validate-yaml -- --strict config.yml
npm run validate-yaml -- --junit --output=results.xml manifests/
```

### ✂️ split-markdown

Split oversized Markdown into manageable chunks while preserving navigation and respecting token budgets.

```bash
npm run split-markdown -- --strategy=heading large-doc.md
npm run split-markdown -- --budget=500 --strategy=token document.md
npm run split-markdown -- --index --output=chunks/ README.md
npm run split-markdown -- --merge chunks/
```

### 🔍 check-dependencies

Audit local system prerequisites and optional tooling, optionally installing anything missing.

```bash
npm run check-deps
npm run check-deps -- --install
npm run check-deps -- --system-only
npm run check-deps -- --json
```

### 📊 budget-monitor

Track token budgets across documentation directories with watch mode, alerting, and Prometheus metrics.

```bash
npm run budget-monitor docs/
npm run budget-monitor -- --watch docs/
npm run budget-monitor -- --alert --budget=500 docs/
npm run budget-monitor -- --prometheus docs/
```

## Prompt-first documentation generation

DocuMind now orchestrates narrative and structural documentation through the `/document` commands inside your AI assistant. Run prompts such as:

```text
/document bootstrap           # Full documentation from scratch
/document expand onboarding   # Deep dive on a specific topic
/document update api guide    # Refresh an existing section
/document analyze integrations# Research external dependencies
```

Pair those prompts with the bash utilities for verification—e.g., split large drafts before review or validate YAML manifests prior to publishing.

## CI/CD Integration

Example GitHub Actions snippet combining prompt guidance with local checks:

```yaml
- name: Validate documentation assets
  run: |
    npm run check-deps
    npm run validate-yaml docs/
    npm run budget-monitor --alert docs/
```

## Shared utility functions

`utils.sh` provides logging, color helpers, dependency detection, JSON parsing, and filesystem utilities consumed by each script. Enable debug logs by exporting `DOCUMIND_DEBUG=true` before running a helper.

## Architecture

```
src/scripts/
├── utils.sh            # Shared utility functions
├── token-count         # Token counting utility
├── validate-yaml       # YAML validation utility
├── split-markdown      # Markdown splitting utility
├── check-dependencies  # Dependency verification
├── budget-monitor      # Budget monitoring
└── README.md           # This documentation
```

## Development workflow

1. Create the script inside `src/scripts/` and source `utils.sh` for shared helpers.
2. Add the executable to `isBashUtility()` in `install.js`.
3. Wire an npm script into `package.json` if needed.
4. Cover the helper with tests in `tests/unit/bash-scripts.test.js`.
5. Update this README when behavior changes.

Run the targeted test suite with:

```bash
npm test tests/unit/bash-scripts.test.js
```

## License

MIT License — see the main project LICENSE file.
