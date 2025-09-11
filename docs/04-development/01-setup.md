# Development Setup

> **Chapter Navigation**: [← Previous: Integrations Overview](../03-integrations/README.md) | [Next: Common Patterns →](02-patterns.md) | [Table of Contents](../README.md)

## Getting Started with DocuMind Development

This guide covers everything you need to know to set up a development environment for DocuMind, whether you're contributing to the core system, extending it with custom templates, or integrating it into your own projects.

## Prerequisites

### System Requirements
- **Node.js 16+**: DocuMind requires modern JavaScript features
- **NPM 7+**: Package management and script execution  
- **Git**: Version control and repository management
- **AI Assistant**: Claude, GitHub Copilot, Cursor, or Gemini CLI for documentation commands

### Development Tools (Recommended)
- **VS Code** or **Cursor**: Best IDE support for DocuMind development
- **Terminal/Command Line**: For CLI operations and testing
- **GitHub CLI** (optional): For repository operations and releases

## Installation Options

### Option 1: NPX Installation (Recommended)
```bash
# Initialize DocuMind in any project
npx @documind/core init

# Register commands with your AI assistant
npx @documind/core register
```

**Benefits:**
- Always uses latest version
- No global installation required
- Works immediately in any project
- Automatic updates available

### Option 2: Global Installation
```bash
# Install DocuMind globally
npm install -g @documind/core

# Use anywhere
documind init
documind register
documind update
```

**Benefits:**
- Shorter commands (`documind` vs `npx @documind/core`)
- Works offline after initial installation
- Consistent version across projects

### Option 3: Local Development Setup
```bash
# Clone the repository
git clone https://github.com/denniswebb/documind.git
cd documind

# Install development dependencies (none currently)
npm install

# Test local installation
node cli.js init ../test-project
```

**Benefits:**
- Full source code access
- Local modifications and testing
- Contribution development workflow

## Project Structure for Development

### Core DocuMind Development
```
documind/
├── cli.js                          # Main CLI interface
├── index.js                        # Programmatic API
├── package.json                    # NPM package configuration
├── .documind/                      # Core system (immutable)
│   ├── VERSION                    # Version tracking
│   ├── commands.md                # Command definitions
│   ├── system.md                  # System instructions
│   ├── templates/                 # Documentation templates
│   └── scripts/                   # Installation scripts
├── docs/                          # Generated documentation
├── CLAUDE.md                      # Claude instructions
├── .cursorrules                   # Cursor configuration
└── README.md                      # Project README
```

### Using DocuMind in Your Project
```
your-project/
├── .documind/                      # DocuMind core (installed)
├── docs/                          # Generated documentation
├── CLAUDE.md                      # AI assistant configuration
├── .cursorrules                   # Cursor configuration
├── [your application files...]    # Your project code
└── package.json                   # Your project configuration
```

## Development Workflow

### 1. Initial Setup
```bash
# For DocuMind core development
git clone https://github.com/denniswebb/documind.git
cd documind

# For project using DocuMind
npx @documind/core init
```

### 2. Development Cycle
```bash
# Make changes to core system or templates
nano .documind/templates/concept.md

# Test changes locally
node cli.js init ../test-project
cd ../test-project

# Test documentation generation
"AI Assistant: /document bootstrap"

# Verify output
ls docs/
cat docs/README.md
```

### 3. Testing and Validation
```bash
# Test CLI commands
documind help
documind version
documind register --claude

# Test AI integration
"AI Assistant: /document expand concept 'testing'"
"AI Assistant: /document analyze integration 'github'"

# Verify file generation
find docs/ -name "*.md" | head -10
```

## Configuration Files

### AI Assistant Configuration

#### Claude Configuration (`CLAUDE.md`)
```markdown
# Claude Instructions

This repository uses DocuMind for documentation management.

## Command Recognition
- `/document bootstrap` - Generate complete documentation
- `/document expand [concept]` - Document specific concepts
- Natural language: "Document the authentication system"

## System Behavior
[Detailed instructions for Claude...]
```

#### Cursor Configuration (`.cursorrules`)
```markdown
# DocuMind Integration

Recognize these documentation patterns:
- /document commands
- Natural language documentation requests
- Template-driven generation

[Additional Cursor-specific rules...]
```

#### GitHub Copilot Configuration
```markdown
# .github/copilot-instructions.md

DocuMind documentation system integration:
- Slash command support in chat
- Context-aware suggestions
- Template application

[Copilot-specific instructions...]
```

### Template Customization

#### Custom Concept Template
```bash
# Edit existing template
nano .documind/templates/concept.md

# Or create project-specific override
mkdir -p .documind/custom-templates/
cp .documind/templates/concept.md .documind/custom-templates/
nano .documind/custom-templates/concept.md
```

#### Template Variables
```markdown
# Available variables in templates
{PROJECT_NAME}        # Extracted from package.json or directory
{LAST_UPDATED}        # Current date/time
{REPOSITORY_URL}      # Git remote URL
{PROJECT_SUMMARY}     # Brief description
{ESSENTIAL_COMMANDS}  # Key commands for the project
```

## Environment Variables

### Development Configuration
```bash
# Optional: Enable debug output
export DOCUMIND_DEBUG=true

# Optional: Custom template directory
export DOCUMIND_TEMPLATES=/path/to/custom/templates

# Optional: AI tool override
export DOCUMIND_AI_TOOLS=claude,cursor
```

### Production Configuration
```bash
# Production installations typically need no environment variables
# All configuration is file-based and version-controlled
```

## Testing Your Setup

### Basic Functionality Test
```bash
# 1. Initialize DocuMind
documind init

# 2. Verify core system
ls -la .documind/
cat .documind/VERSION

# 3. Check AI configuration
cat CLAUDE.md | head -20
cat .cursorrules | head -20

# 4. Test command registration
documind register

# 5. Verify documentation generation
mkdir -p test-docs
echo "Test project" > README.md
# Use AI assistant: "/document bootstrap"

# 6. Check output
ls docs/
cat docs/README.md
```

### Integration Test with AI Assistant
```bash
# Test various command patterns
"AI Assistant: /document bootstrap"
"AI Assistant: /document expand concept 'cli-system'"
"AI Assistant: Document the package.json configuration"
"AI Assistant: Create getting started guide"

# Verify all generate proper documentation
find docs/ -name "*.md" -exec echo "=== {} ===" \; -exec head -5 {} \;
```

## Troubleshooting Development Issues

### Common Issues

#### DocuMind Not Found
```bash
# Check installation
which documind
npm list -g @documind/core

# Reinstall if needed
npm uninstall -g @documind/core
npm install -g @documind/core
```

#### Permission Issues
```bash
# Fix NPM permissions (macOS/Linux)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use NPX instead
npx @documind/core init
```

#### Template Issues
```bash
# Verify template directory
ls -la .documind/templates/

# Check template content
cat .documind/templates/concept.md | head -20

# Restore templates
documind update
```

#### AI Integration Issues
```bash
# Verify configuration files
cat CLAUDE.md | grep -i "document"
cat .cursorrules | grep -i "document"

# Regenerate configuration
documind register --claude
documind register --cursor
```

### Debug Mode
```bash
# Enable debug output
export DOCUMIND_DEBUG=true
documind init

# Check detailed logs
tail -f ~/.documind/debug.log  # (if implemented)
```

## Contributing to DocuMind

### Development Setup for Contributors
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/documind.git
cd documind

# Create development branch
git checkout -b feature/your-feature-name

# Make changes and test
node cli.js init ../test-project
cd ../test-project && npm init -y

# Test with AI assistant
"AI Assistant: /document bootstrap"
```

### Contribution Guidelines
1. **Template Changes**: Update templates in `.documind/templates/`
2. **CLI Changes**: Modify `cli.js` with backwards compatibility
3. **Documentation**: Update relevant documentation files
4. **Testing**: Test with multiple AI assistants
5. **Version Control**: Follow semantic versioning for releases

### Pull Request Process
```bash
# Ensure your changes work
npm test  # (when tests are implemented)

# Commit changes
git add .
git commit -m "feat: Add new template for API documentation"

# Push and create PR
git push origin feature/your-feature-name
# Create PR via GitHub interface
```

## What's Next

With your development environment set up, you're ready to explore common patterns and best practices. Continue to [Common Patterns](02-patterns.md) to learn DocuMind development patterns, template customization techniques, and integration strategies.

---

> **Chapter Navigation**: [← Previous: Integrations Overview](../03-integrations/README.md) | [Next: Common Patterns →](02-patterns.md) | [Table of Contents](../README.md)