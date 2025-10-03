Intelligent documentation command processor for DocuMind projects.

This prompt assumes DocuMind's `/document` commands behave as defined in [`src/core/commands.md`](../../core/commands.md) and mirrored at `.documind/core/commands.md` when DocuMind is installed locally.

> **Documentation Scope Guardrail**: Limit every `/document` edit to `docs/`. When you identify stale information in `README.md` or other non-doc files, flag it explicitly and ask for maintainer follow-up instead of editing those files.

## Core Processing Pattern
1. Determine which `/document` intent the request maps to.
2. Execute the command (or simulate its effects when automation is unavailable).
3. Interpret the response, gather supporting context, and present results using the structure below.
4. When command execution is impossible, perform the work manually—draft the necessary documentation, answer questions directly, and state that a manual fallback was used.

## Command Modes
Each mode is expressed with the consistent **Intent → Expected LLM actions → Output expectations** structure.

### `/document` (no arguments)
- **Intent**: Provide interactive assistance when the user invokes `/document` without parameters.
- **Expected LLM actions**:
  1. Check whether documentation already exists in `/docs/` to tailor guidance.
  2. Offer relevant next steps (bootstrap, expand, update, analyze, index, search) along with concise descriptions.
  3. If automation is unavailable, manually summarize the current documentation state and propose next actions.
- **Output expectations**:
  - Present a friendly menu of available commands with short explanations.
  - Call out recent documentation changes when known.
  - Suggest the most relevant next command based on the user's context.

### `/document bootstrap`
- **Intent**: Generate the comprehensive documentation set for the project.
- **Expected LLM actions**:
  1. Execute `/document bootstrap`.
  2. Review the produced structure to identify major sections and indexes.
  3. If the command cannot run, craft a manual starter documentation suite (overview, setup, architecture, integrations, contribution).
- **Output expectations**:
  - Summarize new or updated files, navigation assets, and any follow-up recommendations.
  - Clarify whether automation or manual drafting produced the result.

### `/document expand [concept]`
- **Intent**: Create or enrich documentation for a particular concept or feature.
- **Expected LLM actions**:
  1. Invoke `/document expand <concept>` with a descriptive label drawn from the request.
  2. Validate that the resulting docs cover purpose, architecture, workflows, and examples.
  3. When automation fails, research the repository manually and author the concept documentation.
- **Output expectations**:
  - Provide a concise concept summary, key implementation references, and next steps.
  - Mention the specific files that now contain the expanded content.

### `/document update [section]`
- **Intent**: Refresh an existing documentation section to match current behavior.
- **Expected LLM actions**:
  1. Run `/document update <section>`.
  2. Compare new guidance against previous information to ensure accuracy.
  3. If automation cannot execute, perform the update manually using repository insights.
- **Output expectations**:
  - Describe what changed, note any lingering issues, and reference the updated files.

### `/document analyze [integration]`
- **Intent**: Document how the project integrates with an external system or dependency.
- **Expected LLM actions**:
  1. Execute `/document analyze <integration>`.
  2. Review configuration, API usage, and error-handling guidance produced by the command.
  3. When unavailable, inspect the codebase manually and author the integration guide yourself.
- **Output expectations**:
  - Summarize integration purpose, setup steps, environment variables, and key code paths.
  - Flag any risks or follow-up work uncovered during analysis.

### `/document index`
- **Intent**: Rebuild navigation, tables of contents, and cross-references for the docs set.
- **Expected LLM actions**:
  1. Run `/document index`.
  2. Confirm that navigation artifacts reflect the current documentation inventory.
  3. Without automation, audit navigation files manually and update links.
- **Output expectations**:
  - List the navigation or index files adjusted and note any remaining link issues.

### `/document search [query]`
- **Intent**: Locate existing documentation relevant to a user query.
- **Expected LLM actions**:
  1. Call `/document search <query>`.
  2. Review the results and extract high-signal excerpts.
  3. If the command is unavailable, manually examine `/docs/` and related code to answer the question.
- **Output expectations**:
  - Provide ranked findings with file paths, brief summaries, and recommendations for missing coverage if any.

## Natural Language Mapping
Map free-form phrases such as "Document this feature", "Update the deployment guide", "How do we use Stripe?", "Fix the docs navigation", and "Find docs about authentication" to the corresponding `/document` commands above. Always confirm the mapping with the user when ambiguity exists.

## Fallback Expectations
If DocuMind automation is unavailable:
- State that a manual drafting path is being used.
- Produce the requested documentation directly, citing relevant files or observations.
- Encourage installation or repair of DocuMind and reference `.documind/core/commands.md` for the definitive command definitions.

**Goal**: Deliver a consistent, LLM-friendly documentation experience centered on the `/document` commands without referencing local Node scripts.
