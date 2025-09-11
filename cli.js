#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class DocuMindCLI {
  constructor() {
    this.commands = {
      'init': this.init.bind(this),
      'update': this.update.bind(this),
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
  init [directory]     Initialize DocuMind in current or specified directory
  update              Update DocuMind to the latest version
  help                Show this help message
  version             Show version information

EXAMPLES:
  documind init                    # Initialize in current directory
  documind init ./my-project      # Initialize in specific directory
  documind update                 # Update to latest version

AFTER INSTALLATION:
  Use these commands with your AI assistant:
  
  /document bootstrap             # Generate complete documentation
  /document expand [concept]      # Document specific concepts
  /document update [section]      # Update existing sections
  /document analyze [integration] # Document external integrations

NATURAL LANGUAGE:
  "Document the authentication system"
  "Create getting started guide"
  "Update the API documentation"
  "How do we use Redis?"

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