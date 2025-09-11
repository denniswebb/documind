#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class DocuMindCLI {
  constructor() {
    this.commands = {
      'init': this.init.bind(this),
      'update': this.update.bind(this),
      'register': this.register.bind(this),
      'install-publish-workflow': this.installPublishWorkflow.bind(this),
      'help': this.help.bind(this),
      'version': this.version.bind(this),
      '--version': this.version.bind(this),
      '-v': this.version.bind(this),
      '--help': this.help.bind(this),
      '-h': this.help.bind(this)
    };
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    if (this.commands[command]) {
      try {
        await this.commands[command](args.slice(1));
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
      }
    } else {
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run `documind help` for available commands.');
      process.exit(1);
    }
  }

  async init(args) {
    console.log('🧠 DocuMind - IDE-Native Documentation System');
    console.log('');

    const targetDir = args[0] || process.cwd();
    const fullPath = path.resolve(targetDir);
    
    console.log(`📁 Initializing DocuMind in: ${fullPath}`);
    console.log('');

    try {
      // Change to target directory
      process.chdir(fullPath);
      
      // Check if already initialized
      if (await this.exists('.documind')) {
        console.log('⚠️  DocuMind is already initialized in this directory.');
        console.log('   Run `documind update` to update to the latest version.');
        return;
      }

      // Copy .documind directory from package
      await this.copyDocuMindCore();
      
      // Run the installation script
      const DocuMindInstaller = require(path.join(__dirname, '.documind/scripts/install.js'));
      const installer = new DocuMindInstaller();
      await installer.install();

    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      process.exit(1);
    }
  }

  async update(args) {
    const DocuMindUpdater = require(path.join(process.cwd(), '.documind/scripts/update.js'));
    const updater = new DocuMindUpdater();
    
    if (args[0] === '--local' && args[1]) {
      await updater.updateFromLocal(args[1]);
    } else {
      await updater.update();
    }
  }

  async register(args) {
    console.log('🔧 Registering DocuMind commands...');
    console.log('');

    try {
      // Check if DocuMind is initialized
      if (!await this.exists('.documind')) {
        console.error('❌ DocuMind is not initialized in this directory.');
        console.log('   Run `documind init` first.');
        process.exit(1);
      }

      const CommandGenerator = require(path.join(process.cwd(), '.documind/scripts/generate-commands.js'));
      const generator = new CommandGenerator();
      
      // Check for specific tool flag
      const tool = args[0];
      if (tool && tool.startsWith('--')) {
        const toolName = tool.substring(2); // Remove '--' prefix
        console.log(`📱 Registering commands for: ${toolName}`);
        const success = await generator.generateCommandsForTool(toolName);
        if (success) {
          console.log('✅ Command registration completed!');
        } else {
          console.error(`❌ Failed to register commands for ${toolName}`);
          process.exit(1);
        }
      } else {
        // Register for all detected tools
        console.log('📱 Detecting AI tools and registering commands...');
        const tools = await generator.detectAITools();
        console.log(`   Found: ${tools.join(', ')}`);
        
        for (const tool of tools) {
          await generator.generateCommandsForTool(tool);
        }
        
        console.log('✅ Command registration completed for all tools!');
      }
      
      console.log('');
      console.log('🎯 Commands are now available:');
      console.log('   /document - Flexible documentation command');
      console.log('   /document bootstrap - Generate complete docs');
      console.log('   /document expand [concept] - Document concepts');
      console.log('   /document [free-form request] - Ask anything!');

    } catch (error) {
      console.error('❌ Command registration failed:', error.message);
      process.exit(1);
    }
  }

  async installPublishWorkflow(args) {
    console.log('🚀 Installing GitHub Pages publishing workflow...');
    console.log('');

    try {
      // Check if DocuMind is initialized
      if (!await this.exists('.documind')) {
        console.error('❌ DocuMind is not initialized in this directory.');
        console.log('   Run `documind init` first.');
        process.exit(1);
      }

      // Check if this is a git repository
      if (!await this.exists('.git')) {
        console.error('❌ This directory is not a git repository.');
        console.log('   Initialize git first with `git init`.');
        process.exit(1);
      }

      // Create .github/workflows directory
      const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });
      console.log('  ✓ Created .github/workflows directory');

      // Read the workflow template
      const templatePath = path.join(process.cwd(), '.documind', 'templates', 'github-pages-workflow.yml');
      
      if (!await this.exists(templatePath)) {
        console.error('❌ GitHub Pages workflow template not found.');
        console.log('   Please update DocuMind to the latest version.');
        process.exit(1);
      }

      const template = await fs.readFile(templatePath, 'utf8');
      
      // Write the workflow file
      const workflowPath = path.join(workflowsDir, 'publish-docs.yml');
      await fs.writeFile(workflowPath, template);
      console.log('  ✓ Created publish-docs.yml workflow');

      console.log('');
      console.log('✅ GitHub Pages workflow installed successfully!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('   1. Commit and push the workflow file to your repository');
      console.log('   2. Go to your GitHub repository settings');
      console.log('   3. Navigate to Pages settings');
      console.log('   4. Set source to "GitHub Actions"');
      console.log('   5. Push changes to trigger the workflow');
      console.log('');
      console.log('🌐 Your docs will be available at:');
      console.log('   https://[username].github.io/[repository-name]');

    } catch (error) {
      console.error('❌ Workflow installation failed:', error.message);
      process.exit(1);
    }
  }

  async version() {
    const packageJson = require('./package.json');
    console.log(`DocuMind v${packageJson.version}`);
  }

  async help() {
    console.log(`
🧠 DocuMind - IDE-Native Documentation System

USAGE:
  documind <command> [options]

COMMANDS:
  init [directory]           Initialize DocuMind in current or specified directory
  register [--tool]          Register slash commands for AI tools (auto-detects by default)
  install-publish-workflow   Install GitHub Pages publishing workflow
  update                     Update DocuMind to the latest version
  help                       Show this help message
  version                    Show version information

EXAMPLES:
  documind init                        # Initialize in current directory
  documind init ./my-project          # Initialize in specific directory
  documind register                   # Register commands for all detected AI tools
  documind register --claude          # Register commands only for Claude Code
  documind install-publish-workflow   # Install GitHub Pages workflow
  documind update                     # Update to latest version

AFTER INSTALLATION:
  Use these commands with your AI assistant:
  
  /document                       # Interactive mode (shows available commands)
  /document bootstrap             # Generate complete documentation
  /document expand [concept]      # Document specific concepts
  /document update [section]      # Update existing sections
  /document analyze [integration] # Document external integrations
  /document [free-form request]   # Ask anything! (Recommended)

NATURAL LANGUAGE EXAMPLES:
  "Document the authentication system"
  "Create getting started guide"
  "Update the API documentation"
  "How do we use Redis?"
  "Walk me through an API request to /saveStudent"
  "Let's update the docs about the database"

SUPPORTED AI TOOLS:
  • GitHub Copilot
  • Claude (Anthropic)
  • Cursor IDE
  • Gemini CLI

For more information, visit:
https://github.com/denniswebb/documind
`);
  }

  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async copyDocuMindCore() {
    const sourceCore = path.join(__dirname, '.documind');
    const targetCore = path.join(process.cwd(), '.documind');
    
    await this.copyDirectory(sourceCore, targetCore);
    console.log('  ✓ DocuMind core system installed');
  }

  async copyDirectory(source, dest) {
    await fs.mkdir(dest, { recursive: true });
    
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }
}

// Run CLI
if (require.main === module) {
  const cli = new DocuMindCLI();
  cli.run();
}

module.exports = DocuMindCLI;