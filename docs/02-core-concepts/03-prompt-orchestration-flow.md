# Prompt Orchestration Flow

The `/document` family of prompts routes through the AI orchestration script that ships with DocuMind. Understanding how the orchestrator sequences validation, command handling, and generation makes it easier to diagnose automation issues and extend the workflow responsibly.

## Entry point and environment validation

1. AI agents call `ai-orchestrator.js` with a verb such as `bootstrap`, `expand`, or `search`.
2. The orchestrator constructs helper classes (`Generator`, `AIIndexBuilder`) and records the working directory at instantiation.
3. Before executing a command it runs `validateInstallation()`, which ensures that `.documind/core` and `.documind/templates` exist. The check prevents commands from running in partially installed workspaces.

## Command dispatch

- `execute()` calculates timing metadata and forwards the request to `executeCommand()`.
- `executeCommand()` uses a switch statement to map verbs to dedicated routines: `bootstrapDocumentation`, `expandConcept`, `analyzeIntegration`, `updateSection`, `rebuildIndex`, and `searchDocumentation`.
- Unknown commands trigger an explicit error, keeping the interaction contract narrow.

## Generation verbs

- **Bootstrap** – `bootstrapDocumentation()` runs `generator.generateAll()` against every manifest, mirrors the results into human and AI directories, updates the AI index, and rebuilds the Docsify skeleton.
- **Expand / Update** – `expandConcept()` and `updateSection()` reuse `generator.generateFromManifest()` for a specific name, then refresh the AI index. `updateSection()` simply calls `expandConcept()` with `mode: 'update'` semantics, keeping the implementation DRY.
- **Analyze** – `analyzeIntegration()` filters manifests for integration templates and executes them with the supplied service name, returning token counts alongside generated paths.

## Non-generative verbs

- **Index** – `rebuildIndex()` calls the AI index builder directly to rescan generated outputs.
- **Search** – `searchDocumentation()` walks every Markdown file under `/docs` and `/docs/ai`, collecting line matches for the requested query. The helper gracefully handles missing directories.

## Operational tips

- The orchestrator only runs after the installation check passes, so failed commands often indicate that `.documind` was not installed or was removed during a cleanup. Re-run `documind init` if necessary.
- Each routine returns structured metadata (counts, timestamps, affected paths), which downstream agents can surface to users for transparency or integrate into progress dashboards.
- When building new automation, prefer adding verbs to `executeCommand()` instead of bypassing the orchestrator so validation and logging remain consistent.

For a deep dive into how the orchestrator fits within DocuMind’s safety rails, pair this guide with the [generator safeguards overview](./02-generator-safeguards.md) and the canonical [system instructions](../../src/core/system.md).
