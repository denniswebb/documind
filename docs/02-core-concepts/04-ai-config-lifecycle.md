# AI Configuration Lifecycle

DocuMind provisions IDE-specific prompt playbooks during installation and protects local edits during updates. The lifecycle is orchestrated by the CLI (`install.js`) and the templates in [`src/templates/ai-configs/`](../../src/templates/ai-configs/).

## Detection and generation

1. `documind init` calls `generateAIConfigs()`, which first detects available tools (Claude, Copilot, Cursor, Gemini).
2. For each detected tool, the CLI reads the matching template (for example, `ai-configs/claude.md`) from the packaged source and writes it into the project (`CLAUDE.md`, `.github/copilot-instructions.md`, `.cursorrules`, `GEMINI.md`).
3. The routine prints progress for each tool so contributors can confirm which assistants were configured.

## Update safety

- `documind update` reuses the same `generateAIConfigs()` method. Before overwriting, it calls `handleExistingAIConfig()` to inspect the current file.
- If the file already contains DocuMind guidance (`DocuMind` or `/document` markers), the method returns early to preserve user edits.
- In non-interactive contexts (CI, GitHub Actions, or any session without a TTY) the CLI automatically appends the new DocuMind section after backing up the original file. The backup filename includes a timestamp for traceability.

## Template responsibilities

Each template under `src/templates/ai-configs/` provides:

- **Command playbooks** tailored to the assistant, ensuring `/document` verbs map to the orchestrator and system rules.
- **Fallback guidance** describing how to proceed when automation is unavailable.
- **Cross-references** back to the shared [command reference](../../src/core/commands.md) and orchestrator entry points so the instructions remain grounded in runtime behavior.

## Maintenance tips

- When updating prompt language, edit the source templates first—DocuMind uses them for both fresh installs and appended updates.
- After changing templates, run `documind update --debug` in a sample project to confirm backups are created and the appended section renders correctly.
- Keep template links current (for example, paths to `ai-orchestrator.js` or command guides) so `/document review` prompts can trace statements back to code without manual sleuthing.
