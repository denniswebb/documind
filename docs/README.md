# DocuMind - Living Documentation System

> **📘 Living Document Notice**: This documentation is generated and maintained by AI. 
> Team members can expand, update, or add sections by asking the AI to analyze 
> specific areas in more detail. Last updated: 2025-09-11

## Quick Start
- **What this project does**: IDE-native documentation system with AI-powered slash commands
- **How to run it**: `npm install -g @documind/core && documind init`
- **Architecture at a glance**: [System Architecture](01-getting-oriented/03-architecture.md)

## 🌐 Enhanced Reading Experience
For the best reading experience, serve this documentation locally:
```bash
cd docs && npx serve .
# Then visit: http://localhost:3000
```

## Documentation Structure

### 📖 Part I: Getting Oriented
- [Introduction](01-getting-oriented/01-introduction.md) - Project overview and mental model
- [Tech Stack](01-getting-oriented/02-tech-stack.md) - Languages, frameworks, and tools
- [System Architecture](01-getting-oriented/03-architecture.md) - High-level system design
- [File System Guide](01-getting-oriented/04-file-system.md) - Directory structure and navigation

### 🔧 Part II: Core Concepts  
- [Overview](02-core-concepts/README.md) - Core system abstractions
- [CLI System](02-core-concepts/01-cli-system.md) - Command-line interface architecture
- [Installer Engine](02-core-concepts/02-installer-engine.md) - Installation and setup system
- [Template System](02-core-concepts/03-template-system.md) - Documentation template management
- [AI Integration](02-core-concepts/04-ai-integration.md) - Multi-AI support architecture
- [Command Processing](02-core-concepts/05-command-processing.md) - Slash command parsing and execution

### 🌐 Part III: External Integrations
- [Services Overview](03-integrations/README.md)
- [NPM Ecosystem](03-integrations/01-npm-ecosystem.md) - Package distribution and management
- [GitHub Integration](03-integrations/02-github-integration.md) - Version control and templates
- [AI Assistant APIs](03-integrations/03-ai-assistant-apis.md) - Multiple AI platform support

### 🛠️ Part IV: Development Guide
- [Development Setup](04-development/01-setup.md)
- [Common Patterns](04-development/02-patterns.md)
- [Testing Strategy](04-development/03-testing.md)
- [Deployment Guide](04-development/04-deployment.md)

### 📚 Appendices
- [Glossary](99-appendices/glossary.md)
- [Troubleshooting](99-appendices/troubleshooting.md)
- [Change Log](99-appendices/changelog.md)

## How to Expand This Documentation

**For specific concepts:**
```bash
/document expand concept "authentication system"
/document expand concept "data processing pipeline"
```

**For external integrations:**
```bash
/document analyze integration "stripe payments"
/document analyze integration "redis caching"
```

**For updating existing sections:**
```bash
/document update section "tech-stack"
/document update section "architecture"
```

**For file-specific analysis:**
```bash
/document deep-dive #file:cli.js
/document deep-dive #file:.documind/scripts/install.js
```

**For comprehensive updates:**
```bash
/document update architecture    # Refresh system architecture docs
/document update tech-stack      # Update technology inventory
/document bootstrap             # Complete regeneration (destructive!)
```

## Natural Language Commands

You can also use natural language with your AI assistant:
- "Document the authentication system"
- "Create getting started guide" 
- "Update the API documentation"
- "How do we use Redis?"
- "Explain the database layer"

## Documentation Standards

This documentation follows these principles:
- **Living**: Updates automatically as code evolves
- **Beginner-friendly**: Assumes readers are new to this codebase
- **Practical**: Focuses on information developers actually need
- **Book-like**: Organized for sequential reading with cross-references
- **AI-optimized**: Structured for effective AI maintenance

## Getting Help

- **Documentation Issues**: Use `/document update [section]` to refresh outdated info
- **Missing Concepts**: Use `/document expand concept "[name]"` to add detail
- **New Integrations**: Use `/document analyze integration "[service]"` for external services
- **Questions**: Ask your AI assistant directly - it knows this documentation structure

---

*This documentation system is powered by [DocuMind](https://github.com/denniswebb/documind) - making documentation as natural as having a conversation with your AI assistant.*