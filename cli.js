#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocuMindCLI {
  constructor() {
    // 80s Vaporwave ANSI colors
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      
      // Vaporwave palette
      neonPink: '\x1b[95m',        // Bright magenta
      neonCyan: '\x1b[96m',        // Bright cyan  
      neonPurple: '\x1b[35m',      // Magenta
      electricBlue: '\x1b[94m',    // Bright blue
      hotPink: '\x1b[91m',         // Bright red
      synthWave: '\x1b[93m',       // Bright yellow
      
      // Standard colors for compatibility
      brightMagenta: '\x1b[95m',
      brightCyan: '\x1b[96m',
      brightBlue: '\x1b[94m',
      brightWhite: '\x1b[97m',
      white: '\x1b[37m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m'
    };

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
    this.showVaporwaveLogo();
    console.log('');

    // More robust path resolution
    let targetDir;
    if (args[0]) {
      targetDir = args[0];
    } else {
      const cwd = process.cwd();
      // Handle case where process.cwd() returns literal "undefined" string
      if (!cwd || cwd === 'undefined' || typeof cwd !== 'string') {
        targetDir = path.resolve('.');
      } else {
        targetDir = cwd;
      }
    }
    
    const fullPath = path.resolve(targetDir);
    
    // Final safety check
    if (!fullPath || fullPath.includes('undefined') || fullPath === 'undefined') {
      throw new Error(`Unable to determine target directory. Resolved path: ${fullPath}`);
    }
    
    console.log(`${this.colors.neonPink}📁 Initializing DocuMind in:${this.colors.reset} ${this.colors.neonCyan}${fullPath}${this.colors.reset}`);
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
      const cwd1 = process.cwd();
      const workingDir1 = (!cwd1 || cwd1 === 'undefined') ? path.resolve('.') : cwd1;
      const { default: DocuMindInstaller } = await import(path.join(workingDir1, '.documind/scripts/install.js'));
      const installer = new DocuMindInstaller();
      await installer.install();

    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      process.exit(1);
    }
  }

  async update(args) {
    const cwd = process.cwd();
    const workingDir = (!cwd || cwd === 'undefined') ? path.resolve('.') : cwd;
    const { default: DocuMindUpdater } = await import(path.join(workingDir, '.documind/scripts/update.js'));
    const updater = new DocuMindUpdater();
    
    if (args[0] === '--local' && args[1]) {
      await updater.updateFromLocal(args[1]);
    } else {
      await updater.update();
    }
  }

  async register(args) {
    console.log(`${this.colors.electricBlue}🔧 Registering DocuMind commands...${this.colors.reset}`);
    console.log('');

    try {
      // Check if DocuMind is initialized
      if (!await this.exists('.documind')) {
        console.error('❌ DocuMind is not initialized in this directory.');
        console.log('   Run `documind init` first.');
        process.exit(1);
      }

      const cwd2 = process.cwd();
      const workingDir2 = (!cwd2 || cwd2 === 'undefined') ? path.resolve('.') : cwd2;
      const { default: CommandGenerator } = await import(path.join(workingDir2, '.documind/scripts/generate-commands.js'));
      const generator = new CommandGenerator();
      
      // Check for specific tool flag
      const tool = args[0];
      if (tool && tool.startsWith('--')) {
        const toolName = tool.substring(2); // Remove '--' prefix
        console.log(`${this.colors.neonPink}📱 Registering commands for: ${this.colors.neonCyan}${toolName}${this.colors.reset}`);
        const success = await generator.generateCommandsForTool(toolName);
        if (success) {
          console.log(`${this.colors.electricBlue}✅ Command registration completed!${this.colors.reset}`);
        } else {
          console.error(`${this.colors.neonPink}❌ Failed to register commands for ${toolName}${this.colors.reset}`);
          process.exit(1);
        }
      } else {
        // Register for all detected tools
        console.log(`${this.colors.neonPink}📱 Detecting AI tools and registering commands...${this.colors.reset}`);
        const tools = await generator.detectAITools();
        console.log(`   ${this.colors.neonCyan}Found: ${this.colors.brightWhite}${tools.join(', ')}${this.colors.reset}`);
        
        for (const tool of tools) {
          await generator.generateCommandsForTool(tool);
        }
        
        console.log(`${this.colors.electricBlue}✅ Command registration completed for all tools!${this.colors.reset}`);
      }
      
      console.log('');
      console.log(`${this.colors.neonCyan}🎯 Commands are now available:${this.colors.reset}`);
      console.log(`   ${this.colors.electricBlue}/document${this.colors.reset} - ${this.colors.brightWhite}Flexible documentation command${this.colors.reset}`);
      console.log(`   ${this.colors.electricBlue}/document bootstrap${this.colors.reset} - ${this.colors.brightWhite}Generate complete docs${this.colors.reset}`);
      console.log(`   ${this.colors.electricBlue}/document expand [concept]${this.colors.reset} - ${this.colors.brightWhite}Document concepts${this.colors.reset}`);
      console.log(`   ${this.colors.electricBlue}/document [free-form request]${this.colors.reset} - ${this.colors.brightWhite}Ask anything!${this.colors.reset}`);

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
      const cwd3 = process.cwd();
      const workingDir3 = (!cwd3 || cwd3 === 'undefined') ? path.resolve('.') : cwd3;
      const workflowsDir = path.join(workingDir3, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });
      console.log('  ✓ Created .github/workflows directory');

      // Read the workflow template
      const templatePath = path.join(workingDir3, '.documind', 'templates', 'github-pages-workflow.yml');
      
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
    const packageJson = JSON.parse(await fs.readFile(path.join(__dirname, 'package.json'), 'utf8'));
    console.log(`${this.colors.neonPink}DocuMind${this.colors.reset} ${this.colors.neonCyan}v${packageJson.version}${this.colors.reset}`);
  }

  showVaporwaveLogo() {
    // Blue borders, "Docu" in magenta, "Mind" in cyan
    const logo = `${this.colors.electricBlue}▐▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}██████████${this.colors.reset}                                ${this.colors.neonCyan}██████   ██████${this.colors.reset}  ${this.colors.neonCyan}███${this.colors.reset}                 ${this.colors.neonCyan}█████${this.colors.reset}  ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}  ${this.colors.neonPink}░░███░░░░███${this.colors.reset}                              ${this.colors.neonCyan}░░██████ ██████${this.colors.reset}  ${this.colors.neonCyan}░░░${this.colors.reset}                 ${this.colors.neonCyan}░░███${this.colors.reset}   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}░███   ░░███${this.colors.reset}  ${this.colors.neonCyan}██████   ██████${this.colors.reset}  ${this.colors.neonCyan}█████ ████${this.colors.reset} ${this.colors.neonCyan}░███░█████░███${this.colors.reset}  ${this.colors.neonCyan}████${this.colors.reset}  ${this.colors.neonCyan}████████${this.colors.reset}    ${this.colors.neonCyan}███████${this.colors.reset}   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}░███    ░███${this.colors.reset} ${this.colors.neonCyan}███░░███ ███░░███${this.colors.reset}${this.colors.neonCyan}░░███ ░███${this.colors.reset}  ${this.colors.neonCyan}░███░░███ ░███${this.colors.reset} ${this.colors.neonCyan}░░███${this.colors.reset} ${this.colors.neonCyan}░░███░░███${this.colors.reset}  ${this.colors.neonCyan}███░░███${this.colors.reset}   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}░███    ░███${this.colors.reset}${this.colors.neonCyan}░███ ░███░███ ░░░${this.colors.reset}  ${this.colors.neonCyan}░███ ░███${this.colors.reset}  ${this.colors.neonCyan}░███ ░░░  ░███${this.colors.reset}  ${this.colors.neonCyan}░███${this.colors.reset}  ${this.colors.neonCyan}░███ ░███${this.colors.reset} ${this.colors.neonCyan}░███ ░███${this.colors.reset}   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}░███    ███${this.colors.reset} ${this.colors.neonCyan}░███ ░███░███  ███${this.colors.reset} ${this.colors.neonCyan}░███ ░███${this.colors.reset}  ${this.colors.neonCyan}░███      ░███${this.colors.reset}  ${this.colors.neonCyan}░███${this.colors.reset}  ${this.colors.neonCyan}░███ ░███${this.colors.reset} ${this.colors.neonCyan}░███ ░███${this.colors.reset}   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}██████████${this.colors.reset}  ${this.colors.neonCyan}░░██████ ░░██████${this.colors.reset}  ${this.colors.neonCyan}░░████████${this.colors.reset} ${this.colors.neonCyan}█████     █████${this.colors.reset} ${this.colors.neonCyan}█████${this.colors.reset} ${this.colors.neonCyan}████ █████${this.colors.reset}${this.colors.neonCyan}░░████████${this.colors.reset}  ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}  ${this.colors.neonPink}░░░░░░░░░░${this.colors.reset}    ${this.colors.neonCyan}░░░░░░   ░░░░░░${this.colors.reset}    ${this.colors.neonCyan}░░░░░░░░${this.colors.reset} ${this.colors.neonCyan}░░░░░     ░░░░░${this.colors.reset} ${this.colors.neonCyan}░░░░░${this.colors.reset} ${this.colors.neonCyan}░░░░ ░░░░░${this.colors.reset}  ${this.colors.neonCyan}░░░░░░░░${this.colors.reset}   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▌${this.colors.reset}

                    ${this.colors.electricBlue}▓▓▓${this.colors.reset} ${this.colors.neonCyan}◆ IDE-Native Documentation System ◆${this.colors.reset} ${this.colors.electricBlue}▓▓▓${this.colors.reset}`;

    console.log(logo);
  }

  async help() {
    this.showVaporwaveLogo();
    console.log(`

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
    // Check if we're in development (has src/) or installed package (has .documind/)
    const developmentSource = path.join(__dirname, 'src');
    const packagedSource = path.join(__dirname, '.documind');
    
    let sourceCore;
    if (await this.exists(developmentSource)) {
      sourceCore = developmentSource; // Development: use src/
      console.log(`  ${this.colors.neonCyan}📦 Using development source from src/${this.colors.reset}`);
    } else if (await this.exists(packagedSource)) {
      sourceCore = packagedSource; // Released package: use .documind/
      console.log(`  ${this.colors.neonCyan}📦 Using packaged source from .documind/${this.colors.reset}`);
    } else {
      throw new Error('No source directory found. Expected either src/ or .documind/');
    }
    
    const cwd4 = process.cwd();
    const workingDir4 = (!cwd4 || cwd4 === 'undefined') ? path.resolve('.') : cwd4;
    const targetCore = path.join(workingDir4, '.documind');
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
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new DocuMindCLI();
  cli.run();
}

export default DocuMindCLI;