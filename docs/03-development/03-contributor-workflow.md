# Contributor Workflow

This workflow keeps code, documentation, and AI playbooks aligned when contributing changes to DocuMind.

## 1. Create a feature branch

- Use descriptive branch names (e.g., `feature/prompt-index`) so review threads map cleanly to the scope of work.
- Install DocuMind locally (`npm install` followed by `node install.js init` in a sandbox project) if you need to verify the generated assets.

## 2. Update documentation intentionally

- Follow the [system instructions](../../src/core/system.md) that prioritize incremental updates. Prefer `/document expand …` and `/document update …` prompts over full regeneration so curated chapters stay intact.
- When adding new guides, wire them into the Docsify navigation (`docs/_sidebar.md`) so the material is discoverable.
- Cross-link statements back to their source modules (for example, `src/core/system.md` or `src/templates/ai-configs/`) to support future `/document review` audits.

## 3. Run automated tests

- Execute `npm test` for unit coverage and `npm run test:integration` for end-to-end flows before opening a pull request.
- Use `npm run coverage:report` if your change affects token counting or manifest processing; it runs the coverage suite and validates thresholds via `tests/coverage-validation.js`.

## 4. Prepare the pull request

- Summarize code and documentation changes, including which `/document` prompts were used or which templates were edited.
- Highlight any regenerated AI configuration files and link to the corresponding templates under `src/templates/ai-configs/`.
- Ensure the Docsify sidebar and chapter indices include the new material so reviewers can navigate without guesswork.

## 5. Keep history reviewable

- Commit frequently with messages that describe the observable change (e.g., `docs: add prompt orchestration guide`).
- Avoid committing generated `/docs/ai` assets unless the change specifically targets AI output templates; the orchestrator can regenerate them when needed.
- Retain backups produced by `handleExistingAIConfig()` during updates until the pull request is merged—they document how local prompt files evolved.
