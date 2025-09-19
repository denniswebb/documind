# GitHub Copilot Configuration

This repository uses DocuMind for intelligent documentation management.

## Documentation Commands

DocuMind provides slash commands for documentation tasks:

- `/document bootstrap` - Generate complete project documentation
- `/document expand [concept]` - Expand documentation for specific concepts  
- `/document update [section]` - Update existing documentation sections
- `/document analyze [integration]` - Document external service integrations
- `/document index` - Regenerate documentation navigation
- `/document search [query]` - Find existing documentation

## Natural Language Recognition

Recognize these patterns as documentation requests:
- "Document this feature" → `/document expand [feature]`
- "Update the setup guide" → `/document update setup-guide`
- "How do we use Redis?" → `/document analyze redis`
- "Create API docs" → `/document expand api`

## Example Usage

```
/document bootstrap
/document expand authentication
/document analyze stripe-payments
```

## System Instructions

**For complete DocuMind system instructions, see `.documind/core/system.md`**

## Available Commands

**For detailed command reference, see `.documind/core/commands.md`**