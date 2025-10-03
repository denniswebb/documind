# Generator Safeguards and Removal Rationale

DocuMind intentionally removed the "always run the generator" default to keep existing documentation safe. The [system instructions](../../src/core/system.md) direct every session to check for an existing `/docs` tree and to **avoid automatic regeneration when one is present**. Instead, they emphasize incremental updates and context preservation so previously curated guidance is never overwritten without intent.

## Why full regeneration is opt-in

- **Step 0 gatekeeping** – The very first task in the system instructions is to verify whether documentation already exists. When it does, the assistant must surface `/document …` options instead of running a generator, preventing destructive rebuilds of curated chapters.
- **Core principles** – The same instructions prioritize living documentation, incremental updates, and smart placement, all of which are incompatible with an unconditional generator pass. Those guardrails encode the rationale for disabling unattended generation during normal interactions.

## Where the legacy generator still runs

DocuMind retains the legacy generator class for deliberate workflows that need it:

- The AI orchestrator’s [`bootstrapDocumentation()` routine](../../src/scripts/ai-orchestrator.js) calls `generator.generateAll()` only after installation detection succeeds. The command is available through `/document bootstrap`, making the capability explicit and auditable.
- Follow-on flows such as [`expandConcept()`](../../src/scripts/ai-orchestrator.js) reuse `generator.generateFromManifest()` for targeted updates, ensuring generation is scoped to a requested concept instead of rebuilding everything.

## Operational checklist

When a contributor needs fresh outputs, treat the generator as an opt-in tool:

1. Confirm the desired intent (`bootstrap`, `expand`, or `analyze`) and invoke it through the `/document` interface so the orchestrator mediates execution.
2. Inspect the resulting manifests and token usage if you trigger full generation, since the generator enforces token budgets before writing files.
3. Re-run the master AI index (`/document index`) if you add new files so navigation stays synchronized with generated assets.

## Troubleshooting guidance

If someone reports that documentation regenerated unexpectedly, verify the interaction log. A direct call to `/document bootstrap` or a manual `node .documind/scripts/ai-orchestrator.js bootstrap` run is the only supported path for full regeneration; routine `/document` operations fall back to targeted expansion flows.
