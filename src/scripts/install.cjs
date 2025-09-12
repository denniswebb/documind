#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class DocuMindInstaller {
  constructor() {
    this.repoRoot = process.cwd();
    this.documindDir = path.join(this.repoRoot, '.documind');
  }

  async install() {
    console.log('🧠 Installing DocuMind...');
    
    try {
      // 1. Detect which AI tools are in use
      const detected = await this.detectAITools();
      console.log(`  📱 Detected AI tools: ${detected.join(', ')}`);
      
      // 2. Generate instruction files for each
      for (const tool of detected) {
        await this.generateInstructionFile(tool);
      }
      
      // 3. Add to .gitignore if needed (but keep DocuMind tracked)
      await this.updateGitignore();
      
      console.log('✅ DocuMind installed successfully!');
      console.log('📝 Try any of these commands with your AI assistant:');
      console.log('   /document bootstrap');
      console.log('   /document expand [concept]');
      console.log('   /document analyze [integration]');
      console.log('   "Document the authentication system"');
      console.log('   "Create getting started guide"');
      
    } catch (error) {
      console.error('❌ Installation failed:', error.message);
      process.exit(1);
    }
  }
  
  async detectAITools() {
    const tools = [];
    
    // Check for existing AI configurations
    if (await this.exists('.github')) tools.push('copilot');
    if (await this.exists('.cursor')) tools.push('cursor');
    if (await this.exists('.cursorrules')) tools.push('cursor');
    
    // Check for common AI-related files
    if (await this.exists('CLAUDE.md')) tools.push('claude');
    
    // Check for Gemini CLI (look for gemini config or usage)
    const packageJson = await this.readPackageJson();
    if (packageJson && packageJson.scripts) {
      const scripts = Object.values(packageJson.scripts).join(' ');
      if (scripts.includes('gemini')) tools.push('gemini');
    }
    
    // Default: install for common tools if none detected
    if (tools.length === 0) {
      tools.push('copilot', 'claude', 'cursor', 'gemini');
      console.log('  ℹ️  No existing AI configurations found, installing for all supported tools');
    }
    
    // Remove duplicates
    return [...new Set(tools)];
  }
  
  async generateInstructionFile(tool) {
    const generators = {
      copilot: this.generateCopilotInstructions.bind(this),
      claude: this.generateClaudeInstructions.bind(this),
      cursor: this.generateCursorInstructions.bind(this),
      gemini: this.generateGeminiInstructions.bind(this)
    };
    
    if (generators[tool]) {
      await generators[tool]();
      console.log(`  ✓ Generated ${tool} instructions`);
    }
  }
  
  async generateCopilotInstructions() {
    await this.ensureDir('.github');
    
    const content = await this.loadTemplate('copilot-instructions');
    await fs.writeFile(
      path.join(this.repoRoot, '.github', 'copilot-instructions.md'), 
      content
    );
    
    // Also create documentation-specific instructions
    await this.ensureDir('.github/instructions');
    const docInstructions = await this.loadTemplate('github-documentation');
    await fs.writeFile(
      path.join(this.repoRoot, '.github', 'instructions', 'documentation.md'),
      docInstructions
    );
  }
  
  async generateClaudeInstructions() {
    const content = await this.loadTemplate('claude-instructions');
    await fs.writeFile(
      path.join(this.repoRoot, 'CLAUDE.md'), 
      content
    );
    
    // Also register the /document command
    await this.registerClaudeCommands();
  }
  
  async registerClaudeCommands() {
    // Use the CommandGenerator to create the actual slash commands
    const CommandGenerator = require('./generate-commands.cjs');
    const generator = new CommandGenerator();
    await generator.generateClaudeCommands();
  }
  
  async generateCursorInstructions() {
    await this.ensureDir('.cursor/rules');
    
    // Generate .cursor/rules/documind.mdc
    const rulesContent = await this.loadTemplate('cursor-rules');
    await fs.writeFile(
      path.join(this.repoRoot, '.cursor', 'rules', 'documind.mdc'),
      rulesContent
    );
    
    // Also generate .cursorrules for older versions
    const cursorRulesContent = await this.loadTemplate('cursorrules');
    await fs.writeFile(
      path.join(this.repoRoot, '.cursorrules'),
      cursorRulesContent
    );
  }
  
  async generateGeminiInstructions() {
    const content = await this.loadTemplate('gemini-instructions');
    await fs.writeFile(
      path.join(this.repoRoot, 'GEMINI.md'),
      content
    );
  }
  
  async loadTemplate(templateName) {
    const templates = {
      'copilot-instructions': `# GitHub Copilot Configuration

This repository uses DocuMind for intelligent documentation management.

## Documentation Commands

DocuMind provides slash commands for documentation tasks:

- \`/document bootstrap\` - Generate complete project documentation
- \`/document expand [concept]\` - Expand documentation for specific concepts  
- \`/document update [section]\` - Update existing documentation sections
- \`/document analyze [integration]\` - Document external service integrations
- \`/document index\` - Regenerate documentation navigation
- \`/document search [query]\` - Find existing documentation

## Natural Language Recognition

Recognize these patterns as documentation requests:
- "Document this feature" → \`/document expand [feature]\`
- "Update the setup guide" → \`/document update setup-guide\`
- "How do we use Redis?" → \`/document analyze redis\`
- "Create API docs" → \`/document expand api\`

## Example Usage

\`\`\`
/document bootstrap
/document expand authentication
/document analyze stripe-payments
\`\`\`

## System Instructions

${await this.readDocuMindFile('system.md')}

## Available Commands

${await this.readDocuMindFile('commands.md')}`,

      'github-documentation': `applyTo: ["docs/**", "README.md", "*.md"]
---

# Documentation Instructions

This file contains special instructions for GitHub Copilot when working with documentation files.

When editing documentation files, follow DocuMind conventions:

${await this.readDocuMindFile('system.md')}`,

      'claude-instructions': `# Claude Instructions

This repository uses **DocuMind** - an intelligent documentation system that enables slash commands for documentation management.

## 📚 Documentation Commands

You have access to documentation commands through natural language or slash notation:

- \`/document bootstrap\` - Generate complete documentation from codebase analysis
- \`/document expand [concept]\` - Expand specific concepts with detailed explanations
- \`/document update [section]\` - Update existing documentation sections  
- \`/document analyze [integration]\` - Analyze and document external integrations
- \`/document index\` - Regenerate documentation index and navigation
- \`/document search [query]\` - Find existing documentation about topics

## 🔍 Command Recognition

Recognize these patterns as documentation commands:

**Direct Commands:**
- \`/document [action] [target]\`
- \`/document bootstrap\`
- \`/document expand authentication\`

**Natural Language:**
- "Can you document the authentication system?" → \`/document expand authentication\`
- "Update the setup guide" → \`/document update setup-guide\`
- "How is Redis used in this project?" → \`/document analyze redis\`
- "Create getting started documentation" → \`/document expand getting-started\`

**Contextual:**
- When in \`/docs\` directory: "This needs better explanation" → \`/document expand [current-topic]\`
- When viewing API code: "Document this endpoint" → \`/document expand [endpoint-name]\`

## 🎯 System Instructions

When any \`/document\` command is used, follow these instructions:

${await this.readDocuMindFile('system.md')}

## 📋 Available Commands Reference

${await this.readDocuMindFile('commands.md')}

---

**Important**: The \`.documind/\` directory contains the core system and should never be modified. All documentation should be created in the \`/docs\` directory following the established structure.`,

      'cursor-rules': `# DocuMind Documentation System

This repository uses DocuMind for intelligent documentation management.

## Documentation Commands

The following commands are available for documentation tasks:

- \`/document bootstrap\` - Generate complete project documentation
- \`/document expand [concept]\` - Expand documentation for specific concepts
- \`/document update [section]\` - Update existing documentation sections  
- \`/document analyze [integration]\` - Document external service integrations
- \`/document index\` - Regenerate documentation navigation
- \`/document search [query]\` - Find existing documentation

## Natural Language Support

Recognize these patterns as documentation requests:
- "Document this component" → \`/document expand [component]\`
- "Update the README" → \`/document update readme\`
- "How do we integrate with Stripe?" → \`/document analyze stripe\`
- "Create setup instructions" → \`/document expand setup\`

## System Instructions

${await this.readDocuMindFile('system.md')}

## Command Reference  

${await this.readDocuMindFile('commands.md')}`,

      'cursorrules': `# DocuMind System - Cursor Rules

This repository uses DocuMind for documentation management.

## Documentation Commands

Available slash commands:
- /document bootstrap - Generate complete documentation
- /document expand [concept] - Expand specific documentation  
- /document update [section] - Update existing sections
- /document analyze [integration] - Document integrations
- /document index - Regenerate navigation
- /document search [query] - Find documentation

## Natural Language Recognition

Treat these as documentation commands:
- "Document this [feature]" → /document expand [feature]
- "Update the [guide]" → /document update [guide]  
- "How do we use [service]?" → /document analyze [service]
- "Create docs for [component]" → /document expand [component]

## Rules

${await this.readDocuMindFile('system.md')}`,

      'gemini-instructions': `# Gemini CLI Instructions

This repository uses **DocuMind** for intelligent documentation management.

## Documentation Commands

DocuMind provides slash commands that you can recognize and execute:

- \`/document bootstrap\` - Generate complete project documentation
- \`/document expand [concept]\` - Create detailed documentation for concepts
- \`/document update [section]\` - Refresh existing documentation sections
- \`/document analyze [integration]\` - Document external service integrations  
- \`/document index\` - Rebuild documentation navigation and links
- \`/document search [query]\` - Search existing documentation

## Natural Language Recognition

When users request documentation tasks, recognize these patterns:

- "Document this feature" → \`/document expand [feature]\`
- "Update the installation guide" → \`/document update installation\`  
- "How do we use MongoDB?" → \`/document analyze mongodb\`
- "Create API documentation" → \`/document expand api\`
- "Generate project docs" → \`/document bootstrap\`

## System Instructions

Follow these instructions when executing documentation commands:

${await this.readDocuMindFile('system.md')}

## Command Reference

${await this.readDocuMindFile('commands.md')}

---

**Note**: Never modify files in the \`.documind/\` directory. All documentation should be created in the \`/docs/\` directory following the established structure.`
    };
    
    return templates[templateName] || '';
  }
  
  async readDocuMindFile(filename) {
    try {
      const content = await fs.readFile(path.join(this.documindDir, filename), 'utf8');
      return content;
    } catch (error) {
      console.warn(`Warning: Could not read ${filename}`);
      return `[${filename} not found]`;
    }
  }
  
  
  async updateGitignore() {
    const gitignorePath = path.join(this.repoRoot, '.gitignore');
    let gitignoreContent = '';
    
    if (await this.exists('.gitignore')) {
      gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    }
    
    // We want to track .documind directory, but add a comment explaining it
    const documindComment = '# DocuMind core system (keep tracked)';
    const needsComment = !gitignoreContent.includes('DocuMind') && 
                        !gitignoreContent.includes('.documind');
    
    if (needsComment) {
      gitignoreContent += `\n${documindComment}\n# .documind/\n`;
      await fs.writeFile(gitignorePath, gitignoreContent);
      console.log('  ✓ Updated .gitignore with DocuMind comment');
    }
  }
  
  async readPackageJson() {
    try {
      const content = await fs.readFile(path.join(this.repoRoot, 'package.json'), 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }
  
  async exists(filePath) {
    try {
      await fs.access(path.join(this.repoRoot, filePath));
      return true;
    } catch {
      return false;
    }
  }
  
  async ensureDir(dirPath) {
    try {
      await fs.mkdir(path.join(this.repoRoot, dirPath), { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const installer = new DocuMindInstaller();
  installer.install().catch(error => {
    console.error('Installation failed:', error);
    process.exit(1);
  });
}

module.exports = DocuMindInstaller;