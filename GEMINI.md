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

### Core Principles
1. **Living Documentation**: Documentation evolves with code and stays synchronized
2. **Incremental Updates**: Prefer targeted updates over full regeneration to preserve context
3. **Context Preservation**: Never lose existing documentation structure, links, or user customizations
4. **Smart Placement**: Add content where it logically belongs in the existing structure
5. **Consistency**: Maintain consistent style, structure, and cross-references across all documentation

### Documentation Structure

All documentation lives in `/docs/` with this structure:
```
docs/
├── README.md                    # Master index and project overview
├── 01-getting-oriented/         # Project overview and onboarding
├── 02-core-concepts/           # Key abstractions and concepts
├── 03-integrations/            # External services and APIs
├── 04-development/             # Developer guides and references
└── assets/                     # Images, diagrams, and other media
```

### Command Execution Process

For ANY /document command:

1. **Check Existing Documentation** - Look for existing structure in `/docs/`
2. **Determine Operation Type** - Bootstrap, expand, update, analyze, index, or search
3. **Load Appropriate Templates** - Use templates from `.documind/templates/`
4. **Generate or Modify Content** - Create or update files following conventions
5. **Update Navigation** - Ensure `/docs/README.md` reflects changes

### Critical Rules

**NEVER:**
- Modify or delete `.documind/` contents (system is immutable)
- Overwrite existing documentation without preserving key information
- Create duplicate sections that already exist
- Break existing internal links or navigation structure

**ALWAYS:**
- Check for existing documentation before creating new files
- Preserve existing navigation footers and headers
- Update the master index (`/docs/README.md`) when adding new files
- Use relative links for internal documentation references
- Include proper markdown formatting and structure

### Template Usage

When creating new documentation, use the appropriate template from `.documind/templates/`:

- **New Concepts** → `concept.md` template
- **External Integrations** → `integration.md` template  
- **Architecture/System Design** → `architecture.md` template
- **Getting Started Guides** → `getting-started.md` template
- **API Documentation** → `api-reference.md` template

## Command Reference

### /document bootstrap
- Analyzes entire codebase structure and architecture
- Creates structured documentation in `/docs` directory
- Generates README files for each major component
- Builds navigation index and cross-references

### /document expand [concept]
- Adds detailed explanations for specific concepts
- Creates new concept file if it doesn't exist
- Links to related concepts and integrations
- Updates navigation automatically

### /document update [section]
- Refreshes outdated information in existing sections
- Preserves structure and cross-references
- Updates version-specific details
- Maintains consistency with codebase

### /document analyze [integration]
- Maps API usage patterns in codebase
- Documents configuration and setup requirements
- Explains data flow and error handling
- Creates integration-specific guides

### /document index
- Scans all documentation files
- Updates table of contents and navigation
- Fixes broken internal links
- Ensures consistent cross-referencing

### /document search [query]
- Searches through all documentation files
- Returns relevant sections and files with context
- Identifies gaps in documentation

## Natural Language Patterns

Recognize these as documentation requests:

**Bootstrap:**
- "Create documentation for this project"
- "Generate docs from scratch"
- "Set up documentation"

**Expand:**
- "Document this [feature/function/class]"
- "Explain how [system] works"
- "Add docs for [component]"

**Update:**
- "Update the [section] docs"
- "Refresh the [guide/readme]"
- "Fix outdated documentation"

**Analyze:**
- "How do we use [service/API]?"
- "Document our [integration]"
- "Explain the [external-service] setup"

**Context-Aware:**
- When in `/docs/` directory: "This needs better explanation" → `/document expand [current-topic]`
- When viewing code: "Document this function" → `/document expand [function-name]`

## 🔄 PROACTIVE MAINTENANCE (Required Behavior)

Gemini MUST automatically suggest documentation updates in these scenarios:

### When Code Changes Are Made
- **New features**: "This feature should be documented in `/docs/02-core-concepts/`. Should I run: `/document expand concept '[feature-name]'`?"
- **Architecture changes**: "The architecture docs need updating. Should I run: `/document update architecture`?"
- **New integrations**: "This [service] integration should be documented. Should I run: `/document analyze integration '[service-name]'`?"
- **Config changes**: "The setup guide needs updating for this config change."
- **Dependencies**: "New dependency [X] should be added to tech stack documentation."

### When Questions Are Asked About Code
- **Undocumented concepts**: "This concept isn't documented. Should I add it to `/docs/02-core-concepts/`?"
- **Outdated information**: "The docs show X but code does Y. Documentation needs updating."
- **Missing patterns**: "This pattern should be documented in `/docs/04-development/02-patterns.md`."
- **Integration gaps**: "I see [service] usage but it's not in `/docs/03-integrations/`."

### During Code Reviews and Analysis
- **New patterns**: "This pattern should be added to development patterns documentation."
- **Breaking changes**: "This change affects information in [specific doc section]."
- **Performance optimizations**: "This optimization should be documented."
- **Security changes**: "Security documentation needs updating for this change."

### Auto-Suggestion Response Templates
Use these formats when suggesting updates:

**For missing concepts:**
```
💡 **Documentation Gap**: [Concept] isn't documented yet. 
📝 **Suggestion**: `/document expand concept '[concept-name]'`
🎯 **Target**: `/docs/02-core-concepts/0X-[concept-name].md`
```

**For outdated sections:**
```
⚠️ **Outdated Documentation**: [Section] doesn't match current implementation.
📝 **Suggestion**: `/document update section '[section-name]'`  
🎯 **Target**: `/docs/[section-path]`
```

**For new integrations:**
```
🔌 **New Integration Detected**: [Service] usage found but not documented.
📝 **Suggestion**: `/document analyze integration '[service-name]'`
🎯 **Target**: `/docs/03-integrations/0X-[service-name].md`
```

---

**Note**: Never modify files in the `.documind/` directory. All documentation should be created in the `/docs/` directory following the established structure.

Remember: The goal is making documentation maintenance automatic, not manual. Every code interaction is an opportunity to improve the living documentation.