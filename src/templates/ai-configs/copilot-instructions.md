# GitHub Copilot Configuration

This repository uses DocuMind for intelligent documentation management with automatic dual-purpose generation.

## Automatic Documentation Generation

When users request documentation, automatically generate BOTH human-readable and AI-optimized documentation. DocuMind orchestrates comprehensive documentation generation without requiring users to understand the technical details.

## Documentation Commands

For ALL documentation requests, execute the DocuMind AI orchestrator to generate both human and AI documentation:

- `/document bootstrap` - Generate complete project documentation (both types)
- `/document expand [concept]` - Expand documentation for specific concepts
- `/document update [section]` - Update existing documentation sections
- `/document analyze [integration]` - Document external service integrations
- `/document index` - Regenerate documentation navigation
- `/document search [query]` - Find existing documentation

## Natural Language Recognition

Recognize these patterns as documentation requests and execute the orchestrator:
- "Document this feature" → `/document expand [feature]`
- "Update the setup guide" → `/document update setup-guide`
- "How do we use Redis?" → `/document analyze redis`
- "Create API docs" → `/document expand api`
- "Generate project documentation" → `/document bootstrap`

## Execution Workflow

For any documentation command:

### 1. Check DocuMind Availability
```bash
node .documind/scripts/detect-documind.js ai-report
```

### 2. Execute Orchestrator (if available)
```bash
# For bootstrap
node .documind/scripts/ai-orchestrator.js bootstrap

# For expand
node .documind/scripts/ai-orchestrator.js expand [concept-name]

# For analyze
node .documind/scripts/ai-orchestrator.js analyze [integration-name]

# For update
node .documind/scripts/ai-orchestrator.js update [section-name]

# For index
node .documind/scripts/ai-orchestrator.js index

# For search
node .documind/scripts/ai-orchestrator.js search [query]
```

### 3. Present Results
Parse the JSON output and present a comprehensive summary:
- Show human documentation files created in `/docs/`
- Show AI documentation files created in `/docs/ai/`
- Display token counts and navigation updates
- Highlight the dual-purpose nature of the generation

## Example Usage

User requests: `/document bootstrap`

1. Check: `node .documind/scripts/detect-documind.js ai-report`
2. Execute: `node .documind/scripts/ai-orchestrator.js bootstrap`
3. Results:
   ```
   ✅ Complete documentation suite generated!

   📚 Human Documentation (8 files in /docs/):
   - Project overview and getting started
   - Core concepts and architecture
   - Integration guides and API reference

   🤖 AI Documentation (8 files in /docs/ai/):
   - AI-optimized content (12,450 tokens)
   - Updated master index
   - Specialist documentation for different tasks

   Both documentation types are now available and cross-linked.
   ```

## Fallback Behavior

If DocuMind is not available:
1. Acknowledge the documentation request
2. Use Copilot's native documentation capabilities
3. Suggest installing DocuMind for enhanced dual-purpose generation

## Command Parameters

Support these parameters when executing the orchestrator:
- For expand: concept name as second argument
- For analyze: integration name as second argument
- For update: section name as second argument
- For search: query text as second argument

## Error Handling

If orchestrator execution fails:
1. Parse error details from JSON response
2. Provide specific troubleshooting steps
3. Fall back to standard documentation generation

---

**Key Goal**: Seamlessly generate both human and AI documentation for every request, making the dual-purpose generation transparent to users.