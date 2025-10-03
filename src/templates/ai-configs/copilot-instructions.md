# GitHub Copilot Configuration

Copilot should orchestrate DocuMind through the `/document` command family. Review [`src/core/commands.md`](../../core/commands.md) (and the runtime mirror `.documind/core/commands.md`) for the authoritative behaviors and parameters.

## Automatic Documentation Generation Checks

- Run `node .documind/scripts/detect-documind.js ai-report` to verify that Automatic Documentation Generation is available and to locate `.documind/scripts/ai-orchestrator.js`.
- If detection succeeds, **Execute Orchestrator** commands such as `node .documind/scripts/ai-orchestrator.js bootstrap` or `expand <concept>` as described below, and surface the results to the developer.
- When detection fails or the orchestrator is unavailable, explain the remediation steps and continue by drafting the requested docs manually so dual-purpose generation requirements are still satisfied.

## Operating Pattern
For every documentation-related request:
1. Identify the intent using the cues below.
2. Execute the associated `/document …` command.
3. Interpret the response and gather any supporting repository context.
4. Deliver the expected summary back to the developer.
5. If the command cannot run, draft the content manually and clearly state that a manual fallback was applied.

## Command Guidance
Each entry includes the intent, the actions Copilot should perform, and the output expectations developers rely on.

### `/document bootstrap`
- **Intent**: Generate a complete set of project documentation when no docs exist or a reset is needed.
- **Expected LLM actions**:
  1. Run `/document bootstrap` without arguments.
  2. Examine the resulting folder structure and note major additions.
  3. If automation is unavailable, manually outline project overview, setup, architecture, integrations, and contribution flows.
- **Output expectations**:
  - Provide a concise summary of new or refreshed documents and navigation assets.
  - Highlight any gaps that still require human attention.

### `/document expand [concept]`
- **Intent**: Produce or enrich documentation about a specific concept, feature, or component.
- **Expected LLM actions**:
  1. Execute `/document expand <concept>` using a clear concept label derived from the request.
  2. Review the generated content for completeness (purpose, architecture notes, examples).
  3. When command execution is impossible, write the concept doc manually, citing relevant files and behaviors.
- **Output expectations**:
  - Summarize the concept, key workflows, and related references.
  - Mention any follow-up actions such as analyzing integrations or updating navigation.

### `/document update [section]`
- **Intent**: Refresh existing documentation so it reflects the current implementation.
- **Expected LLM actions**:
  1. Call `/document update <section>` for the targeted guide.
  2. Compare old and new details to verify accuracy.
  3. If automation fails, rewrite the section manually using up-to-date repository knowledge.
- **Output expectations**:
  - Explain which files were updated and what changed.
  - Surface any open questions or TODOs encountered during the update.

### `/document analyze [integration]`
- **Intent**: Document how the codebase interacts with an external service or dependency.
- **Expected LLM actions**:
  1. Run `/document analyze <integration>` with the service or API name.
  2. Review configuration steps, API usage, and failure handling captured in the results.
  3. If the command cannot execute, inspect the codebase manually (e.g., service clients, environment variables) and write the integration guide yourself.
- **Output expectations**:
  - Outline setup requirements, key code references, and operational considerations.
  - Note any missing safeguards or monitoring that developers should add.

### `/document index`
- **Intent**: Regenerate navigation, tables of contents, and cross-reference files.
- **Expected LLM actions**:
  1. Execute `/document index`.
  2. Validate that navigation artifacts reflect the current docs.
  3. When automation is unavailable, manually adjust navigation files to keep links consistent.
- **Output expectations**:
  - Summarize updated index files and any detected inconsistencies.
  - Provide follow-up guidance if broken links or orphaned docs remain.

### `/document search [query]`
- **Intent**: Locate existing documentation relevant to a developer's question.
- **Expected LLM actions**:
  1. Invoke `/document search <query>`.
  2. Review and synthesize the returned matches, gathering short excerpts when helpful.
  3. If searching is unsupported, manually scan `/docs/` (and the codebase when necessary) to answer the request.
- **Output expectations**:
  - Provide ranked results with file paths and context.
  - Call out gaps that might warrant new documentation.

## Natural Language Mapping
Copilot should treat phrases such as "Document this feature", "Update the deployment guide", "How do we integrate with Stripe?", "Fix the docs navigation", and "Find docs about authentication" as triggers for the corresponding `/document` commands listed above.

## Fallback Responsibilities
- When `/document` automation is unavailable, Copilot remains responsible for drafting the requested content.
- Clearly communicate when manual drafting occurred and offer suggestions (e.g., install DocuMind) if appropriate.
- Always reference `.documind/core/commands.md` so developers know where command semantics are defined.
