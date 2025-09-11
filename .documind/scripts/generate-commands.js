#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class CommandGenerator {
  constructor() {
    this.repoRoot = process.cwd();
    this.documindDir = path.join(this.repoRoot, '.documind');
  }

  async generateCommandsForTool(tool) {
    const generators = {
      claude: this.generateClaudeCommands.bind(this),
      cursor: this.generateCursorCommands.bind(this),
      copilot: this.generateCopilotCommands.bind(this),
      gemini: this.generateGeminiCommands.bind(this)
    };

    if (generators[tool]) {
      await generators[tool]();
      console.log(`  ✓ Generated ${tool} commands`);
      return true;
    } else {
      console.warn(`  ⚠️  Unknown tool: ${tool}`);
      return false;
    }
  }

  async generateClaudeCommands() {
    // Ensure .claude/commands directory exists
    await this.ensureDir('.claude/commands');
    
    // Read the command template
    const commandContent = await this.readCommandTemplate();
    
    // Write the document.md command file
    await fs.writeFile(
      path.join(this.repoRoot, '.claude', 'commands', 'document.md'),
      commandContent
    );
  }

  async generateCursorCommands() {
    // Cursor uses .cursorrules and .cursor/rules/
    // The documentation commands are already handled in the installation
    // This could be extended in the future if Cursor adds slash command support
    console.log('    ℹ️  Cursor uses .cursorrules for command recognition');
  }

  async generateCopilotCommands() {
    // GitHub Copilot uses .github/copilot-instructions.md
    // Currently doesn't have explicit slash command registration like Claude
    console.log('    ℹ️  GitHub Copilot uses .github/copilot-instructions.md for guidance');
  }

  async generateGeminiCommands() {
    // Gemini CLI uses GEMINI.md for instructions
    // Currently doesn't have explicit slash command registration like Claude
    console.log('    ℹ️  Gemini CLI uses GEMINI.md for command recognition');
  }

  async readCommandTemplate() {
    // Read the current document.md command file as template
    // In practice, this could be a template file in .documind/templates/
    const commandPath = path.join(this.documindDir, 'templates', 'claude-command.md');
    
    try {
      return await fs.readFile(commandPath, 'utf8');
    } catch (error) {
      // Fallback to generating the command content
      return await this.generateClaudeCommandContent();
    }
  }

  async generateClaudeCommandContent() {
    // Generate the command content by combining system instructions
    const systemContent = await this.readDocuMindFile('system.md');
    const commandsContent = await this.readDocuMindFile('commands.md');
    
    return `Intelligent documentation command processor for DocuMind projects.

This command provides flexible documentation management through predefined actions, free-form requests, or interactive assistance.

## Command Usage

The \`/document\` command supports three modes:

### 1. Interactive Mode (No Arguments)
\`\`\`
/document
\`\`\`
- Checks if documentation exists in \`/docs/\`
- If no docs: Offers to bootstrap initial documentation
- If docs exist: Shows available commands and recent documentation

### 2. Predefined Commands
\`\`\`
/document bootstrap                    # Generate complete project documentation
/document expand [concept]             # Create/expand concept documentation
/document update [section]             # Update existing documentation section
/document analyze [integration]        # Document external service integration
/document index                        # Rebuild navigation and cross-references
/document search [query]               # Search existing documentation
\`\`\`

### 3. Free-Form Requests (Recommended!)
\`\`\`
/document [free-form message]
\`\`\`

**Examples:**
- \`/document let's update the docs about the database\`
- \`/document walk me through an API request to /saveStudent\`
- \`/document how do we handle user authentication?\`
- \`/document create a troubleshooting guide for deployment issues\`
- \`/document explain the payment flow with examples\`
- \`/document document the new notification system we just built\`

## Processing Logic

When processing \`/document\` commands, follow this logic:

### Step 1: Parse Arguments
1. **No arguments** → Enter interactive mode
2. **First word matches predefined command** (bootstrap, expand, update, analyze, index, search) → Execute specific command
3. **Anything else** → Treat as free-form request

### Step 2: Interactive Mode (No Arguments)
Check for existing documentation and provide appropriate guidance.

### Step 3: Free-Form Request Processing
1. **Interpret Intent** - Analyze the request to determine user goals
2. **Confirm Action Plan** - Present clear plan before execution
3. **Research if Needed** - Search codebase and existing docs
4. **Execute Action** - Perform documentation updates

### Step 4: Knowledge Base Queries
For help requests, search documentation first, then research codebase if needed.

## DocuMind System Instructions

${systemContent || 'Follow standard DocuMind principles for documentation management.'}

## Available Commands Reference

${commandsContent || 'See .documind/commands.md for detailed command reference.'}

## Smart Help System

The \`/document\` command acts as an intelligent help system that can:
- Answer questions about the codebase
- Research and explain functionality
- Proactively suggest documentation improvements
- Provide guided assistance for complex topics

**Remember**: Every interaction should either provide immediate help or improve the project's documentation for future use.`;
  }

  async readDocuMindFile(filename) {
    try {
      const content = await fs.readFile(path.join(this.documindDir, filename), 'utf8');
      return content;
    } catch (error) {
      console.warn(`Warning: Could not read ${filename}`);
      return null;
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

  // Utility method to detect which AI tools are in use
  async detectAITools() {
    const tools = [];
    
    // Check for existing AI configurations
    if (await this.exists('.github')) tools.push('copilot');
    if (await this.exists('.cursor') || await this.exists('.cursorrules')) tools.push('cursor');
    if (await this.exists('CLAUDE.md')) tools.push('claude');
    
    // Check for Gemini CLI usage
    const packageJson = await this.readPackageJson();
    if (packageJson && packageJson.scripts) {
      const scripts = Object.values(packageJson.scripts).join(' ');
      if (scripts.includes('gemini')) tools.push('gemini');
    }
    
    // Default: install for common tools if none detected
    if (tools.length === 0) {
      tools.push('claude', 'cursor', 'copilot', 'gemini');
    }
    
    return [...new Set(tools)];
  }

  async exists(filePath) {
    try {
      await fs.access(path.join(this.repoRoot, filePath));
      return true;
    } catch {
      return false;
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
}

// CLI interface
if (require.main === module) {
  const generator = new CommandGenerator();
  const args = process.argv.slice(2);
  const tool = args[0];

  if (tool) {
    generator.generateCommandsForTool(tool).catch(error => {
      console.error('Command generation failed:', error);
      process.exit(1);
    });
  } else {
    // Generate for all detected tools
    generator.detectAITools().then(tools => {
      Promise.all(tools.map(tool => generator.generateCommandsForTool(tool)))
        .catch(error => {
          console.error('Command generation failed:', error);
          process.exit(1);
        });
    });
  }
}

module.exports = CommandGenerator;