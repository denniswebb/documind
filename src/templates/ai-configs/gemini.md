# Gemini CLI Instructions

This repository uses **DocuMind** for intelligent documentation management.

## Documentation Commands

DocuMind provides slash commands that you can recognize and execute:

- `/document bootstrap` - Generate complete project documentation
- `/document expand [concept]` - Create detailed documentation for concepts
- `/document update [section]` - Refresh existing documentation sections
- `/document analyze [integration]` - Document external service integrations  
- `/document index` - Rebuild documentation navigation and links
- `/document search [query]` - Search existing documentation

## Natural Language Recognition

When users request documentation tasks, recognize these patterns:

- "Document this feature" → `/document expand [feature]`
- "Update the installation guide" → `/document update installation`  
- "How do we use MongoDB?" → `/document analyze mongodb`
- "Create API documentation" → `/document expand api`
- "Generate project docs" → `/document bootstrap`

## System Instructions

Follow these instructions when executing documentation commands:

**For complete DocuMind system instructions, see `.documind/system.md`**

## Command Reference

**For detailed command reference, see `.documind/commands.md`**

---

**Note**: Never modify files in the `.documind/` directory. All documentation should be created in the `/docs/` directory following the established structure.