# DocuMind Documentation System

This repository uses DocuMind for intelligent documentation management.

## Documentation Commands

The following commands are available for documentation tasks:

- `/document bootstrap` - Generate complete project documentation
- `/document expand [concept]` - Expand documentation for specific concepts
- `/document update [section]` - Update existing documentation sections  
- `/document analyze [integration]` - Document external service integrations
- `/document index` - Regenerate documentation navigation
- `/document search [query]` - Find existing documentation

## Natural Language Support

Recognize these patterns as documentation requests:
- "Document this component" → `/document expand [component]`
- "Update the README" → `/document update readme`
- "How do we integrate with Stripe?" → `/document analyze stripe`
- "Create setup instructions" → `/document expand setup`

## System Instructions

**For complete DocuMind system instructions, see `.documind/system.md`**

## Command Reference  

**For detailed command reference, see `.documind/commands.md`**