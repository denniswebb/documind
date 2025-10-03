# Claude Configuration

DocuMind manages documentation through the `/document` command family. Claude agents should follow the behaviors defined in [`src/core/commands.md`](../../core/commands.md) and the mirrored runtime reference at `.documind/core/commands.md` when installed locally.

## Automatic Documentation Generation Overview

DocuMind's **Automatic Documentation Generation** pipeline still begins with environment detection before orchestrating `/document` commands. When operating in a local checkout:

- Run `node .documind/scripts/detect-documind.js ai-report` to confirm the workspace is configured for dual-purpose generation and to discover the `.documind/scripts/ai-orchestrator.js` entry point.
- If detection succeeds, execute the orchestrator with the desired intent (e.g., `node .documind/scripts/ai-orchestrator.js bootstrap`). Claude should always echo the command that was executed so developers can follow the workflow manually when needed.
- When detection fails, describe the fallback steps the user should take and proceed by drafting the requested deliverables manually while maintaining the dual-purpose generation standard.

## Unified Workflow Pattern
For every request that maps to a `/document` intent, follow this consistent structure:
1. **Classify the intent** using the patterns below.
2. **Execute the matching `/document …` command** with clear arguments.
3. **Interpret the command response** (or available repository context) to craft the final explanation.
4. **Provide the expected output summary** and any follow-up options.
5. **Fallback**: If the `/document` command cannot be executed, gather the necessary repository context manually and draft the documentation yourself before summarizing the results.

## Command Playbook
Each command entry lists natural language cues Claude should recognize, followed by the intent, required actions, and the output standard.

### `/document bootstrap`
- **Natural language cues**: "Generate all project docs", "Bootstrap the documentation", "Create complete documentation".
- **Intent**: Produce the end-to-end documentation set for the project.
- **Expected LLM actions**:
  1. Run `/document bootstrap` to trigger the comprehensive generation routine described in the command reference.
  2. Review the resulting documentation structure, noting key directories and files.
  3. If the command is unavailable, compile a manual overview covering project setup, architecture, integrations, and contributor guidance.
- **Output expectations**:
  - Summarize the new or updated files in `/docs/` and any AI-focused outputs.
  - Highlight navigation or index updates.
  - Offer next steps (e.g., expand or update commands) if gaps remain.

### `/document expand [concept]`
- **Natural language cues**: "Document the authentication system", "Explain how billing works", "Add docs for the queue processor".
- **Intent**: Create or enrich documentation for a focused concept, component, or workflow.
- **Expected LLM actions**:
  1. Execute `/document expand <concept>` with a descriptive concept name.
  2. Inspect the generated concept documentation to verify coverage of purpose, architecture, and examples.
  3. If execution fails, manually draft the concept documentation using code insights and existing docs.
- **Output expectations**:
  - Present the concept summary, key flows, and related references.
  - Note any new files added under `/docs/02-core-concepts/` or analogous locations.
  - Suggest related concepts or follow-up updates if beneficial.

### `/document update [section]`
- **Natural language cues**: "Refresh the setup guide", "Update the API docs", "Fix outdated deployment steps".
- **Intent**: Refresh an existing documentation section so that it reflects the current implementation.
- **Expected LLM actions**:
  1. Call `/document update <section>` targeting the relevant guide or area.
  2. Compare prior guidance with new changes to confirm accuracy.
  3. If automatic updates are unavailable, revise the section manually with the latest code or configuration details.
- **Output expectations**:
  - Describe the adjustments made, including files touched and issues resolved.
  - Point out any remaining open questions or TODOs discovered during the update.

### `/document analyze [integration]`
- **Natural language cues**: "How do we use Stripe?", "Document the MongoDB integration", "Explain our AWS setup".
- **Intent**: Produce integration-focused documentation that maps external services to in-repo usage.
- **Expected LLM actions**:
  1. Run `/document analyze <integration>` using the service name or integration focus.
  2. Review the resulting integration guide for configuration, API usage, and failure modes.
  3. If the command cannot run, investigate the codebase (e.g., environment files, service wrappers) and author the guide manually.
- **Output expectations**:
  - Summarize integration purpose, configuration steps, and key code references.
  - List any credentials, environment variables, or monitoring tips highlighted by the analysis.

### `/document index`
- **Natural language cues**: "Rebuild the navigation", "Fix the documentation index", "Refresh cross-references".
- **Intent**: Regenerate documentation navigation, tables of contents, and cross-links.
- **Expected LLM actions**:
  1. Execute `/document index` to rebuild navigation assets per the command reference.
  2. Confirm that indexes and linkages reflect the current file set.
  3. When automated rebuilding is unavailable, manually audit navigation files and adjust links accordingly.
- **Output expectations**:
  - Report navigation files touched (e.g., sidebar configs, AI indices).
  - Call out any broken links or inconsistencies that still require attention.

### `/document search [query]`
- **Natural language cues**: "Find docs about authentication", "Search for deployment steps", "Where is the API reference?".
- **Intent**: Locate existing documentation relevant to a user query.
- **Expected LLM actions**:
  1. Invoke `/document search <query>` with the requested topic.
  2. Review the returned matches and extract pertinent excerpts.
  3. If searching is unsupported, inspect the `/docs/` tree manually (and optionally the codebase) to answer the query.
- **Output expectations**:
  - Provide a ranked list of relevant sections with short summaries and file paths.
  - Identify gaps where new documentation might be needed.

## Fallback and Support Guidance
- When `/document` commands are unavailable, Claude must still fulfill the request by synthesizing documentation directly from repository context.
- Clearly state when manual drafting was required and provide actionable suggestions for installing or updating DocuMind if appropriate.
- Encourage users to consult `.documind/core/commands.md` for the definitive command semantics when working locally.

**Core principle**: Deliver comprehensive, dual-purpose documentation experiences without relying on local Node scripts for bespoke flows. Let the `/document` commands and documented behaviors drive every interaction, and reference the orchestrator workflow above whenever Automatic Documentation Generation can run end-to-end.
