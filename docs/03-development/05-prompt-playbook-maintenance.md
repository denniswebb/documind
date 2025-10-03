# Prompt Playbook Maintenance

DocuMind distributes AI assistant instructions from the templates in `src/templates/ai-configs/` and keeps local copies in sync through the installer.

## Where playbooks live

- Source templates: `src/templates/ai-configs/*.md` contain the canonical instructions for Claude, Copilot, Cursor, and Gemini.
- Installed outputs: `documind init` writes the rendered files to the repository root (`CLAUDE.md`, `GEMINI.md`), `.github/` (`copilot-instructions.md`), and `.cursor/` (`.cursorrules`).
- Command mirroring: Templates reference `src/core/system.md` and `src/core/commands.md` so IDE prompts stay aligned with the runtime behavior of `/document` commands.

## Updating templates

1. Modify the template under `src/templates/ai-configs/`.
2. Run `node install.js update --debug` inside a fixture project to regenerate the local copies.
3. Review the appended section (or backup file) created by `handleExistingAIConfig()` to ensure the new guidance merged cleanly.

## Reviewing local copies

- Each update creates a `*.backup-<timestamp>` file before appending DocuMind content. Keep these backups until the change merges—they provide reviewers with a diff-friendly history of prompt adjustments.
- For assistants that support command-specific prompts (e.g., Claude’s `.claude/commands/document.md`), confirm the auxiliary files updated by the installer reflect your edits.
- If an AI tool is removed from the template detection list, also delete or deprecate its installed counterpart to avoid stale instructions.

## Cross-linking expectations

When editing templates, add or refresh links that point back to the orchestrator (`src/scripts/ai-orchestrator.js`) and the system guide. Doing so allows `/document review` prompts to verify every instruction against the source module that implements it.
