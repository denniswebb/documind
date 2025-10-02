# Cursor Configuration

Cursor agents manage documentation through DocuMind's `/document` commands. Follow the behaviors defined in [`src/core/commands.md`](../../core/commands.md) and, when running locally, the synchronized reference at `.documind/core/commands.md`.

## Standard Operating Sequence
1. Detect the user's intent and map it to a `/document` command.
2. Execute the command (or simulate its effects if automation is unavailable).
3. Review outputs and supporting repository context.
4. Respond using the intent/action/output format described below.
5. When commands cannot run, create the requested documentation manually and note that a fallback was used.

## Command Reference
Each command entry maintains the **Intent → Expected LLM actions → Output expectations** structure for consistency.

### `/document bootstrap`
- **Intent**: Build or refresh the complete documentation suite.
- **Expected LLM actions**:
  1. Run `/document bootstrap`.
  2. Inspect resulting documentation directories and indexes.
  3. If automation is unavailable, author a manual overview covering project introduction, setup, architecture, integrations, and contribution guidelines.
- **Output expectations**:
  - Summarize new or updated documentation and navigation assets.
  - Suggest additional follow-up commands if coverage gaps remain.

### `/document expand [concept]`
- **Intent**: Produce detailed documentation for a specific concept, feature, or workflow.
- **Expected LLM actions**:
  1. Execute `/document expand <concept>` using a descriptive name.
  2. Verify that generated docs explain purpose, architecture, usage, and examples.
  3. If the command cannot run, research the relevant files and draft the concept documentation manually.
- **Output expectations**:
  - Provide a concise summary of the concept and note where the documentation lives.
  - Recommend related topics that might benefit from additional coverage.

### `/document update [section]`
- **Intent**: Refresh an existing documentation section with current information.
- **Expected LLM actions**:
  1. Call `/document update <section>`.
  2. Compare new content with previous guidance to ensure accuracy.
  3. When automation fails, update the section manually using repository insights.
- **Output expectations**:
  - Describe the adjustments made and reference the affected files.
  - Capture any open issues uncovered during the update.

### `/document analyze [integration]`
- **Intent**: Document interactions with an external service or dependency.
- **Expected LLM actions**:
  1. Run `/document analyze <integration>` with the relevant service name.
  2. Review configuration steps, API usage patterns, and error handling surfaced by the command.
  3. If unavailable, manually inspect integration code and craft the necessary documentation.
- **Output expectations**:
  - Summarize setup requirements, critical code paths, and operational considerations.
  - List environment variables or credentials referenced by the integration.

### `/document index`
- **Intent**: Rebuild documentation navigation and cross-references.
- **Expected LLM actions**:
  1. Execute `/document index`.
  2. Ensure navigation artifacts (sidebars, indexes) align with the current docs.
  3. Without automation, review navigation files manually and correct links.
- **Output expectations**:
  - Highlight the navigation files updated and any remaining issues needing attention.

### `/document search [query]`
- **Intent**: Locate existing documentation relevant to a specific topic.
- **Expected LLM actions**:
  1. Invoke `/document search <query>`.
  2. Analyze the results, collecting excerpts when helpful.
  3. If the search command is unavailable, examine `/docs/` manually (and supporting code) to answer the question.
- **Output expectations**:
  - Provide a ranked list of matching files with short summaries and paths.
  - Note gaps where new documentation would add value.

## Language Mapping and Support
- Treat phrases such as "Document this component", "Update the README", "How do we integrate Stripe?", "Fix the docs navigation", and "Find docs about authentication" as triggers for the commands above.
- When uncertainty exists, confirm the intended command with the user before proceeding.

## Fallback Responsibilities
- If `/document` automation is unavailable, Cursor must still produce the requested documentation manually.
- Clearly mention when manual drafting occurs and encourage users to check `.documind/core/commands.md` for authoritative command semantics.
- Provide actionable guidance for future improvements, such as running follow-up commands or expanding coverage.

**Objective**: Maintain a fully LLM-driven workflow that relies solely on the `/document` command family, avoiding references to local Node scripts while still delivering comprehensive documentation support.
