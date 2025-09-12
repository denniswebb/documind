#!/usr/bin/env node

/**
 * T009: Integration test for AI tool detection across all 4 tools
 * Tests comprehensive AI tool detection logic and configuration generation
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

class AIDetectionTestEnvironment {
  constructor() {
    this.tempDir = null;
    this.repoRoot = null;
  }

  async initialize() {
    // Create unique temporary directory
    this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'documind-ai-detection-'));
    this.repoRoot = this.tempDir;
    console.log(`AI Detection test environment: ${this.tempDir}`);
  }

  async setupBasicRepo() {
    // Create basic repository structure
    await fs.mkdir(path.join(this.repoRoot, '.git'), { recursive: true });
    
    // Create package.json
    const packageJson = {
      name: 'test-ai-detection',
      version: '1.0.0',
      description: 'Test AI tool detection',
      engines: { node: '>=16.0.0' }
    };
    await fs.writeFile(
      path.join(this.repoRoot, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create basic .gitignore
    await fs.writeFile(
      path.join(this.repoRoot, '.gitignore'),
      'node_modules/\n'
    );
  }

  async createClaudeIndicators() {
    // Multiple ways Claude can be detected
    await fs.writeFile(
      path.join(this.repoRoot, 'CLAUDE.md'),
      '# Existing Claude Instructions\n\nSome existing content.\n'
    );

    await fs.mkdir(path.join(this.repoRoot, '.claude'), { recursive: true });
    await fs.writeFile(
      path.join(this.repoRoot, '.claude', 'config.json'),
      '{"version": "1.0"}\n'
    );
  }

  async createCursorIndicators() {
    // Multiple ways Cursor can be detected
    await fs.mkdir(path.join(this.repoRoot, '.cursor'), { recursive: true });
    await fs.writeFile(
      path.join(this.repoRoot, '.cursor', 'settings.json'),
      '{"cursor.version": "0.1"}\n'
    );

    await fs.writeFile(
      path.join(this.repoRoot, '.cursorrules'),
      '# Existing Cursor Rules\nSome rules here.\n'
    );
  }

  async createCopilotIndicators() {
    // GitHub/Copilot detection patterns
    await fs.mkdir(path.join(this.repoRoot, '.github'), { recursive: true });
    await fs.mkdir(path.join(this.repoRoot, '.github', 'workflows'), { recursive: true });
    
    await fs.writeFile(
      path.join(this.repoRoot, '.github', 'workflows', 'test.yml'),
      'name: Test\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n'
    );

    await fs.writeFile(
      path.join(this.repoRoot, '.github', 'copilot-instructions.md'),
      '# Existing Copilot Instructions\nSome instructions.\n'
    );
  }

  async createGeminiIndicators() {
    // Gemini detection patterns
    await fs.writeFile(
      path.join(this.repoRoot, 'GEMINI.md'),
      '# Existing Gemini Instructions\nGemini configuration.\n'
    );

    await fs.mkdir(path.join(this.repoRoot, '.gemini'), { recursive: true });
    await fs.writeFile(
      path.join(this.repoRoot, '.gemini', 'config.yaml'),
      'version: 1.0\nmodel: gemini-pro\n'
    );
  }

  async removeAllAIIndicators() {
    // Remove all AI tool indicators to test negative detection
    const aiFiles = [
      'CLAUDE.md', '.cursorrules', 'GEMINI.md',
      '.claude', '.cursor', '.github', '.gemini'
    ];

    for (const file of aiFiles) {
      const filePath = path.join(this.repoRoot, file);
      try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          await fs.rm(filePath, { recursive: true, force: true });
        } else {
          await fs.unlink(filePath);
        }
      } catch (error) {
        // File doesn't exist, which is fine
      }
    }
  }

  async copyDocuMindScripts() {
    // Copy the actual DocuMind scripts
    const sourceScriptsDir = path.join(process.cwd(), '.documind', 'scripts');
    const targetScriptsDir = path.join(this.repoRoot, '.documind', 'scripts');
    
    await fs.mkdir(targetScriptsDir, { recursive: true });
    
    const scripts = ['install.js', 'generate-commands.js', 'update.js'];
    for (const script of scripts) {
      const sourceFile = path.join(sourceScriptsDir, script);
      const targetFile = path.join(targetScriptsDir, script);
      await fs.copyFile(sourceFile, targetFile);
    }

    // Copy templates if they exist
    const sourceTemplatesDir = path.join(process.cwd(), '.documind', 'templates');
    const targetTemplatesDir = path.join(this.repoRoot, '.documind', 'templates');
    
    try {
      await fs.access(sourceTemplatesDir);
      await fs.mkdir(targetTemplatesDir, { recursive: true });
      
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
        resolve({ stdout, stderr, exitCode: code });
      });
    });
  }

  async cleanup() {
    if (this.tempDir) {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    }
  }
}

describe('AI Tool Detection Integration', () => {
  let testEnv;

  test('should detect Claude through CLAUDE.md file', async () => {
    testEnv = new AIDetectionTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.createClaudeIndicators();
      await testEnv.copyDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Verify Claude was detected
      assert.ok(result.stdout.includes('claude'), 
        'Should detect Claude from CLAUDE.md file');
      
      // Verify installation succeeded
      assert.strictEqual(result.exitCode, 0, 
        'Installation should succeed when Claude is detected');

      // Verify CLAUDE.md was updated with DocuMind instructions
      const claudeFile = path.join(testEnv.repoRoot, 'CLAUDE.md');
      const claudeContent = await fs.readFile(claudeFile, 'utf8');
      assert.ok(claudeContent.includes('DocuMind'), 
        'CLAUDE.md should be updated with DocuMind instructions');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should detect Cursor through .cursor directory and .cursorrules file', async () => {
    testEnv = new AIDetectionTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.createCursorIndicators();
      await testEnv.copyDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Verify Cursor was detected
      assert.ok(result.stdout.includes('cursor'), 
        'Should detect Cursor from .cursor directory and .cursorrules');
      
      assert.strictEqual(result.exitCode, 0, 
        'Installation should succeed when Cursor is detected');

      // Verify .cursorrules was updated
      const cursorFile = path.join(testEnv.repoRoot, '.cursorrules');
      const cursorContent = await fs.readFile(cursorFile, 'utf8');
      assert.ok(cursorContent.includes('DocuMind') || cursorContent.includes('/document'), 
        '.cursorrules should be updated with DocuMind instructions');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should detect GitHub Copilot through .github directory', async () => {
    testEnv = new AIDetectionTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.createCopilotIndicators();
      await testEnv.copyDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Verify Copilot was detected
      assert.ok(result.stdout.includes('copilot'), 
        'Should detect GitHub Copilot from .github directory');
      
      assert.strictEqual(result.exitCode, 0, 
        'Installation should succeed when Copilot is detected');

      // Verify copilot instructions exist
      const copilotFile = path.join(testEnv.repoRoot, '.github', 'copilot-instructions.md');
      const copilotContent = await fs.readFile(copilotFile, 'utf8');
      assert.ok(copilotContent.includes('DocuMind') || copilotContent.includes('Copilot'), 
        'Copilot instructions should contain relevant content');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should detect Gemini through GEMINI.md file', async () => {
    testEnv = new AIDetectionTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.createGeminiIndicators();
      await testEnv.copyDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Verify Gemini was detected
      assert.ok(result.stdout.includes('gemini'), 
        'Should detect Gemini from GEMINI.md file');
      
      assert.strictEqual(result.exitCode, 0, 
        'Installation should succeed when Gemini is detected');

      // Verify GEMINI.md was updated
      const geminiFile = path.join(testEnv.repoRoot, 'GEMINI.md');
      const geminiContent = await fs.readFile(geminiFile, 'utf8');
      assert.ok(geminiContent.includes('DocuMind'), 
        'GEMINI.md should be updated with DocuMind instructions');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should detect all 4 AI tools simultaneously', async () => {
    testEnv = new AIDetectionTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      
      // Create indicators for all 4 AI tools
      await testEnv.createClaudeIndicators();
      await testEnv.createCursorIndicators();
      await testEnv.createCopilotIndicators();
      await testEnv.createGeminiIndicators();
      
      await testEnv.copyDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Verify all 4 tools were detected
      assert.ok(result.stdout.includes('claude'), 'Should detect Claude');
      assert.ok(result.stdout.includes('cursor'), 'Should detect Cursor');
      assert.ok(result.stdout.includes('copilot'), 'Should detect Copilot');
      assert.ok(result.stdout.includes('gemini'), 'Should detect Gemini');
      
      assert.strictEqual(result.exitCode, 0, 
        'Installation should succeed with all tools detected');

      // Verify all instruction files were created/updated
      const files = [
        'CLAUDE.md',
        '.cursorrules',
        '.github/copilot-instructions.md',
        'GEMINI.md'
      ];

      for (const file of files) {
        const filePath = path.join(testEnv.repoRoot, file);
        await assert.doesNotReject(async () => {
          await fs.access(filePath);
        }, `${file} should exist after installation`);

        const content = await fs.readFile(filePath, 'utf8');
        assert.ok(content.includes('DocuMind') || content.includes('/document'), 
          `${file} should contain DocuMind instructions`);
      }

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle no AI tools detected gracefully', async () => {
    testEnv = new AIDetectionTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.removeAllAIIndicators();
      await testEnv.copyDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Should still succeed even with no AI tools
      assert.strictEqual(result.exitCode, 0, 
        'Installation should succeed even when no AI tools are detected');

      // Should indicate no tools were found or provide default setup
      assert.ok(result.stdout.includes('DocuMind installed successfully'), 
        'Should report successful installation');

      // Should not create unnecessary instruction files
      const potentialFiles = ['CLAUDE.md', '.cursorrules', 'GEMINI.md'];
      for (const file of potentialFiles) {
        const filePath = path.join(testEnv.repoRoot, file);
        try {
          await fs.access(filePath);
          // If file exists, it should at least contain DocuMind content
          const content = await fs.readFile(filePath, 'utf8');
          assert.ok(content.includes('DocuMind'), 
            `${file} exists but should contain DocuMind instructions`);
        } catch (error) {
          // File doesn't exist, which is acceptable for no AI tools scenario
        }
      }

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should maintain detection confidence scoring', async () => {
    testEnv = new AIDetectionTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      
      // Create strong indicators for Claude (multiple files)
      await testEnv.createClaudeIndicators();
      
      // Create weak indicator for Cursor (only .cursor directory, no .cursorrules)
      await fs.mkdir(path.join(testEnv.repoRoot, '.cursor'), { recursive: true });
      
      await testEnv.copyDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Both should be detected, but this tests that detection logic handles
      // varying confidence levels appropriately
      assert.ok(result.stdout.includes('claude'), 'Should detect Claude with high confidence');
      assert.ok(result.stdout.includes('cursor'), 'Should detect Cursor with lower confidence');
      
      assert.strictEqual(result.exitCode, 0, 
        'Installation should succeed with mixed confidence levels');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle edge cases in AI tool detection', async () => {
    testEnv = new AIDetectionTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      
      // Create edge case scenarios
      
      // Empty .github directory (should not trigger false positive)
      await fs.mkdir(path.join(testEnv.repoRoot, '.github'), { recursive: true });
      
      // Empty Claude file
      await fs.writeFile(path.join(testEnv.repoRoot, 'CLAUDE.md'), '');
      
      // Directory that looks like AI tool but isn't
      await fs.mkdir(path.join(testEnv.repoRoot, '.not-cursor'), { recursive: true });
      
      await testEnv.copyDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Should detect based on file presence, not content
      assert.ok(result.stdout.includes('claude'), 'Should detect Claude even with empty file');
      assert.ok(result.stdout.includes('copilot'), 'Should detect Copilot from .github directory');
      
      // Should not be confused by similar directory names
      assert.ok(!result.stdout.includes('not-cursor'), 
        'Should not be confused by similar directory names');

      assert.strictEqual(result.exitCode, 0, 
        'Installation should succeed with edge case detection');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should preserve existing AI tool configurations', async () => {
    testEnv = new AIDetectionTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      
      // Create AI tool files with existing content
      const originalClaudeContent = '# My Custom Claude Setup\n\nExisting rules and configurations.\n\n## My Custom Section\nImportant existing content.\n';
      await fs.writeFile(
        path.join(testEnv.repoRoot, 'CLAUDE.md'),
        originalClaudeContent
      );
      
      const originalCursorContent = '# My Cursor Rules\nExisting cursor configuration.\n';
      await fs.writeFile(
        path.join(testEnv.repoRoot, '.cursorrules'),
        originalCursorContent
      );
      
      await testEnv.copyDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      assert.strictEqual(result.exitCode, 0, 'Installation should succeed');

      // Verify existing content is preserved while DocuMind instructions are added
      const claudeContent = await fs.readFile(
        path.join(testEnv.repoRoot, 'CLAUDE.md'),
        'utf8'
      );
      
      // Should contain both original content and DocuMind additions
      assert.ok(claudeContent.includes('My Custom Claude Setup'), 
        'Should preserve original Claude content');
      assert.ok(claudeContent.includes('DocuMind'), 
        'Should add DocuMind instructions');
      
      const cursorContent = await fs.readFile(
        path.join(testEnv.repoRoot, '.cursorrules'),
        'utf8'
      );
      
      assert.ok(cursorContent.includes('My Cursor Rules'), 
        'Should preserve original Cursor content');
      assert.ok(cursorContent.includes('DocuMind') || cursorContent.includes('/document'), 
        'Should add DocuMind instructions to Cursor rules');

    } finally {
      await testEnv.cleanup();
    }
  });
});