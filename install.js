#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

class DocuMindCLI {
  constructor() {
    // 80s Vaporwave ANSI colors (preserved from original CLI)
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

  parseInitArgs(args) {
    let targetDir = '.';
    const sourceOptions = {};
    let debug = false;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--local' && args[i + 1]) {
        sourceOptions.type = 'local';
        sourceOptions.path = args[i + 1];
        i++; // Skip the next argument as it's the path
      } else if (arg === '--git' && args[i + 1]) {
        sourceOptions.type = 'git';
        sourceOptions.ref = args[i + 1];
        i++; // Skip the next argument as it's the ref
      } else if (arg === '--release' && args[i + 1]) {
        sourceOptions.type = 'release';
        sourceOptions.version = args[i + 1];
        i++; // Skip the next argument as it's the version
      } else if (arg === '--debug' || arg === '--verbose') {
        debug = true;
      } else if (!arg.startsWith('--')) {
        // This is the target directory
        targetDir = arg;
      }
    }
    
    return { targetDir, sourceOptions, debug };
  }

  initInstaller(targetDir, sourceOptions, debug) {
    this.targetDir = path.resolve(targetDir);
    this.documindDir = path.join(this.targetDir, '.documind');
    this.sourceOptions = sourceOptions;
    this.debug = debug;
    this.srcDir = null; // Set by resolveSource()
    
    if (this.debug) {
      console.log('🐛 DEBUG: Installer initialized');
      console.log('  targetDir:', this.targetDir);
      console.log('  documindDir:', this.documindDir);
      console.log('  sourceOptions:', this.sourceOptions);
    }
  }

  showVaporwaveLogo() {
    // Blue borders, "Docu" in magenta, "Mind" in cyan (preserved from original CLI)
    const logo = `${this.colors.electricBlue}▐▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}██████████                                ${this.colors.neonCyan}██████   ██████  ███                 █████  ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}  ${this.colors.neonPink}░░███░░░░███                              ${this.colors.neonCyan}░░██████ ██████  ░░░                 ░░███   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}░███   ░░███  ██████   ██████  █████ ████ ${this.colors.neonCyan}░███░█████░███  ████  ████████    ███████   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}░███    ░███ ███░░███ ███░░███░░███ ░███  ${this.colors.neonCyan}░███░░███ ░███ ░░███ ░░███░░███  ███░░███   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}░███    ░███░███ ░███░███ ░░░  ░███ ░███  ${this.colors.neonCyan}░███ ░░░  ░███  ░███  ░███ ░███ ░███ ░███   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}░███    ███ ░███ ░███░███  ███ ░███ ░███  ${this.colors.neonCyan}░███      ░███  ░███  ░███ ░███ ░███ ░███   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}   ${this.colors.neonPink}██████████  ░░██████ ░░██████  ░░████████ ${this.colors.neonCyan}█████     █████ █████ ████ █████░░████████  ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐${this.colors.reset}  ${this.colors.neonPink}░░░░░░░░░░    ░░░░░░   ░░░░░░    ░░░░░░░░ ${this.colors.neonCyan}░░░░░     ░░░░░ ░░░░░ ░░░░ ░░░░░  ░░░░░░░░   ${this.colors.electricBlue}▌${this.colors.reset}
${this.colors.electricBlue}▐▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▌${this.colors.reset}`;

    console.log(logo);
  }

  async init(args) {
    this.showVaporwaveLogo();
    console.log('');

    // Parse arguments
    const { targetDir, sourceOptions, debug } = this.parseInitArgs(args);
    this.initInstaller(targetDir, sourceOptions, debug);
    
    console.log(`${this.colors.neonPink}📁 Initializing DocuMind in:${this.colors.reset} ${this.colors.neonCyan}${this.targetDir}${this.colors.reset}`);
    console.log('');

    try {
      // Check if already initialized
      if (await this.exists(this.documindDir)) {
        console.log('⚠️  DocuMind is already initialized in this directory.');
        console.log('   Run `documind update` to update to the latest version.');
        return;
      }

      await this.performInstallation();

    } catch (error) {
      console.error('❌ Installation failed:', error.message);
      if (this.debug) {
        console.error('Stack trace:', error.stack);
      }
      process.exit(1);
    }
  }

  async update(args) {
    this.showVaporwaveLogo();
    console.log('');

    // Parse arguments (same as init for source options)
    const { targetDir, sourceOptions, debug } = this.parseInitArgs(args);
    this.initInstaller(targetDir, sourceOptions, debug);
    
    console.log(`${this.colors.neonPink}🔄 Updating DocuMind in:${this.colors.reset} ${this.colors.neonCyan}${this.targetDir}${this.colors.reset}`);
    console.log('');

    try {
      if (!await this.exists(this.documindDir)) {
        console.log('❌ DocuMind is not installed in this directory.');
        console.log('   Run `documind init` to install DocuMind first.');
        return;
      }

      await this.performUpdate();

    } catch (error) {
      console.error('❌ Update failed:', error.message);
      if (this.debug) {
        console.error('Stack trace:', error.stack);
      }
      process.exit(1);
    }
  }

  async performInstallation() {
    // Resolve source
    this.srcDir = await this.resolveSource();
    
    // Copy DocuMind core
    await this.copyDocuMindCore();
    
    // Generate AI configurations
    await this.generateAIConfigs();
    
    // Update .gitignore
    await this.updateGitignore();
    
    console.log('');
    console.log(`${this.colors.electricBlue}✅ DocuMind installation completed!${this.colors.reset}`);
    console.log(`${this.colors.neonCyan}🎯 Next steps:${this.colors.reset}`);
    console.log(`   ${this.colors.electricBlue}1.${this.colors.reset} Run commands with your AI assistant`);
    console.log(`   ${this.colors.electricBlue}2.${this.colors.reset} Try: ${this.colors.neonCyan}/document bootstrap${this.colors.reset}`);
    console.log(`   ${this.colors.electricBlue}3.${this.colors.reset} Or: ${this.colors.neonCyan}/document [your request]${this.colors.reset}`);
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

      // Initialize installer in current directory to use AI generation methods
      this.initInstaller('.', {}, false);
      this.srcDir = path.join(this.targetDir, '.documind');

      // Check for specific tool flag
      const tool = args[0];
      if (tool && tool.startsWith('--')) {
        const toolName = tool.substring(2); // Remove '--' prefix
        console.log(`${this.colors.neonPink}📱 Registering commands for: ${this.colors.neonCyan}${toolName}${this.colors.reset}`);
        const success = await this.generateCommandsForTool(toolName);
        if (success) {
          console.log(`${this.colors.electricBlue}✅ Command registration completed!${this.colors.reset}`);
        } else {
          console.error(`${this.colors.neonPink}❌ Failed to register commands for ${toolName}${this.colors.reset}`);
          process.exit(1);
        }
      } else {
        // Register for all detected tools
        console.log(`${this.colors.neonPink}📱 Detecting AI tools and regenerating commands...${this.colors.reset}`);
        await this.generateAIConfigs();
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

  async generateCommandsForTool(tool) {
    const generators = {
      claude: this.generateClaudeConfig.bind(this),
      cursor: this.generateCursorConfig.bind(this),
      copilot: this.generateCopilotConfig.bind(this),
      gemini: this.generateGeminiConfig.bind(this)
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
      const workflowsDir = path.join('.', '.github', 'workflows');
      await this.ensureDir(workflowsDir);
      console.log('  ✓ Created .github/workflows directory');

      // Read the workflow template
      const templatePath = path.join('.', '.documind', 'templates', 'github-pages-workflow.yml');
      
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
    try {
      const packageJsonPath = path.resolve(path.dirname(__filename), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      console.log(`${this.colors.neonPink}DocuMind${this.colors.reset} ${this.colors.neonCyan}v${packageJson.version}${this.colors.reset}`);
    } catch (error) {
      console.log(`${this.colors.neonPink}DocuMind${this.colors.reset} ${this.colors.neonCyan}v1.0.0${this.colors.reset}`);
    }
  }

  async help() {
    this.showVaporwaveLogo();
    console.log(`

USAGE:
  documind <command> [options]

COMMANDS:
  init [directory]           Initialize DocuMind in current or specified directory
  update                     Update DocuMind to the latest version
  register [--tool]          Register slash commands for AI tools (auto-detects by default)
  install-publish-workflow   Install GitHub Pages publishing workflow
  help                       Show this help message
  version                    Show version information

EXAMPLES:
  documind init                        # Initialize in current directory
  documind init ./my-project          # Initialize in specific directory
  documind init --local ~/src .       # Initialize with local source
  documind update                     # Update to latest version
  documind register                   # Register commands for all detected AI tools
  documind register --claude          # Register commands only for Claude Code
  documind install-publish-workflow   # Install GitHub Pages workflow

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

  async performUpdate() {
    // Resolve source first
    this.srcDir = await this.resolveSource();
    
    // Show current version
    await this.showVersionInfo();
    
    // Update core system and templates only
    console.log(`  ${this.colors.neonCyan}🔄 Updating core system...${this.colors.reset}`);
    await this.copyDocuMindCore();
    console.log('  ✓ Core system updated');
    
    // Update AI tool commands (these should always be latest)
    console.log(`  ${this.colors.neonCyan}🔄 Updating AI tool commands...${this.colors.reset}`);
    await this.updateAICommands();
    console.log('  ✓ AI tool commands updated');
    
    // Note: We don't regenerate AI configs on update to preserve user customizations
    console.log(`  ${this.colors.neonCyan}ℹ️  AI configurations preserved${this.colors.reset}`);
  }

  async updateAICommands() {
    // Always overwrite AI tool commands during updates to get latest functionality
    
    // Update Claude commands
    if (await this.exists(path.join(this.targetDir, '.claude'))) {
      await this.ensureDir(path.join(this.targetDir, '.claude', 'commands'));
      const commandTemplate = await this.generateClaudeCommandContent();
      await fs.writeFile(
        path.join(this.targetDir, '.claude', 'commands', 'document.md'),
        commandTemplate
      );
      
      if (this.debug) {
        console.log('🐛 DEBUG: Updated Claude commands');
      }
    }
    
    // Update Copilot prompts
    if (await this.exists(path.join(this.targetDir, '.github'))) {
      await this.ensureDir(path.join(this.targetDir, '.github', 'prompts'));
      const promptTemplate = await fs.readFile(
        path.join(this.srcDir, 'templates', 'ai-configs', 'copilot-prompt.md'), 
        'utf8'
      );
      await fs.writeFile(
        path.join(this.targetDir, '.github', 'prompts', 'document.prompt.md'),
        promptTemplate
      );
      
      if (this.debug) {
        console.log('🐛 DEBUG: Updated Copilot prompts');
      }
    }
  }

  async showVersionInfo() {
    try {
      const currentVersion = await fs.readFile(
        path.join(this.documindDir, 'core', 'VERSION'), 
        'utf8'
      );
      const newVersion = await fs.readFile(
        path.join(this.srcDir, 'core', 'VERSION'), 
        'utf8'
      );
      
      console.log(`  ${this.colors.neonCyan}📦 Current version:${this.colors.reset} ${currentVersion.trim()}`);
      console.log(`  ${this.colors.neonCyan}📦 New version:${this.colors.reset} ${newVersion.trim()}`);
      console.log('');
    } catch (error) {
      if (this.debug) {
        console.log('🐛 DEBUG: Could not read version info:', error.message);
      }
    }
  }

  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async resolveSource() {
    const { type, path: sourcePath, version, ref } = this.sourceOptions;
    
    if (this.debug) {
      console.log('🐛 DEBUG: resolveSource()');
      console.log('  sourceOptions:', this.sourceOptions);
      console.log('  type:', type);
    }
    
    switch (type) {
      case 'local':
        return this.resolveLocalSource(sourcePath);
      case 'git':
        return this.resolveGitSource(ref || 'main');
      case 'release':
        return this.resolveReleaseSource(version || 'latest');
      default:
        // Default: try local (development), then fallback to latest release
        return this.resolveDefaultSource();
    }
  }
  
  async resolveLocalSource(localPath) {
    if (!localPath) {
      throw new Error('Local source path is required when using --local');
    }
    
    const resolvedPath = path.resolve(localPath);
    console.log(`  📦 Using local source: ${resolvedPath}`);
    
    if (this.debug) {
      console.log('🐛 DEBUG: resolveLocalSource()');
      console.log('  localPath:', localPath);
      console.log('  resolvedPath:', resolvedPath);
    }
    
    // Verify the directory structure
    await this.validateSourceStructure(resolvedPath);
    return resolvedPath;
  }
  
  async resolveGitSource(ref) {
    console.log(`  🌐 Downloading from Git ref: ${ref}`);
    // TODO: Implement git source downloading
    throw new Error('Git source not yet implemented');
  }
  
  async resolveReleaseSource(version) {
    console.log(`  📦 Downloading release: ${version}`);
    // TODO: Implement GitHub releases downloading
    throw new Error('Release source not yet implemented');
  }
  
  async resolveDefaultSource() {
    // Try to detect if we're in development mode
    const scriptDir = path.dirname(__filename);
    const developmentSrc = path.resolve(scriptDir, 'src');
    
    if (this.debug) {
      console.log('🐛 DEBUG: resolveDefaultSource()');
      console.log('  __filename:', __filename);
      console.log('  scriptDir:', scriptDir);
      console.log('  developmentSrc:', developmentSrc);
    }
    
    try {
      await this.validateSourceStructure(developmentSrc);
      console.log(`  📦 Using development source: ${developmentSrc}`);
      return developmentSrc;
    } catch {
      // Fall back to downloading latest release
      console.log(`  📦 Development source not found, downloading latest release`);
      return this.resolveReleaseSource('latest');
    }
  }
  
  async validateSourceStructure(srcPath) {
    const expectedCore = path.join(srcPath, 'core');
    const expectedTemplates = path.join(srcPath, 'templates');
    
    try {
      await fs.access(expectedCore);
      await fs.access(expectedTemplates);
    } catch (error) {
      throw new Error(`Invalid source directory: ${srcPath}. Missing core/ or templates/ directories.`);
    }
  }

  async copyDocuMindCore() {
    // Copy only essential directories from src/ to target's .documind/
    if (this.debug) {
      console.log('🐛 DEBUG: copyDocuMindCore()');
      console.log('  srcDir:', this.srcDir);
      console.log('  documindDir:', this.documindDir);
    }
    
    console.log(`  ${this.colors.neonCyan}📦 Installing DocuMind core system...${this.colors.reset}`);
    
    // Copy core system files
    await this.copyDirectory(
      path.join(this.srcDir, 'core'), 
      path.join(this.documindDir, 'core')
    );
    
    // Copy templates
    await this.copyDirectory(
      path.join(this.srcDir, 'templates'), 
      path.join(this.documindDir, 'templates')
    );
    
    if (this.debug) {
      console.log('🐛 DEBUG: Copied core/ and templates/ only');
    }
    
    console.log('  ✓ DocuMind core system installed');
  }

  async copyDirectory(src, dest) {
    if (this.debug) {
      console.log('🐛 DEBUG: copyDirectory()');
      console.log('  src:', src);
      console.log('  dest:', dest);
    }
    
    // Debug: log paths only if they show the actual nested directory bug
    if (dest.includes('.documind/templates') && dest.split('.documind').length > 2) {
      console.log('🚨 ERROR: Nested .documind directory detected!');
      console.log('  src:', src);
      console.log('  dest:', dest);
      console.trace('Stack trace:');
    }
    
    await this.ensureDir(path.dirname(dest));
    
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (this.debug) {
        console.log('🐛 DEBUG:   copying:', entry.name, entry.isDirectory() ? '(directory)' : '(file)');
        console.log('🐛 DEBUG:     from:', srcPath);
        console.log('🐛 DEBUG:     to:', destPath);
      }
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await this.ensureDir(path.dirname(destPath));
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async generateAIConfigs() {
    console.log(`  ${this.colors.neonCyan}🤖 Generating AI configurations...${this.colors.reset}`);
    
    const tools = await this.detectAITools();
    
    if (this.debug) {
      console.log('🐛 DEBUG: generateAIConfigs()');
      console.log('  detected tools:', tools);
    }
    
    for (const tool of tools) {
      switch (tool) {
        case 'claude':
          await this.generateClaudeConfig();
          break;
        case 'copilot':
          await this.generateCopilotConfig();
          break;
        case 'cursor':
          await this.generateCursorConfig();
          break;
        case 'gemini':
          await this.generateGeminiConfig();
          break;
        default:
          console.warn(`  ⚠️  Unknown tool: ${tool}`);
      }
    }
    
    console.log('  ✓ AI configurations generated');
  }

  async generateClaudeConfig() {
    const claudePath = path.join(this.targetDir, 'CLAUDE.md');
    const template = await fs.readFile(
      path.join(this.srcDir, 'templates', 'ai-configs', 'claude.md'), 
      'utf8'
    );
    
    // Handle existing CLAUDE.md
    if (await this.exists(claudePath)) {
      await this.handleExistingAIConfig('CLAUDE.md', claudePath, template);
    } else {
      await fs.writeFile(claudePath, template);
      if (this.debug) {
        console.log('🐛 DEBUG: Created new CLAUDE.md');
      }
    }
    
    // Generate .claude/commands/document.md directly
    await this.ensureDir(path.join(this.targetDir, '.claude', 'commands'));
    const commandTemplate = await this.generateClaudeCommandContent();
    await fs.writeFile(
      path.join(this.targetDir, '.claude', 'commands', 'document.md'),
      commandTemplate
    );
    
    if (this.debug) {
      console.log('🐛 DEBUG: Generated Claude configuration');
    }
  }

  async generateCopilotConfig() {
    const copilotPath = path.join(this.targetDir, '.github', 'copilot-instructions.md');
    const template = await fs.readFile(
      path.join(this.srcDir, 'templates', 'ai-configs', 'copilot-instructions.md'), 
      'utf8'
    );
    
    await this.ensureDir(path.join(this.targetDir, '.github'));
    await this.ensureDir(path.join(this.targetDir, '.github', 'prompts'));
    
    // Handle existing copilot-instructions.md
    if (await this.exists(copilotPath)) {
      await this.handleExistingAIConfig('copilot-instructions.md', copilotPath, template);
    } else {
      await fs.writeFile(copilotPath, template);
      if (this.debug) {
        console.log('🐛 DEBUG: Created new copilot-instructions.md');
      }
    }
    
    // Generate Copilot prompt for /document command
    const promptTemplate = await fs.readFile(
      path.join(this.srcDir, 'templates', 'ai-configs', 'copilot-prompt.md'), 
      'utf8'
    );
    
    await fs.writeFile(
      path.join(this.targetDir, '.github', 'prompts', 'document.prompt.md'),
      promptTemplate
    );
    
    if (this.debug) {
      console.log('🐛 DEBUG: Generated Copilot configuration and prompt');
    }
  }

  async generateCursorConfig() {
    const cursorPath = path.join(this.targetDir, '.cursorrules');
    const template = await fs.readFile(
      path.join(this.srcDir, 'templates', 'ai-configs', 'cursor-rules.md'), 
      'utf8'
    );
    
    // Handle existing .cursorrules
    if (await this.exists(cursorPath)) {
      await this.handleExistingAIConfig('.cursorrules', cursorPath, template);
    } else {
      await fs.writeFile(cursorPath, template);
      if (this.debug) {
        console.log('🐛 DEBUG: Created new .cursorrules');
      }
    }
    
    if (this.debug) {
      console.log('🐛 DEBUG: Generated Cursor configuration');
    }
  }

  async generateGeminiConfig() {
    const geminiPath = path.join(this.targetDir, 'GEMINI.md');
    const template = await fs.readFile(
      path.join(this.srcDir, 'templates', 'ai-configs', 'gemini.md'), 
      'utf8'
    );
    
    // Handle existing GEMINI.md
    if (await this.exists(geminiPath)) {
      await this.handleExistingAIConfig('GEMINI.md', geminiPath, template);
    } else {
      await fs.writeFile(geminiPath, template);
      if (this.debug) {
        console.log('🐛 DEBUG: Created new GEMINI.md');
      }
    }
    
    if (this.debug) {
      console.log('🐛 DEBUG: Generated Gemini configuration');
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
      const content = await fs.readFile(path.join(this.documindDir, 'core', filename), 'utf8');
      return content;
    } catch (error) {
      console.warn(`Warning: Could not read ${filename}`);
      return null;
    }
  }

  async detectAITools() {
    const tools = [];
    
    // Check for existing AI configurations in target directory
    if (await this.exists(path.join(this.targetDir, '.github'))) tools.push('copilot');
    if (await this.exists(path.join(this.targetDir, '.cursor')) || 
        await this.exists(path.join(this.targetDir, '.cursorrules'))) tools.push('cursor');
    if (await this.exists(path.join(this.targetDir, 'CLAUDE.md'))) tools.push('claude');
    
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

  async readPackageJson() {
    try {
      const content = await fs.readFile(path.join(this.targetDir, 'package.json'), 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async updateGitignore() {
    const gitignorePath = path.join(this.targetDir, '.gitignore');
    
    // DocuMind section to add
    const documindSection = `

# DocuMind - Documentation System
# Keep configuration files, ignore user-specific settings
.documind/
!.documind/core/
!.documind/templates/
!.documind/scripts/
docs/.cache/
docs/temp/
*.docuMind.tmp`;

    try {
      let gitignoreContent = '';
      
      try {
        gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
      } catch (error) {
        // File doesn't exist, that's fine
        if (this.debug) {
          console.log('🐛 DEBUG: .gitignore does not exist, creating new one');
        }
      }
      
      // Check if DocuMind section already exists
      if (!gitignoreContent.includes('# DocuMind')) {
        gitignoreContent += documindSection;
        await fs.writeFile(gitignorePath, gitignoreContent);
        
        if (this.debug) {
          console.log('🐛 DEBUG: Updated .gitignore with DocuMind section');
        }
      }
      
    } catch (error) {
      console.warn('Warning: Could not update .gitignore:', error.message);
    }
  }

  async handleExistingAIConfig(fileName, filePath, newTemplate) {
    try {
      const existing = await fs.readFile(filePath, 'utf8');
      
      // Check if it already contains DocuMind content
      if (existing.includes('DocuMind') || existing.includes('/document')) {
        if (this.debug) {
          console.log(`🐛 DEBUG: ${fileName} already contains DocuMind content, skipping`);
        }
        return;
      }
      
      // For non-interactive environments, append DocuMind content
      if (process.env.CI || process.env.GITHUB_ACTIONS || !process.stdin.isTTY) {
        await this.appendDocuMindContent(fileName, filePath, existing, newTemplate);
        return;
      }
      
      // Interactive mode - ask user what to do
      console.log(`\n${this.colors.neonPink}⚠️  Found existing ${fileName}${this.colors.reset}`);
      console.log(`   Options:`);
      console.log(`   ${this.colors.electricBlue}1.${this.colors.reset} Keep existing and append DocuMind section`);
      console.log(`   ${this.colors.electricBlue}2.${this.colors.reset} Create backup and replace with DocuMind template`);
      console.log(`   ${this.colors.electricBlue}3.${this.colors.reset} Skip (keep existing unchanged)`);
      
      // For now, default to append (option 1) since we can't easily do interactive input
      await this.appendDocuMindContent(fileName, filePath, existing, newTemplate);
      
    } catch (error) {
      console.warn(`Warning: Could not handle existing ${fileName}:`, error.message);
      // Fallback to creating the file
      await fs.writeFile(filePath, newTemplate);
    }
  }
  
  async appendDocuMindContent(fileName, filePath, existing, newTemplate) {
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.writeFile(backupPath, existing);
    
    // Extract DocuMind-specific content from template
    const documindSection = this.extractDocuMindSection(newTemplate);
    
    // Append DocuMind section to existing content
    const combined = existing + '\n\n---\n\n' + documindSection;
    await fs.writeFile(filePath, combined);
    
    console.log(`   ${this.colors.neonCyan}✓ Appended DocuMind content to ${fileName}${this.colors.reset}`);
    console.log(`   ${this.colors.neonCyan}✓ Created backup: ${path.basename(backupPath)}${this.colors.reset}`);
    
    if (this.debug) {
      console.log(`🐛 DEBUG: Backup created at ${backupPath}`);
    }
  }
  
  extractDocuMindSection(template) {
    // Extract the core DocuMind instructions from template
    // This could be made more sophisticated based on template structure
    return `# DocuMind Integration

This project uses **DocuMind** - an intelligent documentation system that enables slash commands for documentation management.

## 📚 Documentation Commands

You have access to documentation commands through natural language or slash notation:

- \`/document bootstrap\` - Generate complete documentation from codebase analysis
- \`/document expand [concept]\` - Expand specific concepts with detailed explanations
- \`/document update [section]\` - Update existing documentation sections  
- \`/document analyze [integration]\` - Analyze and document external integrations
- \`/document index\` - Regenerate documentation index and navigation
- \`/document search [query]\` - Find existing documentation about topics

**For complete DocuMind system instructions, see \`.documind/system.md\`**
**For detailed command reference, see \`.documind/commands.md\`**`;
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new DocuMindCLI();
  cli.run();
}

export default DocuMindCLI;