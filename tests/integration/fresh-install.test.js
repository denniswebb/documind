#!/usr/bin/env node

/**
 * T008: Integration test for fresh installation workflow
 * Tests the complete DocuMind installation process from a clean state
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

class TestEnvironment {
  constructor() {
    this.tempDir = null;
    this.repoRoot = null;
  }

  async initialize() {
    // Create unique temporary directory
    this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'documind-fresh-install-'));
    this.repoRoot = this.tempDir;
    console.log(`Test environment: ${this.tempDir}`);
  }

  async setupMockRepo() {
    // Create basic repository structure
    await fs.mkdir(path.join(this.repoRoot, '.git'), { recursive: true });
    
    // Create package.json to simulate a Node.js project
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      description: 'Test project for DocuMind installation',
      engines: {
        node: '>=16.0.0'
      }
    };
    await fs.writeFile(
      path.join(this.repoRoot, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create basic gitignore
    await fs.writeFile(
      path.join(this.repoRoot, '.gitignore'),
      'node_modules/\n.env\n'
    );

    // Create some source files to make it look realistic
    await fs.mkdir(path.join(this.repoRoot, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(this.repoRoot, 'src', 'index.js'),
      'console.log("Hello, world!");\n'
    );

    // Create README
    await fs.writeFile(
      path.join(this.repoRoot, 'README.md'),
      '# Test Project\n\nA test project for DocuMind integration.\n'
    );
  }

  async createAIToolIndicators(tools = []) {
    // Create indicators for specific AI tools
    for (const tool of tools) {
      switch (tool) {
        case 'claude':
          await fs.writeFile(
            path.join(this.repoRoot, 'CLAUDE.md'),
            '# Claude Instructions\n\nBasic instructions for Claude.\n'
          );
          break;
        case 'cursor':
          await fs.mkdir(path.join(this.repoRoot, '.cursor'), { recursive: true });
          await fs.writeFile(
            path.join(this.repoRoot, '.cursorrules'),
            '# Cursor Rules\n\nBasic rules for Cursor.\n'
          );
          break;
        case 'copilot':
          await fs.mkdir(path.join(this.repoRoot, '.github'), { recursive: true });
          await fs.writeFile(
            path.join(this.repoRoot, '.github', 'copilot-instructions.md'),
            '# Copilot Instructions\n\nInstructions for GitHub Copilot.\n'
          );
          break;
        case 'gemini':
          await fs.writeFile(
            path.join(this.repoRoot, 'GEMINI.md'),
            '# Gemini Instructions\n\nInstructions for Google Gemini.\n'
          );
          break;
      }
    }
  }

  async cleanup() {
    if (this.tempDir) {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    }
  }

  async copyDocuMindScripts() {
    // Copy the actual DocuMind scripts to the test environment
    const sourceScriptsDir = path.join(process.cwd(), '.documind', 'scripts');
    const targetScriptsDir = path.join(this.repoRoot, '.documind', 'scripts');
    
    await fs.mkdir(targetScriptsDir, { recursive: true });
    
    const scripts = ['install.js', 'generate-commands.js', 'update.js'];
    for (const script of scripts) {
      const sourceFile = path.join(sourceScriptsDir, script);
      const targetFile = path.join(targetScriptsDir, script);
      await fs.copyFile(sourceFile, targetFile);
    }

    // Also copy templates directory
    const sourceTemplatesDir = path.join(process.cwd(), '.documind', 'templates');
    const targetTemplatesDir = path.join(this.repoRoot, '.documind', 'templates');
    
    // Check if templates directory exists before copying
    try {
      await fs.access(sourceTemplatesDir);
      await fs.mkdir(targetTemplatesDir, { recursive: true });
      
      // Copy all template files
      const templateFiles = await fs.readdir(sourceTemplatesDir);
      for (const file of templateFiles) {
        const sourceFile = path.join(sourceTemplatesDir, file);
        const targetFile = path.join(targetTemplatesDir, file);
        const stat = await fs.stat(sourceFile);
        if (stat.isFile()) {
          await fs.copyFile(sourceFile, targetFile);
        }
      }
    } catch (error) {
      console.log('Templates directory not found, skipping...');
    }
  }

  async runInstallScript() {
    return new Promise((resolve, reject) => {
      const installScript = path.join(this.repoRoot, '.documind', 'scripts', 'install.js');
      const child = spawn('node', [installScript], {
        cwd: this.repoRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, exitCode: code });
        } else {
          reject(new Error(`Install script failed with code ${code}: ${stderr}`));
        }
      });
    });
  }
}

describe('Fresh Installation Workflow', () => {
  let testEnv;

  test('should successfully install DocuMind in empty repository', async () => {
    testEnv = new TestEnvironment();
    
    try {
      // Setup test environment
      await testEnv.initialize();
      await testEnv.setupMockRepo();
      await testEnv.copyDocuMindScripts();

      // Run installation
      const result = await testEnv.runInstallScript();
      
      // Verify installation was reported as successful
      assert.ok(result.stdout.includes('DocuMind installed successfully'), 
        'Installation should report success');
      assert.ok(result.stdout.includes('Installing DocuMind'), 
        'Should show installation start message');

      // Verify .documind directory exists
      const documindDir = path.join(testEnv.repoRoot, '.documind');
      await assert.doesNotReject(async () => {
        await fs.access(documindDir);
      }, 'Should create .documind directory');

      // Verify gitignore was not modified (no AI tools detected)
      const gitignoreContent = await fs.readFile(
        path.join(testEnv.repoRoot, '.gitignore'),
        'utf8'
      );
      assert.strictEqual(gitignoreContent, 'node_modules/\n.env\n', 
        'Should not modify .gitignore when no AI tools detected');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should detect and configure Claude when CLAUDE.md exists', async () => {
    testEnv = new TestEnvironment();
    
    try {
      // Setup test environment with Claude indicator
      await testEnv.initialize();
      await testEnv.setupMockRepo();
      await testEnv.createAIToolIndicators(['claude']);
      await testEnv.copyDocuMindScripts();

      // Run installation
      const result = await testEnv.runInstallScript();
      
      // Verify Claude was detected
      assert.ok(result.stdout.includes('claude'), 
        'Should detect Claude AI tool');

      // Verify CLAUDE.md was updated/created with DocuMind instructions
      const claudeFile = path.join(testEnv.repoRoot, 'CLAUDE.md');
      await assert.doesNotReject(async () => {
        await fs.access(claudeFile);
      }, 'CLAUDE.md should exist after installation');

      const claudeContent = await fs.readFile(claudeFile, 'utf8');
      assert.ok(claudeContent.includes('DocuMind'), 
        'CLAUDE.md should contain DocuMind instructions');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should detect and configure Cursor when .cursor directory exists', async () => {
    testEnv = new TestEnvironment();
    
    try {
      // Setup test environment with Cursor indicator
      await testEnv.initialize();
      await testEnv.setupMockRepo();
      await testEnv.createAIToolIndicators(['cursor']);
      await testEnv.copyDocuMindScripts();

      // Run installation
      const result = await testEnv.runInstallScript();
      
      // Verify Cursor was detected
      assert.ok(result.stdout.includes('cursor'), 
        'Should detect Cursor AI tool');

      // Verify .cursorrules was updated/created
      const cursorRules = path.join(testEnv.repoRoot, '.cursorrules');
      await assert.doesNotReject(async () => {
        await fs.access(cursorRules);
      }, '.cursorrules should exist after installation');

      const cursorContent = await fs.readFile(cursorRules, 'utf8');
      assert.ok(cursorContent.includes('DocuMind') || cursorContent.includes('/document'), 
        '.cursorrules should contain DocuMind instructions');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should detect and configure Copilot when .github directory exists', async () => {
    testEnv = new TestEnvironment();
    
    try {
      // Setup test environment with Copilot indicator
      await testEnv.initialize();
      await testEnv.setupMockRepo();
      await testEnv.createAIToolIndicators(['copilot']);
      await testEnv.copyDocuMindScripts();

      // Run installation
      const result = await testEnv.runInstallScript();
      
      // Verify Copilot was detected
      assert.ok(result.stdout.includes('copilot'), 
        'Should detect GitHub Copilot');

      // Verify copilot instructions file exists
      const copilotFile = path.join(testEnv.repoRoot, '.github', 'copilot-instructions.md');
      await assert.doesNotReject(async () => {
        await fs.access(copilotFile);
      }, 'Copilot instructions should exist after installation');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle multiple AI tools simultaneously', async () => {
    testEnv = new TestEnvironment();
    
    try {
      // Setup test environment with multiple AI tools
      await testEnv.initialize();
      await testEnv.setupMockRepo();
      await testEnv.createAIToolIndicators(['claude', 'cursor', 'copilot']);
      await testEnv.copyDocuMindScripts();

      // Run installation
      const result = await testEnv.runInstallScript();
      
      // Verify all tools were detected
      assert.ok(result.stdout.includes('claude'), 'Should detect Claude');
      assert.ok(result.stdout.includes('cursor'), 'Should detect Cursor');
      assert.ok(result.stdout.includes('copilot'), 'Should detect Copilot');

      // Verify all instruction files exist
      const claudeFile = path.join(testEnv.repoRoot, 'CLAUDE.md');
      const cursorFile = path.join(testEnv.repoRoot, '.cursorrules');
      const copilotFile = path.join(testEnv.repoRoot, '.github', 'copilot-instructions.md');

      await assert.doesNotReject(async () => {
        await fs.access(claudeFile);
      }, 'CLAUDE.md should exist');

      await assert.doesNotReject(async () => {
        await fs.access(cursorFile);
      }, '.cursorrules should exist');

      await assert.doesNotReject(async () => {
        await fs.access(copilotFile);
      }, 'Copilot instructions should exist');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should complete installation within performance limit', async () => {
    testEnv = new TestEnvironment();
    
    try {
      // Setup test environment
      await testEnv.initialize();
      await testEnv.setupMockRepo();
      await testEnv.createAIToolIndicators(['claude']);
      await testEnv.copyDocuMindScripts();

      // Measure installation time
      const startTime = Date.now();
      const result = await testEnv.runInstallScript();
      const endTime = Date.now();
      
      const installationTime = endTime - startTime;
      
      // Verify installation completed within 30 seconds (30000ms)
      assert.ok(installationTime < 30000, 
        `Installation should complete within 30 seconds, took ${installationTime}ms`);

      // Verify installation was successful
      assert.ok(result.stdout.includes('DocuMind installed successfully'), 
        'Installation should complete successfully within time limit');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should create proper directory structure', async () => {
    testEnv = new TestEnvironment();
    
    try {
      // Setup and run installation
      await testEnv.initialize();
      await testEnv.setupMockRepo();
      await testEnv.copyDocuMindScripts();
      await testEnv.runInstallScript();

      // Verify expected directory structure exists
      const documindDir = path.join(testEnv.repoRoot, '.documind');
      
      await assert.doesNotReject(async () => {
        await fs.access(documindDir);
      }, '.documind directory should exist');

      const scriptsDir = path.join(documindDir, 'scripts');
      await assert.doesNotReject(async () => {
        await fs.access(scriptsDir);
      }, '.documind/scripts directory should exist');

      // Verify required script files exist
      const installScript = path.join(scriptsDir, 'install.js');
      const generateScript = path.join(scriptsDir, 'generate-commands.js');

      await assert.doesNotReject(async () => {
        await fs.access(installScript);
      }, 'install.js should exist');

      await assert.doesNotReject(async () => {
        await fs.access(generateScript);
      }, 'generate-commands.js should exist');

    } finally {
      await testEnv.cleanup();
    }
  });
});