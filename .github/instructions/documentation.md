applyTo: ["docs/**", "README.md", "*.md"]
---

# Documentation Instructions

This file contains special instructions for GitHub Copilot when working with documentation files.

When editing documentation files, follow DocuMind conventions:

# DocuMind System Instructions

## Core Principles
1. **Living Documentation**: Documentation evolves with code and stays synchronized
2. **Incremental Updates**: Prefer targeted updates over full regeneration to preserve context
3. **Context Preservation**: Never lose existing documentation structure, links, or user customizations
4. **Smart Placement**: Add content where it logically belongs in the existing structure
5. **Consistency**: Maintain consistent style, structure, and cross-references across all documentation

## Documentation Structure

All documentation lives in `/docs/` with this recommended structure:
```
docs/
├── README.md                    # Master index and project overview
├── 01-getting-oriented/         # Project overview and onboarding
│   ├── overview.md             # High-level project description
│   ├── getting-started.md      # Quick start guide
│   └── architecture.md         # System architecture overview
├── 02-core-concepts/           # Key abstractions and concepts
│   ├── [concept-name].md       # Individual concept documents
│   └── glossary.md             # Terms and definitions
├── 03-integrations/            # External services and APIs
│   ├── [service-name].md       # Individual integration guides
│   └── overview.md             # Integration overview
├── 04-development/             # Developer guides and references
│   ├── setup.md                # Development environment setup
│   ├── contributing.md         # Contribution guidelines
│   ├── api-reference.md        # API documentation
│   └── testing.md              # Testing guides
└── assets/                     # Images, diagrams, and other media
```

## Command Execution Process

### For ANY /document command:

1. **Check Existing Documentation**
   - Look for `/docs/README.md` to understand current structure
   - Identify existing files that relate to the requested topic
   - Preserve any custom navigation or structure

2. **Determine Operation Type**
   - **Bootstrap**: Create complete documentation structure from scratch
   - **Expand**: Add or enhance documentation for specific concepts
   - **Update**: Refresh existing documentation with current information
   - **Analyze**: Document external integrations or dependencies
   - **Index**: Rebuild navigation and cross-references
   - **Search**: Find and return relevant existing documentation

3. **Load Appropriate Templates**
   - Use templates from `.documind/templates/` as starting points
   - Adapt templates to fit existing project structure and style
   - Maintain consistency with established patterns

4. **Generate or Modify Content**
   - Create new files only when necessary
   - Prefer updating existing files when content fits
   - Ensure all content follows project conventions

5. **Update Navigation and Index**
   - Update `/docs/README.md` with new or changed sections
   - Fix any broken internal links
   - Ensure consistent cross-referencing

## Critical Rules

### NEVER:
- Modify or delete `.documind/` contents (system is immutable)
- Overwrite existing documentation without preserving key information
- Create duplicate sections that already exist
- Break existing internal links or navigation structure
- Remove user customizations or manual additions

### ALWAYS:
- Check for existing documentation before creating new files
- Preserve existing navigation footers and headers
- Update the master index (`/docs/README.md`) when adding new files
- Use relative links for internal documentation references
- Include proper markdown formatting and structure
- Add navigation breadcrumbs for deep nested documents

## Template Usage

When creating new documentation, use the appropriate template from `.documind/templates/`:

- **New Concepts** → `concept.md` template
- **External Integrations** → `integration.md` template  
- **Architecture/System Design** → `architecture.md` template
- **Getting Started Guides** → `getting-started.md` template
- **API Documentation** → `api-reference.md` template

## Content Standards

### Writing Style
- Use clear, concise language
- Write for your audience (developers, users, etc.)
- Include practical examples and code snippets
- Explain the "why" behind decisions, not just the "what"

### Code Examples
- Always include working, tested code examples
- Show both successful and error cases where relevant
- Use real data that matches the project context
- Include necessary imports and setup code

### Links and References
- Use descriptive link text (not "click here" or "see this")
- Link to related concepts and sections
- Include external links to relevant documentation
- Keep links up to date during updates

## Error Handling

If a command cannot be completed:
1. Explain what was attempted and why it failed
2. Suggest alternative approaches
3. Identify what information is needed to proceed
4. Never leave documentation in a broken state

## Version Control Integration

- All documentation should be committed to version control
- Use meaningful commit messages for documentation changes  
- Consider the documentation as part of the codebase
- Tag major documentation releases when appropriate

## Maintenance Guidelines

### Regular Tasks
- Review and update outdated information
- Fix broken links and references
- Ensure examples still work with current codebase
- Update screenshots and diagrams as UI changes

### Quality Checks
- Verify all code examples execute correctly
- Check that all links resolve properly  
- Ensure consistent formatting and style
- Validate that navigation structure makes sense

This system is designed to provide intelligent, context-aware documentation management that grows with your project while maintaining quality and consistency.