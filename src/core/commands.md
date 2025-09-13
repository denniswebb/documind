# DocuMind Commands

## Core Commands

### /document bootstrap
Generate complete documentation from scratch.
- Analyzes entire codebase structure and architecture
- Creates structured documentation in `/docs` directory
- Generates README files for each major component
- Builds navigation index and cross-references
- Sets up documentation infrastructure

**Usage:**
- `/document bootstrap`
- "Bootstrap the documentation"
- "Generate complete documentation for this project"

### /document expand [concept]
Expand documentation for a specific concept or feature.
- Example: `/document expand authentication`
- Adds detailed explanations to existing concept
- Creates new concept file if it doesn't exist
- Links to related concepts and integrations
- Updates navigation automatically

**Usage:**
- `/document expand user-authentication`
- `/document expand database-schema`
- "Document the payment processing system"
- "Expand the API authentication section"

### /document update [section]
Update existing documentation section with current information.
- Example: `/document update setup-guide`
- Refreshes outdated information
- Preserves structure and cross-references
- Updates version-specific details
- Maintains consistency with codebase

**Usage:**
- `/document update installation`
- `/document update api-reference`
- "Update the getting started guide"
- "Refresh the deployment documentation"

### /document analyze [integration]
Document external service integration or dependency.
- Example: `/document analyze stripe-payments`
- Maps API usage patterns in codebase
- Documents configuration and setup requirements
- Explains data flow and error handling
- Creates integration-specific guides

**Usage:**
- `/document analyze redis-cache`
- `/document analyze aws-s3`
- "Document the MongoDB integration"
- "Analyze how we use the Slack API"

### /document index
Regenerate documentation index and navigation.
- Scans all documentation files
- Updates table of contents
- Fixes broken internal links
- Ensures consistent navigation structure
- Updates cross-references

**Usage:**
- `/document index`
- "Rebuild the documentation index"
- "Fix the navigation structure"

### /document search [query]
Find existing documentation about a topic.
- Searches through all documentation files
- Returns relevant sections and files
- Shows context and links
- Identifies gaps in documentation

**Usage:**
- `/document search authentication`
- `/document search API endpoints`
- "Find documentation about user roles"
- "Search for database migration info"

## Smart Command Recognition

The AI should recognize these natural language variants and map them to the appropriate /document commands:

### Bootstrap Patterns
- "Create documentation for this project"
- "Generate docs from scratch"
- "Set up documentation"
- "Document this entire codebase"

### Expand Patterns
- "Document this [feature/function/class]"
- "Explain how [system] works"
- "Add docs for [component]"
- "Create documentation for [concept]"

### Update Patterns  
- "Update the [section] docs"
- "Refresh the [guide/readme]"
- "Fix outdated documentation"
- "Revise the [section] information"

### Analyze Patterns
- "How do we use [service/API]?"
- "Document our [integration]"
- "Explain the [external-service] setup"
- "Map out the [third-party] usage"

### Index Patterns
- "Fix the navigation"
- "Update the table of contents"
- "Rebuild the index"
- "Fix broken links"

### Search Patterns
- "Find docs about [topic]"
- "Where is [concept] documented?"
- "Search for [term] in documentation"
- "Show me docs on [subject]"

## Context-Aware Recognition

When the AI detects the user is working in a documentation context (files in `/docs/`, editing markdown files, or discussing documentation), it should be more aggressive about recognizing documentation commands:

- "This needs better explanation" → `/document expand [current-topic]`
- "The setup guide is outdated" → `/document update setup-guide`
- "How does this work?" → `/document expand [current-system]`
- "Add an example" → `/document expand [current-section]` with focus on examples