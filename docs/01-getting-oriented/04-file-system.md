# File System Guide

> **Chapter Navigation**: [← Previous: Architecture](03-architecture.md) | [Next: Core Concepts →](../02-core-concepts/README.md) | [Table of Contents](../README.md)

## Overview

DocuMind organizes files into clear, purpose-driven directories that separate immutable core system components from project-specific configuration and generated documentation. Understanding this structure helps you navigate, maintain, and extend your DocuMind installation.

## Complete File System Layout

```
your-project/
├── .documind/                          # IMMUTABLE: Core DocuMind system
│   ├── VERSION                         # Current DocuMind version
│   ├── commands.md                     # Command definitions and syntax  
│   ├── system.md                       # Core system instructions
│   ├── templates/                      # Professional documentation templates
│   │   ├── concept.md                 # Core concept documentation
│   │   ├── integration.md             # External service integration
│   │   ├── architecture.md            # System architecture
│   │   ├── getting-started.md         # Getting started guide
│   │   ├── api-reference.md           # API documentation
│   │   ├── docs-readme.md             # Master documentation index
│   │   ├── docsify-index.html         # Enhanced web interface
│   │   └── docsify-sidebar.md         # Web navigation sidebar
│   └── scripts/                       # Installation and update logic
│       ├── install.js                 # Project initialization
│       ├── update.js                  # System updates
│       └── generate-commands.js       # Command registration
│
├── docs/                               # GENERATED: Documentation output
│   ├── README.md                      # Master index and navigation
│   ├── index.html                     # Enhanced web interface (optional)
│   ├── _sidebar.md                    # Web navigation (optional)
│   ├── 01-getting-oriented/           # Project orientation and overview
│   │   ├── 01-introduction.md        # What this project does
│   │   ├── 02-tech-stack.md          # Technology choices
│   │   ├── 03-architecture.md        # System design
│   │   └── 04-file-system.md         # This file
│   ├── 02-core-concepts/              # Key system abstractions
│   │   ├── README.md                 # Core concepts overview
│   │   ├── 01-[concept].md           # Individual concept files
│   │   └── ...                       # Additional concepts
│   ├── 03-integrations/               # External service documentation
│   │   ├── README.md                 # Integrations overview  
│   │   ├── 01-[service].md           # Individual integration guides
│   │   └── ...                       # Additional integrations
│   ├── 04-development/                # Developer guides
│   │   ├── 01-setup.md               # Development environment
│   │   ├── 02-patterns.md            # Common code patterns
│   │   ├── 03-testing.md             # Testing strategy
│   │   └── 04-deployment.md          # Deployment guide
│   └── 99-appendices/                 # Supporting materials
│       ├── glossary.md               # Terms and definitions
│       ├── troubleshooting.md        # Common issues
│       └── changelog.md              # Documentation changes
│
├── AI_ASSISTANT_CONFIGURATION/        # AI tool integration files
│   ├── CLAUDE.md                     # Claude (Anthropic) instructions
│   ├── .cursorrules                  # Cursor IDE configuration  
│   ├── .cursor/rules/documind.mdc    # Modern Cursor configuration
│   ├── .github/copilot-instructions.md  # GitHub Copilot setup
│   ├── GEMINI.md                     # Gemini CLI configuration
│   └── [Other AI tool configs]      # Future AI assistant support
│
└── [Your existing project files...]   # Your application code
```

## Directory Purposes

### `.documind/` - Immutable Core System
**Purpose**: Contains the DocuMind engine and should never be manually modified.

**Key Files:**
- **`VERSION`**: Tracks current DocuMind version for update management
- **`commands.md`**: Defines all available documentation commands and their syntax
- **`system.md`**: Core system instructions that guide AI assistant behavior

**Templates Subdirectory:**
- **`concept.md`**: Template for documenting core system abstractions
- **`integration.md`**: Template for external service integration guides  
- **`architecture.md`**: Template for system architecture documentation
- **`getting-started.md`**: Template for setup and onboarding guides
- **`api-reference.md`**: Template for comprehensive API documentation
- **`docs-readme.md`**: Template for the master documentation index
- **`docsify-index.html`**: Template for enhanced web documentation interface

**Scripts Subdirectory:**
- **`install.js`**: Handles DocuMind installation and AI tool detection
- **`update.js`**: Manages system updates and configuration regeneration
- **`generate-commands.js`**: Creates AI tool-specific command configurations

### `docs/` - Generated Documentation
**Purpose**: Contains all AI-generated documentation content.

**Structure Philosophy:**
- **Book-like Organization**: Numbered chapters for sequential reading
- **Hierarchical Navigation**: Clear parent-child relationships
- **Cross-Referenced**: Links between related concepts and sections
- **Template-Driven**: Consistent formatting and structure

**Chapter Organization:**
1. **Getting Oriented** (`01-`): Project overview, tech stack, architecture
2. **Core Concepts** (`02-`): Key system abstractions and patterns  
3. **Integrations** (`03-`): External services and API integrations
4. **Development** (`04-`): Setup, patterns, testing, deployment
5. **Appendices** (`99-`): Supporting materials and references

### AI Assistant Configuration Files
**Purpose**: Teaches each AI assistant how to use DocuMind effectively.

**Per-Tool Configuration:**
- **Claude**: `CLAUDE.md` - Comprehensive instructions with natural language recognition
- **Cursor**: `.cursorrules` or `.cursor/rules/documind.mdc` - IDE integration rules
- **Copilot**: `.github/copilot-instructions.md` - GitHub workflow integration
- **Gemini**: `GEMINI.md` - CLI command patterns and workflows

## File Naming Conventions

### Documentation Files
- **Numbered Prefixes**: `01-`, `02-`, etc. for chapter ordering
- **Descriptive Names**: `getting-started.md`, not `gs.md`
- **Kebab Case**: Words separated by hyphens
- **README Files**: Overview files for each directory section

### Template Files
- **Purpose-Based**: Named after their documentation purpose
- **Lowercase**: All template files use lowercase names
- **Extension**: Always `.md` for Markdown templates

### Configuration Files  
- **Tool-Specific**: Named after the AI tool they configure
- **Standard Locations**: Follow each tool's expected configuration location
- **Uppercase**: `CLAUDE.md`, `GEMINI.md` for prominent visibility

## Navigation Patterns

### Cross-Chapter Links
```markdown
# Relative links between chapters
[System Architecture](../01-getting-oriented/03-architecture.md)
[Core Concepts Overview](../02-core-concepts/README.md)
[Redis Integration](../03-integrations/02-redis.md)
```

### Chapter Navigation Headers
```markdown  
> **Chapter Navigation**: [← Previous: Tech Stack](02-tech-stack.md) | [Next: Architecture →](03-architecture.md) | [Table of Contents](../README.md)
```

### Section Navigation Footers
```markdown
---
> **Chapter Navigation**: [← Previous: Tech Stack](02-tech-stack.md) | [Next: Architecture →](03-architecture.md) | [Table of Contents](../README.md)
```

## File Modification Guidelines

### Files You Should Modify
- **Documentation Content** (`docs/`): Update content, add examples, improve explanations
- **Navigation Links**: Fix broken links or improve cross-references
- **Appendices**: Add troubleshooting, glossary entries, or changelog updates

### Files You Should NOT Modify
- **Core System** (`.documind/`): These files are managed by DocuMind updates
- **Templates**: These ensure consistency across projects
- **Scripts**: Installation and update logic should not be modified

### Files You Can Customize
- **AI Configuration**: Tailor instructions to your team's preferences
- **Documentation Structure**: Add custom chapters or sections
- **Styling**: Customize web interface appearance

## Web Interface Setup

### Basic Serving
```bash
# Serve documentation locally
cd docs && npx serve .
# Visit: http://localhost:3000
```

### Enhanced Interface (Docsify)
```bash
# Generate enhanced web interface  
/document setup web-interface

# Serve with Docsify
cd docs && npx docsify serve .
# Visit: http://localhost:3000
```

**Enhanced Features:**
- **Search**: Full-text search across all documentation
- **Sidebar Navigation**: Collapsible, organized navigation
- **Responsive Design**: Mobile-friendly documentation
- **Syntax Highlighting**: Code examples with proper formatting
- **Dark Mode**: User preference support

## Backup and Version Control

### What to Commit
✅ **Configuration Files**: `CLAUDE.md`, `.cursorrules`, etc.  
✅ **Generated Documentation**: All files in `docs/`  
✅ **Core System**: `.documind/` directory for team consistency  

### What to Ignore (Optional)
❌ **Temporary Files**: Editor backups, system files  
❌ **Build Artifacts**: If you add build processes  
❌ **Local Configuration**: Personal AI assistant settings  

### Backup Strategy
```bash
# Complete DocuMind backup
git add .documind/ docs/ *.md
git commit -m "docs: Update DocuMind documentation system"

# Update-specific backup
git add docs/
git commit -m "docs: Update architecture documentation"
```

## Troubleshooting File Issues

### Missing Templates
```bash
# Reinstall core system  
documind update

# Or restore from package
npm install -g @documind/core
documind init --force
```

### Broken Navigation
```bash
# Regenerate navigation
/document index

# Or rebuild complete documentation
/document bootstrap
```

### Configuration Issues
```bash
# Regenerate AI configurations
documind register

# Or target specific tool
documind register --claude
```

## What's Next

Now that you understand how DocuMind organizes files and directories, you're ready to explore the core concepts that power the system. Continue to [Core Concepts Overview](../02-core-concepts/README.md) to understand the key abstractions that make DocuMind work.

---

> **Chapter Navigation**: [← Previous: Architecture](03-architecture.md) | [Next: Core Concepts →](../02-core-concepts/README.md) | [Table of Contents](../README.md)