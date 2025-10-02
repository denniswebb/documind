# DocuMind Documentation Workflows

DocuMind centralizes documentation automation through the `/document` command family. The authoritative behavior for each command lives in [`src/core/commands.md`](../core/commands.md) and is mirrored at `.documind/core/commands.md` when DocuMind is installed locally.

## Standard Workflow Format
Every documentation workflow follows the same structure:
- **Intent**: What the user is trying to accomplish.
- **Expected LLM actions**: Steps the assistant should perform, including when to call `/document …` commands and how to respond if automation is unavailable.
- **Output expectations**: The information the assistant returns to the user, including summaries, file references, and follow-up suggestions.

When `/document` commands cannot run (e.g., automation missing or failing), the assistant should carry out the work manually, create the requested documentation directly, and clearly communicate that a fallback approach was used.

## Workflows by Command

### `/document bootstrap`
- **Intent**: Create or refresh the entire documentation suite for the project.
- **Expected LLM actions**:
  1. Execute `/document bootstrap` to generate the baseline documentation set.
  2. Review the resulting structure, noting new or updated files, navigation assets, and indexes.
  3. If automation is unavailable, manually draft core documents covering project overview, setup, architecture, integrations, and contribution guidelines.
- **Output expectations**:
  - Summarize the generated documentation, highlighting directory structure and key files.
  - Call out navigation or index updates and recommend next steps if coverage gaps remain.

### `/document expand [concept]`
- **Intent**: Produce or enrich documentation for a specific concept, component, or workflow.
- **Expected LLM actions**:
  1. Run `/document expand <concept>` using a descriptive label.
  2. Examine the resulting content to ensure it explains purpose, architecture, workflows, and examples.
  3. If the command fails, research the repository manually and author the concept documentation yourself.
- **Output expectations**:
  - Provide a concise concept summary with key insights and related file paths.
  - Suggest complementary topics or follow-up commands where appropriate.

### `/document analyze [integration]`
- **Intent**: Document how the project integrates with an external service or dependency.
- **Expected LLM actions**:
  1. Execute `/document analyze <integration>` with the relevant service name.
  2. Review configuration, API usage, failure handling, and monitoring notes produced by the command.
  3. When automation is unavailable, inspect integration code, environment variables, and existing docs to craft the guide manually.
- **Output expectations**:
  - Summarize setup steps, environment requirements, and key code references.
  - Highlight operational considerations, risks, and follow-up recommendations.

### `/document update [section]`
- **Intent**: Refresh an existing documentation section to reflect the current state of the system.
- **Expected LLM actions**:
  1. Call `/document update <section>` for the targeted area.
  2. Compare new guidance with previous instructions to confirm accuracy and completeness.
  3. If automation fails, revise the section manually using recent code and documentation context.
- **Output expectations**:
  - Detail the updates made, including affected files and issues resolved.
  - Note any outstanding questions or TODOs surfaced during the update.

### `/document index`
- **Intent**: Rebuild navigation, tables of contents, and cross-references across documentation.
- **Expected LLM actions**:
  1. Run `/document index` to regenerate navigation assets.
  2. Verify that sidebars, indexes, and link structures match the latest documentation inventory.
  3. If the command cannot execute, manually audit navigation files and adjust links to maintain consistency.
- **Output expectations**:
  - List updated navigation artifacts and identify any remaining structural issues.
  - Recommend additional cleanup if broken links or orphaned docs persist.

### `/document search [query]`
- **Intent**: Locate existing documentation relevant to a user's question.
- **Expected LLM actions**:
  1. Invoke `/document search <query>`.
  2. Analyze the returned matches, capturing concise excerpts when useful.
  3. If searching is unavailable, manually review `/docs/` and supporting code to answer the question.
- **Output expectations**:
  - Provide a ranked summary of relevant documents with file paths.
  - Point out gaps where new documentation could be added.

## Natural Language Recognition
Map free-form phrases (e.g., "Document everything", "Explain authentication", "How do we use Stripe?", "Update the API guide", "Fix the navigation", "Find database docs") to the appropriate `/document` command by intent. Confirm the mapping with the user when ambiguity exists.

## Fallback Strategies
When `/document` automation is not available or fails mid-run:
1. **Acknowledge** the limitation and explain that a manual path will be used.
2. **Perform the work manually**, drafting or updating the necessary documentation based on repository evidence.
3. **Summarize the results** using the intent/action/output format, noting which parts were manually authored.
4. **Recommend remediation**, such as reinstalling DocuMind, and refer users to `.documind/core/commands.md` for command semantics.

## Quality and Presentation Standards
- Use consistent success indicators (e.g., ✅ for completion, ⚠️ for warnings) when presenting results.
- Separate human-readable documentation updates from AI-oriented outputs when both are relevant.
- Include file paths, summaries, and next steps so users can quickly verify changes.

**Outcome**: A clear, LLM-friendly guide to executing DocuMind workflows that depends solely on `/document` commands and direct assistant behavior—no local scripts required.
