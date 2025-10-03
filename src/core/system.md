# DocuMind System Instructions

## STEP 0: SMART OPERATION DETECTION

### Check for Existing Documentation
1. **Look for `docs/README.md`**: If it exists, documentation system already exists
2. **If no docs directory**: This is a fresh bootstrap

### If Documentation EXISTS - Show Options and Wait
If docs already exist, DO NOT automatically regenerate. Instead, show the user their options:

```markdown
## 📚 Documentation Already Exists

I found an existing documentation system in `/docs/`. Here are your options:

### 🔍 Expand Existing Content
- `/document expand concept "[concept-name]"` - Add detail to a specific concept
- `/document expand section "[section-name]"` - Add more content to any section

### 🔌 Analyze New Integrations  
- `/document analyze integration "[service-name]"` - Document how a service is used
- `/document analyze dependency "[package-name]"` - Document a specific dependency

### 🔄 Update Existing Content
- `/document update section "[section-name]"` - Refresh outdated information
- `/document update architecture` - Refresh system architecture docs
- `/document update tech-stack` - Update technology inventory

### 📁 File-Specific Analysis
- `/document deep-dive #file:[path]"` - Analyze specific file and update related docs

### 🗂️ Structure Management
- `/document list concepts` - Show all documented concepts
- `/document list integrations` - Show all documented integrations
- `/document list sections` - Show all documentation sections

### 🔥 Nuclear Option
- `/document bootstrap` - Completely regenerate from scratch (destructive!)

**What would you like me to help you with?**
```

### If NO Documentation EXISTS - Bootstrap Mode
If no docs directory exists, proceed with comprehensive generation below.

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

## INCREMENTAL UPDATE EXECUTION

### For Concept Expansion
**Process:**
1. **Find existing concept**: Check `docs/02-core-concepts/` for matching file
2. **Read current content**: Load existing documentation for this concept  
3. **Identify gaps**: What aspects need more detail?
4. **Analyze relevant code**: Focus only on files related to this concept
5. **Enhance documentation**: Add sections, examples, or clarity
6. **Preserve navigation**: Maintain existing cross-references and structure

**Output Format:**
- **Update existing file** OR **Create new concept file**
- **Update master index**: Add new concept to navigation if needed
- **Update related files**: Fix any cross-references that need updating
- **Brief summary**: "Updated [concept] documentation with [specific improvements]"

### For Integration Analysis  
**Process:**
1. **Scan codebase**: Find all references to the integration service
2. **Analyze usage patterns**: How is the service called and configured?
3. **Check existing docs**: Is there already an integration file for this service?
4. **Create/update file**: Either enhance existing or create new integration guide
5. **Update integrations index**: Ensure service is listed in main integrations overview

**Output Format:**
- **Integration guide file**: Detailed analysis of service usage
- **Update overview file**: Add service to main integrations list
- **Configuration details**: Where and how the service is configured
- **Code examples**: Real usage patterns from the codebase

### For Section Updates
**Process:**
1. **Load existing section**: Read current content of the target file
2. **Identify outdated info**: Compare documentation with current code
3. **Re-analyze relevant code**: Focus on areas that affect this section
4. **Update content**: Refresh outdated information while preserving structure
5. **Maintain quality**: Ensure updated content matches documentation standards

**Output Format:**
- **Updated section file**: Refreshed with current information
- **Change summary**: Brief note of what was updated and why
- **Cross-reference check**: Ensure related sections are still accurate

## FRESH GENERATION PROCESS

### STEP 1: COMPREHENSIVE WORKSPACE ANALYSIS

#### Technology Stack Discovery
Analyze these files to understand the complete tech stack:
- **Package files**: package.json, requirements.txt, Cargo.toml, pom.xml, *.csproj, go.mod
- **Config files**: tsconfig.json, webpack.config.js, Dockerfile, docker-compose.yml
- **Build files**: Makefile, CMakeLists.txt, build.gradle, *.sln
- **CI/CD files**: .github/workflows/, .gitlab-ci.yml, Jenkinsfile
- **Environment files**: .env.example, config/, settings/

#### External Service Detection
Analyze for external service integrations:
- **Database connections**: Connection strings, ORM configs, migration files
- **API integrations**: HTTP client usage, webhook endpoints, third-party SDK imports
- **Message queues**: Redis, RabbitMQ, AWS SQS/SNS configurations
- **Cloud services**: AWS, GCP, Azure SDK usage and configuration
- **Authentication**: OAuth configs, JWT handling, auth service integrations
- **Monitoring**: Logging services, metrics collection, error tracking
- **Storage**: S3, blob storage, CDN configurations

#### File System Mapping
Generate a comprehensive directory tree showing:
- Main source directories and their purposes
- Configuration and build directories  
- Test and documentation directories
- Important individual files (entry points, configs, etc.)

### STEP 2: ARCHITECTURAL ANALYSIS

#### System Architecture Discovery
- **Entry points**: Main application startup files and processes
- **Core abstractions**: Key classes, modules, services (5-10 main concepts)
- **Architectural patterns**: MVC, microservices, event-driven, etc.
- **Data flow**: How information moves through the system
- **External boundaries**: APIs, databases, third-party services

#### Service Interaction Mapping
For each external service identified:
- **Purpose**: What business need it serves
- **Integration method**: SDK, REST API, message queue, etc.  
- **Data exchanged**: What information flows in/out
- **Dependencies**: How critical it is to core functionality
- **Configuration**: Where connection details are managed

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
- Edit files outside the `docs/` directory during `/document` operations. If you discover discrepancies in files like `README.md` or other non-doc assets, raise an explicit alert and request maintainer review instead of modifying them yourself.
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

## OUTPUT EXECUTION REQUIREMENTS

### For INCREMENTAL UPDATES:
1. **Read existing documentation**: Load current structure and content
2. **Focused analysis**: Only analyze code relevant to the specific update
3. **Preserve structure**: Maintain existing navigation and cross-references
4. **Update target files**: Modify only the specific files that need changes
5. **Brief summary**: Explain what was updated and why

### For FRESH GENERATION:
1. **Create directory structure**: Generate all necessary directories
2. **Generate all files**: Create complete documentation system in one execution
3. **Include timestamps**: Add "Last Updated" dates to all generated files
4. **Cross-reference**: Ensure all internal links work correctly
5. **Validate external services**: Verify detected integrations by examining actual code usage

## QUALITY STANDARDS

- **Comprehensive coverage**: Document all major aspects of the system
- **Beginner-friendly**: Assume readers are new to this specific codebase
- **Living document emphasis**: Make it clear this can and should be expanded
- **Practical utility**: Focus on information developers actually need
- **Technical accuracy**: Ensure all technical details are correct
- **Organized structure**: Maintain clear book-like organization throughout
- **Incremental updates**: Preserve existing content when making updates

## SUPPORTED EXPANSION COMMANDS

These commands work incrementally:
- **expand concept "[concept-name]"**: Add more detail to specific concept
- **analyze integration "[service-name]"**: Deep dive on external service usage  
- **update section "[section-name]"**: Refresh existing documentation section
- **deep-dive #file:[path]"**: Analyze specific file in context of documentation
- **update architecture**: Refresh system architecture documentation
- **update tech-stack**: Update technology inventory
- **list concepts**: Show all documented concepts
- **list integrations**: Show all integrations  
- **list sections**: Show documentation structure
- **bootstrap**: Full regeneration (use sparingly)

## DOCSIFY INTEGRATION

When creating documentation, also generate enhanced web interface:

1. **Create `docs/index.html`**: Use template from `.documind/templates/docsify-index.html`
2. **Create `docs/_sidebar.md`**: Use template from `.documind/templates/docsify-sidebar.md`
3. **Replace placeholders**: {PROJECT_NAME}, {REPOSITORY_URL}, etc.
4. **Generate navigation**: Update sidebar with actual chapters and sections

## PROACTIVE MAINTENANCE

AI assistants should automatically suggest documentation updates when:
- **New features**: "This feature should be documented. Should I run: `/document expand concept '[feature-name]'`?"
- **Architecture changes**: "The architecture docs need updating. Should I run: `/document update architecture`?"
- **New integrations**: "This [service] integration should be documented. Should I run: `/document analyze integration '[service-name]'`?"
- **Outdated information**: "The docs show X but code does Y. Documentation needs updating."