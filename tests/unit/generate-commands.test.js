/**
 * T016: Unit tests for generate-commands.js script
 * Tests the command generation functionality for different AI tools
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment } from '../utils/test-environment.js';
import { createMockRepository, createMockRepositoryWithAITools } from '../utils/mock-repo.js';
import { 
  assertFileExists, 
  assertDirectoryExists, 
  assertFileContains,
  assertArrayIncludes 
} from '../utils/assertions.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CommandGenerator = require('../../.documind/scripts/generate-commands.cjs');

describe('CommandGenerator Tests', () => {
  let testEnv;
  let generator;

  beforeEach(async () => {
    testEnv = await setupTestEnvironment('generate-commands-test-');
    generator = new CommandGenerator();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('Constructor', () => {
    test('should initialize with correct repo root', () => {
      assert.strictEqual(generator.repoRoot, testEnv.testDir, 'Should set repo root to current directory');
    });

    test('should set correct documind directory path', () => {
      const expectedPath = require('path').join(testEnv.testDir, '.documind');
      assert.strictEqual(generator.documindDir, expectedPath, 'Should set documind dir correctly');
    });
  });

  describe('AI Tool Detection', () => {
    test('should detect Claude when CLAUDE.md exists', async () => {
      await createMockRepositoryWithAITools(testEnv.testDir, 'claude_only');
      
      const tools = await generator.detectAITools();
      
      assertArrayIncludes(tools, ['claude'], 'Should detect Claude tool');
    });

    test('should detect Copilot when .github directory exists', async () => {
      await createMockRepositoryWithAITools(testEnv.testDir, 'copilot_only');
      
      const tools = await generator.detectAITools();
      
      assertArrayIncludes(tools, ['copilot'], 'Should detect Copilot tool');
    });

    test('should detect Cursor when .cursorrules file exists', async () => {
      await createMockRepositoryWithAITools(testEnv.testDir, 'cursor_only');
      
      const tools = await generator.detectAITools();
      
      assertArrayIncludes(tools, ['cursor'], 'Should detect Cursor tool');
    });

    test('should detect Cursor when .cursor directory exists', async () => {
      await createMockRepositoryWithAITools(testEnv.testDir, 'cursor_directory');
      
      const tools = await generator.detectAITools();
      
      assertArrayIncludes(tools, ['cursor'], 'Should detect Cursor from directory');
    });

    test('should detect multiple tools when multiple indicators exist', async () => {
      await createMockRepositoryWithAITools(testEnv.testDir, 'multiple_tools');
      
      const tools = await generator.detectAITools();
      
      assertArrayIncludes(tools, ['claude', 'copilot', 'cursor'], 'Should detect multiple tools');
    });

    test('should detect all tools in comprehensive setup', async () => {
      await createMockRepositoryWithAITools(testEnv.testDir, 'all_tools');
      
      const tools = await generator.detectAITools();
      
      assertArrayIncludes(tools, ['claude', 'copilot', 'cursor'], 'Should detect all tools');
    });

    test('should return default tools for empty repository', async () => {
      await createMockRepository(testEnv.testDir, 'empty');
      
      const tools = await generator.detectAITools();
      
      assertArrayIncludes(tools, ['claude', 'cursor', 'copilot', 'gemini'], 'Should include all default tools');
    });

    test('should remove duplicates from detected tools', async () => {
      // Create multiple indicators for the same tool
      await createMockRepositoryWithAITools(testEnv.testDir, 'cursor_only');
      await generator.ensureDir('.cursor');
      
      const tools = await generator.detectAITools();
      
      // Should only have one instance of 'cursor'
      const cursorCount = tools.filter(tool => tool === 'cursor').length;
      assert.strictEqual(cursorCount, 1, 'Should remove duplicate tools');
    });
  });

  describe('Command Generation for Claude', () => {
    test('should generate Claude commands successfully', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      const success = await generator.generateCommandsForTool('claude');
      
      assert.strictEqual(success, true, 'Should return true for successful generation');
      await assertDirectoryExists(require('path').join(testEnv.testDir, '.claude', 'commands'));
      await assertFileExists(require('path').join(testEnv.testDir, '.claude', 'commands', 'document.md'));
    });

    test('should create Claude command file with correct content', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      await generator.generateCommandsForTool('claude');
      
      const commandFile = require('path').join(testEnv.testDir, '.claude', 'commands', 'document.md');
      await assertFileContains(commandFile, '/document', 'Should contain document command');
      await assertFileContains(commandFile, 'DocuMind', 'Should mention DocuMind');
      await assertFileContains(commandFile, 'bootstrap', 'Should include bootstrap command');
      await assertFileContains(commandFile, 'expand', 'Should include expand command');
    });

    test('should handle missing .documind directory gracefully', async () => {
      await createMockRepository(testEnv.testDir, 'empty');
      
      // Should not throw even without .documind directory
      const success = await generator.generateCommandsForTool('claude');
      
      assert.strictEqual(success, true, 'Should handle missing .documind gracefully');
      await assertFileExists(require('path').join(testEnv.testDir, '.claude', 'commands', 'document.md'));
    });
  });

  describe('Command Generation for Other Tools', () => {
    test('should handle Cursor command generation', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      const success = await generator.generateCommandsForTool('cursor');
      
      assert.strictEqual(success, true, 'Should return true for Cursor');
      // Cursor doesn't create files, just logs info
    });

    test('should handle Copilot command generation', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      const success = await generator.generateCommandsForTool('copilot');
      
      assert.strictEqual(success, true, 'Should return true for Copilot');
      // Copilot doesn't create additional files, just logs info
    });

    test('should handle Gemini command generation', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      const success = await generator.generateCommandsForTool('gemini');
      
      assert.strictEqual(success, true, 'Should return true for Gemini');
      // Gemini doesn't create additional files, just logs info
    });

    test('should return false for unknown tool', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      const success = await generator.generateCommandsForTool('unknown-tool');
      
      assert.strictEqual(success, false, 'Should return false for unknown tool');
    });
  });

  describe('Template and Content Generation', () => {
    test('should generate Claude command content with fallback', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      const content = await generator.generateClaudeCommandContent();
      
      assert.ok(content, 'Should generate content');
      assert.ok(content.includes('/document'), 'Should include document command');
      assert.ok(content.includes('bootstrap'), 'Should include bootstrap command');
      assert.ok(content.includes('Interactive Mode'), 'Should include usage instructions');
    });

    test('should read command template when available', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      // Create mock .documind structure with template
      await generator.ensureDir('.documind/templates');
      await require('fs').promises.writeFile(
        require('path').join(testEnv.testDir, '.documind', 'templates', 'claude-command.md'),
        'Mock template content with /document commands'
      );
      
      const content = await generator.readCommandTemplate();
      
      assert.ok(content.includes('Mock template content'), 'Should read template content');
    });

    test('should fall back to generated content when template missing', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      const content = await generator.readCommandTemplate();
      
      assert.ok(content, 'Should generate fallback content');
      assert.ok(content.includes('/document'), 'Should include document commands');
    });

    test('should incorporate system and commands content when available', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      // Create mock .documind files
      await generator.ensureDir('.documind');
      await require('fs').promises.writeFile(
        require('path').join(testEnv.testDir, '.documind', 'system.md'),
        'Custom system instructions for testing'
      );
      await require('fs').promises.writeFile(
        require('path').join(testEnv.testDir, '.documind', 'commands.md'),
        'Custom commands reference for testing'
      );
      
      const content = await generator.generateClaudeCommandContent();
      
      assert.ok(content.includes('Custom system instructions'), 'Should include system content');
      assert.ok(content.includes('Custom commands reference'), 'Should include commands content');
    });
  });

  describe('Utility Methods', () => {
    test('should check file existence correctly', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      const existsTrue = await generator.exists('package.json');
      const existsFalse = await generator.exists('non-existent-file.txt');
      
      assert.strictEqual(existsTrue, true, 'Should detect existing file');
      assert.strictEqual(existsFalse, false, 'Should detect non-existing file');
    });

    test('should read package.json correctly', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      const packageJson = await generator.readPackageJson();
      
      assert.ok(packageJson, 'Should read package.json');
      assert.strictEqual(packageJson.name, 'mock-repository', 'Should parse package.json correctly');
    });

    test('should return null for missing package.json', async () => {
      // Don't create any package.json - just ensure testEnv.testDir exists but is empty
      // (testEnv already creates an empty directory for us)
      
      const packageJson = await generator.readPackageJson();
      
      assert.strictEqual(packageJson, null, 'Should return null for missing package.json');
    });

    test('should ensure directory creation', async () => {
      await createMockRepository(testEnv.testDir, 'empty');
      
      await generator.ensureDir('new/nested/directory');
      
      await assertDirectoryExists(require('path').join(testEnv.testDir, 'new', 'nested', 'directory'));
    });

    test('should handle existing directory in ensureDir', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      await generator.ensureDir('existing-dir');
      
      // Should not throw when directory already exists
      await generator.ensureDir('existing-dir');
      
      await assertDirectoryExists(require('path').join(testEnv.testDir, 'existing-dir'));
    });

    test('should read DocuMind files with warning for missing files', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      const content = await generator.readDocuMindFile('non-existent.md');
      
      assert.strictEqual(content, null, 'Should return null for missing file');
    });

    test('should read DocuMind files successfully when they exist', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      await generator.ensureDir('.documind');
      await require('fs').promises.writeFile(
        require('path').join(testEnv.testDir, '.documind', 'test.md'),
        'Test content for DocuMind file'
      );
      
      const content = await generator.readDocuMindFile('test.md');
      
      assert.strictEqual(content, 'Test content for DocuMind file', 'Should read file content correctly');
    });
  });

  describe('Integration Testing', () => {
    test('should generate commands for all detected tools', async () => {
      await createMockRepositoryWithAITools(testEnv.testDir, 'all_tools');
      
      const tools = await generator.detectAITools();
      
      // Generate commands for all detected tools
      const results = await Promise.all(
        tools.map(tool => generator.generateCommandsForTool(tool))
      );
      
      // All should succeed
      assert.ok(results.every(result => result === true), 'All command generations should succeed');
      
      // Claude should have created its command file
      await assertFileExists(require('path').join(testEnv.testDir, '.claude', 'commands', 'document.md'));
    });

    test('should handle mixed success and failure scenarios', async () => {
      await createMockRepository(testEnv.testDir, 'nodejs');
      
      const tools = ['claude', 'unknown-tool', 'cursor'];
      const results = await Promise.all(
        tools.map(tool => generator.generateCommandsForTool(tool))
      );
      
      assert.strictEqual(results[0], true, 'Claude should succeed');
      assert.strictEqual(results[1], false, 'Unknown tool should fail');
      assert.strictEqual(results[2], true, 'Cursor should succeed');
    });
  });
});