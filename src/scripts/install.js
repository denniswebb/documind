#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

class DocuMindInstaller {
  constructor() {
    this.repoRoot = process.cwd() || path.resolve('.');
    this.documindDir = path.join(this.repoRoot, '.documind');
    this.srcDir = this.findSrcDir();
  }

  findSrcDir() {
    // Find the src directory relative to this script
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(scriptDir, '..');
  }

  async copyDocuMindCore() {
    // Copy entire src/ directory to target's .documind/
    await this.copyDirectory(this.srcDir, this.documindDir);
  }

  async copyDirectory(src, dest) {
    await this.ensureDir(path.dirname(dest));
    
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async install() {
    console.log('🧠 Installing DocuMind...');
    
    try {
      // 1. Copy src/ to .documind/ directory
      await this.copyDocuMindCore();
      console.log('  ✓ Copied DocuMind core system');
      
      // 2. Detect which AI tools are in use
      const detected = await this.detectAITools();
      console.log(`  📱 Detected AI tools: ${detected.join(', ')}`);
      
      // 3. Generate instruction files for each
      for (const tool of detected) {
        await this.generateInstructionFile(tool);
      }
      
      // 4. Add to .gitignore if needed (but keep DocuMind tracked)
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
    const detected = [];
    
    // Check for existing AI configurations
    if (await this.exists('.github')) detected.push('copilot');
    if (await this.exists('.cursor')) detected.push('cursor');
    
    // Check for common AI-related files
    if (await this.exists('CLAUDE.md')) detected.push('claude');
    
    // Check for Gemini CLI (look for gemini config or usage)
    const packageJson = await this.readPackageJson();
    if (packageJson && packageJson.scripts) {
      const scripts = Object.values(packageJson.scripts).join(' ');
      if (scripts.includes('gemini')) detected.push('gemini');
    }
    
    // Always install for all supported tools (but preserve existing configurations)
    const tools = ['copilot', 'claude', 'cursor', 'gemini'];
    
    if (detected.length > 0) {
      console.log(`  🔍 Detected existing AI tools: ${detected.join(', ')}`);
      console.log('  📦 Installing for all supported tools while preserving existing configurations');
    } else {
      console.log('  ℹ️  No existing AI configurations found, installing for all supported tools');
    }
    
    return tools;
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
    
    // Create slash command in proper location
    await this.ensureDir('.github/prompts');
    const promptContent = await this.loadTemplate('copilot-prompt');
    await fs.writeFile(
      path.join(this.repoRoot, '.github', 'prompts', 'document.prompt.md'),
      promptContent
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
    const CommandGenerator = (await import('./generate-commands.js')).default;
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
  }
  
  async generateGeminiInstructions() {
    const content = await this.loadTemplate('gemini-instructions');
    await fs.writeFile(
      path.join(this.repoRoot, 'GEMINI.md'),
      content
    );
  }
  
  async loadTemplate(templateName) {
    const templateMap = {
      'copilot-instructions': 'copilot-instructions.md',
      'copilot-prompt': 'copilot-prompt.md',
      'claude-instructions': 'claude.md',
      'cursor-rules': 'cursor-rules.md',
      'gemini-instructions': 'gemini.md'
    };
    
    const templateFile = templateMap[templateName];
    if (!templateFile) {
      console.warn(`Warning: Unknown template ${templateName}`);
      return '';
    }
    
    try {
      const templatePath = path.join(this.documindDir, 'templates', 'ai-configs', templateFile);
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      console.warn(`Warning: Could not read template ${templateFile}:`, error.message);
      return '';
    }
  }
  
  async readDocuMindFile(filename) {
    try {
      const content = await fs.readFile(path.join(this.documindDir, 'core', filename), 'utf8');
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
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('DEBUG: Installing DocuMind script called directly');
  const installer = new DocuMindInstaller();
  installer.install().catch(error => {
    console.error('Installation failed:', error);
    process.exit(1);
  });
}

export default DocuMindInstaller;