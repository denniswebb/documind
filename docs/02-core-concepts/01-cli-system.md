# CLI System

> **Chapter Navigation**: [← Previous: Core Concepts Overview](README.md) | [Next: Installer Engine →](02-installer-engine.md) | [Table of Contents](../README.md)

## Overview

The DocuMind CLI System serves as the **primary interface** between developers and the DocuMind documentation engine. Built around the `cli.js` file, it provides a clean, intuitive command-line interface that handles project initialization, system updates, command registration, and help operations.

## Architecture

### Core Components

The CLI system is implemented as a single class with a clear command routing architecture:

```javascript
class DocuMindCLI {
  constructor() {
    this.commands = {
      'init': this.init.bind(this),
      'update': this.update.bind(this),
      'register': this.register.bind(this),
      'help': this.help.bind(this),
      'version': this.version.bind(this),
      // ... plus aliases
    };
  }
}
```

### Command Flow Architecture
```
User Input → Command Parsing → Validation → Execution → Output
     ↓              ↓             ↓           ↓         ↓
documind init   Extract args   Check deps   Run init  Success/Error
documind help   Identify cmd   Validate     Show help Display info
```

## Core Commands

### `documind init` - Project Initialization
**Purpose**: Sets up DocuMind in a new or existing project

**Process Flow:**
```javascript
async init(args) {
  // 1. Resolve target directory (current or specified)
  const targetDir = args[0] || process.cwd();
  const fullPath = path.resolve(targetDir);
  
  // 2. Check for existing installation
  if (await this.exists('.documind')) {
    // Prevent duplicate initialization
    return;
  }
  
  // 3. Copy immutable core system
  await this.copyDocuMindCore();
  
  // 4. Run intelligent installation
  const installer = new DocuMindInstaller();
  await installer.install();
}
```

**What It Does:**
1. **Directory Setup**: Changes to target directory or uses current working directory
2. **Duplication Prevention**: Checks for existing `.documind` installation
3. **Core System Deployment**: Copies immutable templates and scripts from package
4. **Environment Configuration**: Delegates to installer engine for AI tool detection

**Output Example:**
```bash
🧠 DocuMind - IDE-Native Documentation System

📁 Initializing DocuMind in: /Users/dev/my-project

  📱 Detected AI tools: claude, cursor
  ✓ DocuMind core system installed
  ✓ Generated CLAUDE.md configuration
  ✓ Generated .cursorrules configuration
  ✅ DocuMind installed successfully!
```

### `documind update` - System Updates
**Purpose**: Updates DocuMind to the latest version while preserving project configuration

**Process Flow:**
```javascript
async update(args) {
  const updater = new DocuMindUpdater();
  
  if (args[0] === '--local' && args[1]) {
    // Development: Update from local source
    await updater.updateFromLocal(args[1]);
  } else {
    // Production: Update from NPM/GitHub
    await updater.update();
  }
}
```

**Update Strategy:**
- **Immutable Core**: Replaces `.documind/` with latest version
- **Configuration Preservation**: Keeps existing AI assistant configurations
- **Documentation Safety**: Preserves all generated documentation in `docs/`
- **Version Tracking**: Updates `.documind/VERSION` for tracking

### `documind register` - Command Registration
**Purpose**: Registers DocuMind commands with detected AI tools

**Process Flow:**
```javascript
async register(args) {
  // 1. Verify DocuMind installation
  if (!await this.exists('.documind')) {
    console.error('DocuMind not initialized');
    process.exit(1);
  }
  
  // 2. Load command generator
  const generator = new CommandGenerator();
  
  // 3. Tool-specific or all tools
  const tool = args[0];
  if (tool && tool.startsWith('--')) {
    await generator.generateCommandsForTool(tool.substring(2));
  } else {
    const tools = await generator.detectAITools();
    for (const tool of tools) {
      await generator.generateCommandsForTool(tool);
    }
  }
}
```

**Registration Options:**
- **All Tools** (`documind register`): Auto-detects and configures all AI tools
- **Specific Tool** (`documind register --claude`): Configures only specified tool
- **Verification**: Confirms successful registration with command examples

### `documind help` - Help System
**Purpose**: Provides comprehensive usage information and examples

**Help Categories:**
1. **Command Syntax**: All available commands with options
2. **Usage Examples**: Real-world usage patterns
3. **AI Integration**: How to use commands with different AI assistants
4. **Natural Language Examples**: Conversational documentation patterns

**Output Structure:**
```
🧠 DocuMind - IDE-Native Documentation System

USAGE: documind <command> [options]

COMMANDS:
  init [directory]     Initialize DocuMind
  register [--tool]    Register slash commands
  update              Update to latest version

EXAMPLES:
  documind init                    # Initialize in current directory
  documind register --claude       # Register for Claude only

AFTER INSTALLATION:
  /document bootstrap             # Generate complete docs
  /document expand [concept]      # Document concepts
  "Document the auth system"      # Natural language
```

### `documind version` - Version Information
**Purpose**: Shows current DocuMind version for debugging and updates

**Implementation:**
```javascript
async version() {
  const packageJson = require('./package.json');
  console.log(`DocuMind v${packageJson.version}`);
}
```

## Error Handling Architecture

### Graceful Error Management
The CLI system implements comprehensive error handling:

```javascript
async run() {
  try {
    await this.commands[command](args.slice(1));
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}
```

**Error Categories:**
- **Command Not Found**: Unknown commands with help suggestion
- **Missing Dependencies**: DocuMind not initialized
- **File System Errors**: Permission issues, disk space
- **Network Errors**: Update failures, package access

**Error Handling Principles:**
- **User-Friendly Messages**: Clear error descriptions, not stack traces
- **Actionable Guidance**: Specific steps to resolve issues
- **Graceful Degradation**: Partial success where possible
- **Exit Codes**: Proper process exit codes for automation

## File System Integration

### Directory Management
```javascript
async copyDocuMindCore() {
  const sourceCore = path.join(__dirname, '.documind');
  const targetCore = path.join(process.cwd(), '.documind');
  
  await this.copyDirectory(sourceCore, targetCore);
  console.log('  ✓ DocuMind core system installed');
}
```

**Copy Strategy:**
- **Recursive Directory Copy**: Preserves entire `.documind` structure
- **Permission Preservation**: Maintains executable permissions on scripts
- **Overwrite Protection**: Prevents accidental data loss
- **Atomic Operations**: All-or-nothing installation approach

### Path Resolution
```javascript
const targetDir = args[0] || process.cwd();
const fullPath = path.resolve(targetDir);
process.chdir(fullPath);
```

**Path Handling Features:**
- **Relative Path Support**: `../other-project`, `./subproject`
- **Absolute Path Support**: `/Users/dev/project`
- **Home Directory Expansion**: `~/projects/myapp`
- **Current Directory Default**: No argument uses current location

## Integration Points

### Installer Engine Integration
```javascript
// CLI delegates environment setup to installer
const DocuMindInstaller = require('.documind/scripts/install.js');
const installer = new DocuMindInstaller();
await installer.install();
```

**Separation of Concerns:**
- **CLI**: User interface, command routing, basic validation
- **Installer**: AI tool detection, configuration generation, git integration
- **Clean Interface**: Simple delegation pattern without tight coupling

### Update System Integration
```javascript
// CLI delegates updates to dedicated updater
const DocuMindUpdater = require('.documind/scripts/update.js');
const updater = new DocuMindUpdater();
await updater.update();
```

**Update Coordination:**
- **Version Checking**: Compare current vs. available versions
- **Backup Creation**: Preserve existing configuration
- **Rollback Support**: Restore previous version on failure
- **Verification**: Confirm successful update completion

## Usage Patterns

### Development Workflow
```bash
# Initial setup
npx @documind/core init
git add . && git commit -m "Add DocuMind documentation system"

# Team member setup  
git clone repo && cd repo
# DocuMind commands immediately available

# Maintenance
documind update                    # Keep system current
documind register --cursor        # Add new AI tool
```

### CI/CD Integration
```bash  
# Automated documentation updates
documind update
/document bootstrap
git add docs/ && git commit -m "docs: Update documentation"
```

### Multi-Project Management
```bash
# Initialize multiple projects
documind init ~/projects/frontend
documind init ~/projects/backend  
documind init ~/projects/mobile

# Consistent documentation across all projects
```

## Extension Points

### Custom Commands
The command routing system can be extended with additional commands:

```javascript
// Future extension pattern
this.commands = {
  ...this.commands,
  'custom': this.customCommand.bind(this),
  'plugin': this.pluginCommand.bind(this)
};
```

### Custom Validation
Additional validation logic can be added to command methods:

```javascript
async init(args) {
  // Custom validation
  await this.validateProjectStructure();
  await this.validateDependencies();
  
  // Standard initialization
  await this.copyDocuMindCore();
  // ...
}
```

### Configuration Overrides
Command behavior can be modified through configuration:

```javascript
// Future: Configuration-driven command behavior
const config = await this.loadProjectConfig();
if (config.customInitialization) {
  await this.customInit(args, config);
} else {
  await this.standardInit(args);
}
```

## What's Next

The CLI System provides the user interface, but the real intelligence lies in the installer engine that detects your environment and configures DocuMind appropriately. Continue to [Installer Engine](02-installer-engine.md) to understand how DocuMind adapts to different AI tools and development environments.

---

> **Chapter Navigation**: [← Previous: Core Concepts Overview](README.md) | [Next: Installer Engine →](02-installer-engine.md) | [Table of Contents](../README.md)