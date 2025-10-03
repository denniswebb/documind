# Gemini CLI Instructions

Gemini agents handle documentation through DocuMind's `/document` command suite. Behaviors are defined in [`src/core/commands.md`](../../core/commands.md) and mirrored for local use at `.documind/core/commands.md`.

## Execution Blueprint
1. Map the user request to a `/document` intent.
2. Run the corresponding command (or emulate it if automation is unavailable).
3. Review command output alongside repository context.
4. Respond using the standardized intent/action/output format.
5. When commands fail, author the requested material manually and clearly state that a manual fallback was used.

## Command Guidelines
Every entry follows the **Intent → Expected LLM actions → Output expectations** structure to keep workflows consistent.

### `/document bootstrap`
- **Intent**: Generate the full documentation suite from scratch or refresh it comprehensively.
- **Expected LLM actions**:
  1. Execute `/document bootstrap`.
  2. Examine generated directories, indexes, and summary information.
  3. If automation is unavailable, manually assemble a baseline documentation set (overview, setup, architecture, integrations, contribution).
- **Output expectations**:
  - Summarize key files and navigation elements created or updated.
  - Highlight any remaining tasks or suggested follow-up commands.

### `/document expand [concept]`
- **Intent**: Create or deepen documentation for a specific concept, feature, or workflow.
- **Expected LLM actions**:
  1. Run `/document expand <concept>` with a descriptive label.
  2. Validate that the resulting content covers intent, architecture, data flows, and examples.
  3. When automation is unavailable, research the repository manually and write the concept guide yourself.
- **Output expectations**:
  - Provide a concise concept overview, key references, and recommended next steps.
  - Note the file paths that contain the expanded material.

### `/document update [section]`
- **Intent**: Refresh an existing documentation section to ensure accuracy.
- **Expected LLM actions**:
  1. Invoke `/document update <section>`.
  2. Compare new content against prior details to confirm alignment with the current implementation.
  3. If the command cannot run, manually revise the section using up-to-date repository knowledge.
- **Output expectations**:
  - Describe what changed, including files updated and issues resolved.
  - Identify any follow-up work still needed.

### `/document review [scope]`
- **Intent**: Validate documentation accuracy against the live implementation and define precise remediation steps.
- **Expected LLM actions**:
  1. Run `/document review <scope>`—reviews operate exclusively through `/document` prompts.
  2. Investigate the relevant code, tests, and configuration to capture current behavior.
  3. Compare those findings to the claims in the matching `/docs/` material.
  4. Summarize agreements, discrepancies, and potential risks.
  5. Enumerate the `/document update …` prompts (or other `/document` actions) required to address each issue, emphasizing that the review command only permits edits inside `docs/`.
- **Output expectations**:
  - Present a structured report that pairs each discrepancy with supporting evidence.
  - Confirm which portions of the documentation remain accurate.
  - Supply the follow-up prompt list needed to remediate the gaps.

### `/document analyze [integration]`
- **Intent**: Document the project's relationship with an external service or dependency.
- **Expected LLM actions**:
  1. Execute `/document analyze <integration>`.
  2. Review configuration notes, API usage, and failure handling described in the output.
  3. If automation is unavailable, inspect integration code manually and craft the documentation yourself.
- **Output expectations**:
  - Summarize setup steps, environment variables, and major code touchpoints.
  - Call out risks, limitations, or monitoring considerations.

### `/document index`
- **Intent**: Rebuild navigation assets and cross-references across documentation sets.
- **Expected LLM actions**:
  1. Run `/document index`.
  2. Verify that indexes and navigation files align with the latest docs inventory.
  3. If automation cannot run, manually audit navigation files and adjust links.
- **Output expectations**:
  - List updated navigation artifacts and highlight any remaining structural gaps.

### `/document search [query]`
- **Intent**: Locate existing documentation relevant to a specific question.
- **Expected LLM actions**:
  1. Call `/document search <query>`.
  2. Analyze returned matches, extracting concise summaries or excerpts.
  3. If searching is unavailable, manually explore `/docs/` and supporting code to answer the question.
- **Output expectations**:
  - Deliver ranked results with file paths and short summaries.
  - Point out missing coverage that may warrant future documentation.

## Natural Language Recognition
Recognize phrases such as "Generate project docs", "Document the authentication flow", "Audit the payments documentation", "Update the API guide", "How do we use Stripe?", "Rebuild the docs navigation", and "Find docs about deployment" as triggers for the commands above. Confirm intent with the user if ambiguity remains.

## Fallback Responsibilities
- When `/document` automation fails, Gemini must still fulfill the request by drafting the necessary documentation manually.
- Clearly communicate when a manual fallback was required and reference `.documind/core/commands.md` for the authoritative command definitions.
- Suggest next steps that help users maintain or extend their documentation coverage.

**Mission**: Provide comprehensive documentation assistance driven by the `/document` commands, without relying on local Node scripts.
