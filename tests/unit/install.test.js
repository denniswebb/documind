import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const DocuMindInstaller = require('../../.documind/scripts/install.cjs');

describe('DocuMind Installer Tests', () => {
  let testDir;
  let installer;
  let originalCwd;

  beforeEach(async () => {
    // Save original working directory
    originalCwd = process.cwd();
    
    // Create a unique temporary directory for each test
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'documind-install-test-'));
    // Resolve the real path to handle symlinks like /var -> /private/var on macOS
    testDir = await fs.realpath(testDir);
    process.chdir(testDir);
    
    // Create installer instance
    installer = new DocuMindInstaller();
  });

  afterEach(async () => {
    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Constructor', () => {
    test('should initialize with correct repo root', () => {
      assert.strictEqual(installer.repoRoot, testDir, 'Should set repo root to current directory');
    });

    test('should set correct documind directory path', () => {
      const expectedPath = path.join(testDir, '.documind');
      assert.strictEqual(installer.documindDir, expectedPath, 'Should set documind dir correctly');
    });
  });

  describe('AI Tool Detection', () => {
    test('should detect no specific tools in empty repository', async () => {
      const tools = await installer.detectAITools();
      
      assert.ok(Array.isArray(tools), 'Should return an array');
      // For empty repo, should return all default tools
      assert.ok(tools.length > 0, 'Should return default tools');
      assert.ok(tools.includes('copilot'), 'Should include copilot in defaults');
      assert.ok(tools.includes('claude'), 'Should include claude in defaults');
      assert.ok(tools.includes('cursor'), 'Should include cursor in defaults');
      assert.ok(tools.includes('gemini'), 'Should include gemini in defaults');
    });

    test('should detect Claude when CLAUDE.md exists', async () => {
      await fs.writeFile('CLAUDE.md', '# Existing Claude instructions');
      
      const tools = await installer.detectAITools();
      
      assert.ok(tools.includes('claude'), 'Should detect Claude tool');
    });

    test('should detect Copilot when .github directory exists', async () => {
      await fs.mkdir('.github');
      
      const tools = await installer.detectAITools();
      
      assert.ok(tools.includes('copilot'), 'Should detect Copilot tool');
    });

    test('should detect Cursor when .cursor directory exists', async () => {
      await fs.mkdir('.cursor');
      
      const tools = await installer.detectAITools();
      
      assert.ok(tools.includes('cursor'), 'Should detect Cursor tool');
    });

    test('should detect Cursor when .cursorrules file exists', async () => {
      await fs.writeFile('.cursorrules', 'cursor rules content');
      
      const tools = await installer.detectAITools();
      
      assert.ok(tools.includes('cursor'), 'Should detect Cursor from .cursorrules');
    });

    test('should detect multiple tools when multiple indicators exist', async () => {
      await fs.writeFile('CLAUDE.md', 'claude');
      await fs.mkdir('.github');
      await fs.writeFile('.cursorrules', 'cursor');
      
      const tools = await installer.detectAITools();
      
      assert.ok(tools.includes('claude'), 'Should detect Claude');
      assert.ok(tools.includes('copilot'), 'Should detect Copilot');
      assert.ok(tools.includes('cursor'), 'Should detect Cursor');
    });

    test('should remove duplicates from detected tools', async () => {
      // Create multiple Cursor indicators
      await fs.mkdir('.cursor');
      await fs.writeFile('.cursorrules', 'cursor');
      
      const tools = await installer.detectAITools();
      
      // Should only have one instance of 'cursor'
      const cursorCount = tools.filter(tool => tool === 'cursor').length;
      assert.strictEqual(cursorCount, 1, 'Should remove duplicate tools');
    });
  });

  describe('Template Loading (Currently Failing - Templates Need Implementation)', () => {
    test('should fail to load non-existent template', async () => {
      const templateName = 'non-existent-template';
      
      // This should fail because template loading isn't fully implemented
      await assert.rejects(
        async () => {
          const content = await installer.loadTemplate(templateName);
          if (!content || content.includes('[') && content.includes('not found]')) {
            throw new Error('Template not found');
          }
          return content;
        },
        'Should fail when template does not exist'
      );
    });

    test('should load claude-instructions template', async () => {
      const templateName = 'claude-instructions';
      
      // This will currently work because it uses inline templates
      const content = await installer.loadTemplate(templateName);
      
      assert.ok(content, 'Should return template content');
      assert.ok(content.includes('Claude'), 'Template should contain Claude-specific content');
      assert.ok(content.includes('Documentation Commands'), 'Template should have documentation commands section');
    });
  });

  describe('Instruction File Generation', () => {
    test('should generate Claude instruction file', async () => {
      // Mock the .documind directory structure
      await fs.mkdir('.documind/core', { recursive: true });
      await fs.writeFile('.documind/core/system.md', 'System instructions content');
      await fs.writeFile('.documind/core/commands.md', 'Commands content');
      
      await installer.generateClaudeInstructions();
      
      // Check that CLAUDE.md was created
      await assert.doesNotReject(fs.access('CLAUDE.md'), 'CLAUDE.md should be created');
      
      const content = await fs.readFile('CLAUDE.md', 'utf8');
      assert.ok(content.includes('Claude Instructions'), 'Should contain Claude header');
      assert.ok(content.includes('DocuMind'), 'Should mention DocuMind');
    });

    test('should generate Copilot instruction files', async () => {
      await installer.generateCopilotInstructions();
      
      // Should create .github directory and files
      await assert.doesNotReject(fs.access('.github'), '.github directory should be created');
      await assert.doesNotReject(
        fs.access('.github/copilot-instructions.md'), 
        'Copilot instructions should be created'
      );
      
      const content = await fs.readFile('.github/copilot-instructions.md', 'utf8');
      assert.ok(content.includes('GitHub Copilot'), 'Should contain Copilot-specific content');
    });

    test('should generate Cursor instruction files', async () => {
      await installer.generateCursorInstructions();
      
      // Should create both .cursor/rules directory and .cursorrules file
      await assert.doesNotReject(fs.access('.cursor'), '.cursor directory should be created');
      await assert.doesNotReject(fs.access('.cursorrules'), '.cursorrules file should be created');
      
      const cursorRulesContent = await fs.readFile('.cursorrules', 'utf8');
      assert.ok(cursorRulesContent.includes('DocuMind'), 'Should contain DocuMind content');
    });

    test('should generate Gemini instruction file', async () => {
      await installer.generateGeminiInstructions();
      
      await assert.doesNotReject(fs.access('GEMINI.md'), 'GEMINI.md should be created');
      
      const content = await fs.readFile('GEMINI.md', 'utf8');
      assert.ok(content.includes('Gemini'), 'Should contain Gemini-specific content');
    });
  });

  describe('Full Installation Process', () => {
    test('should complete installation without errors in empty repo', async () => {
      // Mock .documind directory with required files
      await fs.mkdir('.documind/core', { recursive: true });
      await fs.writeFile('.documind/core/system.md', 'System content');
      await fs.writeFile('.documind/core/commands.md', 'Commands content');
      
      // Should not throw during installation
      await assert.doesNotReject(
        installer.install(),
        'Installation should complete without errors'
      );
    });

    test('should create instruction files for all detected tools', async () => {
      // Setup mock .documind directory
      await fs.mkdir('.documind/core', { recursive: true });
      await fs.writeFile('.documind/core/system.md', 'System');
      await fs.writeFile('.documind/core/commands.md', 'Commands');
      
      await installer.install();
      
      // All default tools should have instruction files created
      await assert.doesNotReject(fs.access('CLAUDE.md'), 'Claude instructions should exist');
      await assert.doesNotReject(fs.access('.github/copilot-instructions.md'), 'Copilot instructions should exist');
      await assert.doesNotReject(fs.access('.cursorrules'), 'Cursor instructions should exist');
      await assert.doesNotReject(fs.access('GEMINI.md'), 'Gemini instructions should exist');
    });

    test('should handle missing .documind files gracefully', async () => {
      // Don't create .documind directory - this should still work but with warnings
      
      await assert.doesNotReject(
        installer.install(),
        'Should handle missing .documind files gracefully'
      );
      
      // Files should still be created but may contain "[file not found]" placeholders
      await assert.doesNotReject(fs.access('CLAUDE.md'), 'CLAUDE.md should still be created');
    });
  });
});