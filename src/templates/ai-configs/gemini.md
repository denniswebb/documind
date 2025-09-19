# Gemini CLI Instructions

This repository uses **DocuMind** for intelligent documentation management with automatic dual-purpose generation.

## Automatic Dual-Purpose Documentation

When users request documentation, DocuMind automatically generates BOTH human-readable and AI-optimized documentation simultaneously. This comprehensive approach ensures complete documentation coverage without requiring users to understand the technical implementation.

## Documentation Commands

For ALL documentation requests, execute the DocuMind AI orchestrator to generate both human and AI documentation:

- `/document bootstrap` - Generate complete project documentation (both types)
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
- "Find docs about authentication" → `/document search authentication`

## Execution Protocol

For ANY documentation command, follow this standardized workflow:

### 1. DocuMind Detection
```bash
# Check if DocuMind is properly installed and available
node .documind/scripts/detect-documind.js ai-report
```

### 2. Orchestrated Execution (if DocuMind available)
```bash
# Execute the appropriate command via AI orchestrator
node .documind/scripts/ai-orchestrator.js [command] [parameters]

# Command examples:
node .documind/scripts/ai-orchestrator.js bootstrap
node .documind/scripts/ai-orchestrator.js expand user-authentication
node .documind/scripts/ai-orchestrator.js analyze payment-processing
node .documind/scripts/ai-orchestrator.js update api-reference
node .documind/scripts/ai-orchestrator.js index
node .documind/scripts/ai-orchestrator.js search "database schema"
```

### 3. Comprehensive Result Presentation
Parse the orchestrator's JSON output and present detailed results:
- **Human Documentation**: Files generated in `/docs/` with clear organization
- **AI Documentation**: AI-optimized content in `/docs/ai/` with token metrics
- **Cross-References**: Updated navigation and linking between both documentation types
- **Generation Summary**: File counts, locations, and processing statistics

### 4. Graceful Fallback
If DocuMind is not available:
1. Acknowledge the documentation request
2. Use Gemini's built-in documentation capabilities
3. Explain the enhanced dual-purpose generation available with DocuMind
4. Offer installation guidance if requested

## Command Execution Examples

### Bootstrap Documentation
User: `/document bootstrap` or "Generate all project documentation"

1. **Check**: `node .documind/scripts/detect-documind.js ai-report`
2. **Execute**: `node .documind/scripts/ai-orchestrator.js bootstrap`
3. **Present Results**:
   ```
   ✅ Complete documentation suite generated successfully!

   📚 Human Documentation (8 files):
   - /docs/01-getting-oriented/project-overview.md
   - /docs/02-core-concepts/ (4 concept files)
   - /docs/03-integrations/ (2 integration files)
   - /docs/04-development/contributing.md

   🤖 AI Documentation (8 files):
   - /docs/ai/ (AI-optimized versions)
   - Total tokens: 15,250
   - Updated AI_README.md master index

   Both documentation types are now available and cross-linked.
   ```

### Expand Concept
User: `/document expand authentication` or "Document the authentication system"

1. **Check**: `node .documind/scripts/detect-documind.js ai-report`
2. **Execute**: `node .documind/scripts/ai-orchestrator.js expand authentication`
3. **Present Results**: Show both human and AI documentation files created for the authentication concept

## Parameter Handling

Support these command parameters:
- **expand**: Concept name as second argument
- **analyze**: Integration/service name as second argument
- **update**: Section name as second argument
- **search**: Query string as second argument
- **bootstrap** and **index**: No additional parameters required

## Error Management

If orchestrator execution encounters issues:
1. Parse error details from the JSON response
2. Provide context-specific troubleshooting guidance
3. Suggest remediation steps based on the error type
4. Fall back to Gemini's native documentation generation
5. Ensure user productivity is maintained regardless of DocuMind status

## Output Quality Standards

Ensure all generated documentation meets these standards:
- **Accuracy**: Content reflects actual codebase and functionality
- **Completeness**: Both human and AI versions cover all necessary aspects
- **Consistency**: Formatting and structure follow established patterns
- **Accessibility**: Human docs are readable, AI docs are optimally structured
- **Maintenance**: Documentation is easy to update and extend

---

**Primary Objective**: Deliver comprehensive documentation automatically. Users should receive both human-readable and AI-optimized documentation through a single, simple command interface, with the dual-purpose generation being completely transparent to them.