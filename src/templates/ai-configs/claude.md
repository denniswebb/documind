# Claude Configuration

This repository uses **DocuMind** for intelligent documentation management with automatic dual-purpose generation.

## Automatic Documentation Generation

When users request documentation, DocuMind automatically generates BOTH human-readable and AI-optimized documentation in a single operation. This provides comprehensive documentation coverage without requiring users to understand the dual-purpose nature.

### How It Works

1. **Detect DocuMind**: Check for `.documind/` installation
2. **Execute Orchestrator**: Run AI orchestration script for comprehensive generation
3. **Generate Both Types**: Create human docs in `/docs/` and AI docs in `/docs/ai/`
4. **Present Results**: Show user the complete documentation generated

## Documentation Commands

When users request documentation using these commands, automatically execute the DocuMind AI orchestrator:

- `/document bootstrap` - Generate complete project documentation (both human and AI)
- `/document expand [concept]` - Create detailed documentation for concepts
- `/document update [section]` - Refresh existing documentation sections
- `/document analyze [integration]` - Document external service integrations
- `/document index` - Rebuild documentation navigation and links
- `/document search [query]` - Search existing documentation

## Natural Language Recognition

Recognize these patterns as documentation requests and execute the orchestrator:

- "Document this feature" → `/document expand [feature]`
- "Update the installation guide" → `/document update installation`
- "How do we use MongoDB?" → `/document analyze mongodb`
- "Create API documentation" → `/document expand api`
- "Generate project docs" → `/document bootstrap`
- "Find documentation about authentication" → `/document search authentication`

## Execution Instructions

For ALL documentation commands, follow this workflow:

### 1. Detection Phase
```bash
# Check if DocuMind is available
node .documind/scripts/detect-documind.js ai-report
```

### 2. Execution Phase (if DocuMind available)
```bash
# Execute the AI orchestrator for dual-purpose generation
node .documind/scripts/ai-orchestrator.js [command] [parameters]
```

### 3. Result Processing
- Parse the JSON output from the orchestrator
- Present a summary showing both human and AI documentation created
- Highlight the comprehensive nature of the generation
- Show file counts, locations, and any relevant metrics

### 4. Fallback (if DocuMind not available)
If DocuMind is not detected, fall back to using your native documentation capabilities and suggest DocuMind installation.

## Example Workflow

When user requests: `/document bootstrap`

1. **Check availability**: Run detect-documind.js
2. **Execute orchestrator**: `node .documind/scripts/ai-orchestrator.js bootstrap`
3. **Present results**:
   ```
   ✅ Complete documentation generated successfully!

   📚 Human Documentation:
   - Created 8 documentation files in /docs/
   - Generated organized structure with navigation

   🤖 AI Documentation:
   - Created 8 AI-optimized files in /docs/ai/
   - Total tokens: 12,450
   - Updated AI_README.md index

   🔗 Both types of documentation are now available and automatically linked.
   ```

## Advanced Options

Support these additional parameters when available:
- `--concept [name]` for expand commands
- `--integration [name]` for analyze commands
- `--section [name]` for update commands
- `--query [text]` for search commands

## Error Handling

If the orchestrator fails:
1. Check the error message in the JSON response
2. Suggest appropriate remediation steps
3. Fall back to native documentation if needed

---

**Key Principle**: Make documentation generation seamless and comprehensive. Users should get both human and AI documentation automatically without needing to understand the technical implementation.