# DocuMind 🧠

**IDE-Native Documentation System with AI-Powered Slash Commands**

DocuMind transforms how you document your projects by enabling documentation commands directly in your IDE through AI assistants. No external tools, no separate applications - just natural documentation commands that work where you code.

## ✨ Features

- **🎯 Slash Commands**: Use `/document bootstrap`, `/document expand [concept]`, etc.
- **🗣️ Natural Language**: "Document the authentication system" → automatic documentation
- **🔌 IDE Native**: Works with GitHub Copilot, Claude, Cursor, Gemini CLI
- **📦 Zero Install**: Clone repo → commands work instantly for everyone
- **🔄 Version Controlled**: All configuration tracked in git
- **🎨 Template System**: Consistent, professional documentation structure
- **🔗 Smart Linking**: Automatic cross-references and navigation

## 🚀 Quick Start

### Installation

```bash
# Option 1: NPX (recommended)
npx @documind/core init

# Option 2: Global install
npm install -g @documind/core
documind init

# Option 3: Clone and run
git clone https://github.com/denniswebb/documind.git
cd your-project
node /path/to/documind/.documind/scripts/install.js
```

### First Use

After installation, try any of these with your AI assistant:

```
/document bootstrap
/document expand authentication  
/document analyze stripe-integration
"Document the API endpoints"
"Create a getting started guide"
"Update the deployment documentation"
```

## 📋 Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/document bootstrap` | Generate complete documentation | Creates full `/docs` structure |
| `/document expand [concept]` | Document specific concepts | `/document expand user-auth` |
| `/document update [section]` | Refresh existing docs | `/document update api-guide` |
| `/document analyze [integration]` | Document external services | `/document analyze redis` |
| `/document index` | Rebuild navigation | Updates links and TOC |
| `/document search [query]` | Find documentation | `/document search authentication` |

### Natural Language Support

DocuMind recognizes these patterns automatically:

- "Document this component" → `/document expand [component]`
- "Update the setup guide" → `/document update setup-guide`  
- "How do we use MongoDB?" → `/document analyze mongodb`
- "Create API documentation" → `/document expand api`

## 🎯 Supported AI Tools

DocuMind works with all major AI coding assistants:

### GitHub Copilot
- Reads `.github/copilot-instructions.md`
- Slash commands available in chat
- Context-aware suggestions

### Claude (Anthropic)
- Uses `CLAUDE.md` instructions
- Natural language command recognition
- Full documentation workflow support

### Cursor IDE
- Integrates via `.cursor/rules/documind.mdc`
- Also supports `.cursorrules` format
- Smart context detection

### Gemini CLI
- Configured through `GEMINI.md`
- Command pattern recognition
- Structured documentation generation

## 📁 Project Structure

After installation, DocuMind creates:

```
your-project/
├── .documind/                          # Core system (immutable)
│   ├── VERSION                         # Version tracking
│   ├── commands.md                     # Command definitions  
│   ├── system.md                       # System instructions
│   ├── templates/                      # Documentation templates
│   └── scripts/                        # Install/update scripts
│
├── .github/copilot-instructions.md     # GitHub Copilot config
├── CLAUDE.md                           # Claude instructions
├── .cursor/rules/documind.mdc          # Cursor rules
├── .cursorrules                        # Legacy Cursor support
├── GEMINI.md                           # Gemini CLI instructions
│
└── docs/                               # Generated documentation
    ├── README.md                       # Master index
    ├── 01-getting-oriented/            # Project overview
    ├── 02-core-concepts/               # Key concepts
    ├── 03-integrations/                # External services
    └── 04-development/                 # Developer guides
```

## 🎨 Documentation Templates

DocuMind includes professional templates for:

- **Concepts**: Core abstractions and patterns
- **Integrations**: External service documentation  
- **Architecture**: System design and structure
- **Getting Started**: Setup and onboarding guides
- **API Reference**: Complete API documentation

## 🔄 Workflow Example

1. **Install DocuMind** in your project
2. **Commit the configuration** files to git
3. **Team members clone** - commands work immediately
4. **Use natural language** or slash commands
5. **Documentation is generated** in `/docs`
6. **Navigation updates** automatically

```bash
# Developer A installs
npx @documind/core init
git add . && git commit -m "Add DocuMind documentation system"

# Developer B clones and immediately has access
git clone repo && cd repo
# In IDE with AI: "Document the authentication system"
# → Full auth documentation generated automatically
```

## 🧠 How It Works

1. **AI assistants read** the instruction files (CLAUDE.md, .cursorrules, etc.)
2. **Commands are recognized** through natural language or slash syntax  
3. **System instructions guide** the documentation generation process
4. **Templates provide structure** for consistent, professional output
5. **Navigation updates** automatically to maintain coherent structure

## 📦 Distribution Options

### NPX (Recommended)
```bash
npx @documind/core init
```

### GitHub Template
```bash
gh repo create my-app --template documind/template
```

### Manual Installation
```bash
git clone https://github.com/denniswebb/documind.git
cp -r documind/.documind your-project/
cd your-project && node .documind/scripts/install.js
```

## 🔧 Configuration

### Environment Detection
DocuMind automatically detects your AI tools and generates appropriate configuration files:

- Existing `.github/` → GitHub Copilot support
- Existing `.cursor/` → Cursor IDE support  
- Custom detection logic for other tools

### Manual Configuration
You can customize the system by editing:
- Command definitions in `.documind/commands.md`
- System behavior in `.documind/system.md`  
- Templates in `.documind/templates/`

## 🚀 Advanced Usage

### Programmatic Usage
```javascript
const DocuMind = require('@documind/core');

const dm = new DocuMind({ rootDir: './my-project' });

await dm.install();
await dm.update();

const isInstalled = await dm.isInstalled();
const version = await dm.getVersion();
```

### Custom Commands
Add your own documentation patterns by extending the command definitions:

```markdown
### /document custom [target]
Your custom documentation command
- Maps to specific templates
- Follows your conventions
```

## 🔄 Updates

Keep DocuMind current:

```bash
# Auto-update
documind update

# Check version
documind version

# Update from local development
documind update --local /path/to/documind/source
```

## 🎯 Design Principles

1. **IDE Native**: Feels like a natural extension of your development environment
2. **Zero Install**: Works immediately after cloning for all team members
3. **AI Agnostic**: Supports any AI assistant that can read instruction files
4. **Version Controlled**: All configuration is tracked and shareable
5. **Non-Invasive**: Integrates with existing workflows without disruption

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](./docs/04-development/contributing.md) for:

- How to report bugs
- How to suggest features
- Development setup
- Pull request process

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🔗 Links

- **GitHub**: [denniswebb/documind](https://github.com/denniswebb/documind)
- **NPM**: [@documind/core](https://npmjs.com/package/@documind/core)
- **Documentation**: [Full Docs](./docs/README.md)
- **Issues**: [Bug Reports](https://github.com/denniswebb/documind/issues)

---

**Built with ❤️ by [Dennis Webb](https://denniswebb.dev)**

*Making documentation as natural as having a conversation with your AI assistant*