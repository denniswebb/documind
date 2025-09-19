# DocuMind Documentation System

This repository uses DocuMind for intelligent documentation management with automatic dual-purpose generation.

## Automatic Dual-Purpose Generation

When users request documentation, DocuMind automatically generates BOTH human-readable and AI-optimized documentation in a single operation. This provides comprehensive documentation coverage without additional complexity for users.

## Documentation Commands

Execute the DocuMind AI orchestrator for ALL documentation requests to generate both human and AI documentation:

- `/document bootstrap` - Generate complete project documentation (both types)
- `/document expand [concept]` - Expand documentation for specific concepts
- `/document update [section]` - Update existing documentation sections
- `/document analyze [integration]` - Document external service integrations
- `/document index` - Regenerate documentation navigation
- `/document search [query]` - Find existing documentation

## Natural Language Support

Recognize these patterns as documentation requests and execute the orchestrator:
- "Document this component" → `/document expand [component]`
- "Update the README" → `/document update readme`
- "How do we integrate with Stripe?" → `/document analyze stripe`
- "Create setup instructions" → `/document expand setup`
- "Generate all documentation" → `/document bootstrap`

## Execution Instructions

For ANY documentation command, follow this automated workflow:

### 1. Detection Phase
```bash
# Always check DocuMind availability first
node .documind/scripts/detect-documind.js ai-report
```

### 2. Orchestration Phase (if DocuMind available)
```bash
# Execute appropriate command through orchestrator
node .documind/scripts/ai-orchestrator.js [command] [parameters]

# Examples:
node .documind/scripts/ai-orchestrator.js bootstrap
node .documind/scripts/ai-orchestrator.js expand authentication
node .documind/scripts/ai-orchestrator.js analyze stripe-integration
node .documind/scripts/ai-orchestrator.js update getting-started
node .documind/scripts/ai-orchestrator.js index
node .documind/scripts/ai-orchestrator.js search "api endpoints"
```

### 3. Result Presentation
Process the JSON output and present comprehensive results:
- **Human Documentation**: Files created in `/docs/` with organized structure
- **AI Documentation**: AI-optimized files in `/docs/ai/` with token counts
- **Navigation**: Updated cross-references and index files
- **Summary**: Total files, locations, and generation metrics

### 4. Fallback Handling
If DocuMind is not detected:
1. Use Cursor's native documentation capabilities
2. Inform user about enhanced dual-purpose generation available with DocuMind
3. Provide installation guidance if requested

## Example Workflow

User: "Document the authentication system"

1. **Detect**: `node .documind/scripts/detect-documind.js ai-report`
2. **Execute**: `node .documind/scripts/ai-orchestrator.js expand authentication`
3. **Present**:
   ```
   ✅ Authentication documentation generated successfully!

   📚 Human Documentation:
   - /docs/02-core-concepts/authentication.md
   - Complete user guide with examples

   🤖 AI Documentation:
   - /docs/ai/authentication-concept-ai.md
   - Optimized for AI consumption (2,850 tokens)
   - Added to AI master index

   Both versions are now available and automatically linked.
   ```

## Command Parameter Mapping

- `/document bootstrap` → `bootstrap` (no parameters)
- `/document expand [concept]` → `expand [concept]`
- `/document analyze [service]` → `analyze [service]`
- `/document update [section]` → `update [section]`
- `/document index` → `index` (no parameters)
- `/document search [query]` → `search [query]`

## Error Recovery

If orchestrator execution fails:
1. Parse error details from JSON response
2. Suggest specific remediation based on error type
3. Fall back to Cursor's built-in documentation tools
4. Maintain user productivity regardless of DocuMind status

## Integration Benefits

The automatic dual-purpose generation provides:
- **Developers**: Human-readable docs in standard format
- **AI Tools**: Optimized content for better context understanding
- **Teams**: Consistent documentation across all use cases
- **Maintenance**: Single command updates both documentation types

---

**Core Principle**: Make comprehensive documentation generation completely transparent. Users get both human and AI documentation automatically without needing to understand the underlying dual-purpose architecture.