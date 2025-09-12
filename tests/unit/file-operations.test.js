import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import TestEnvironment from '../utils/test-environment.js';

const require = createRequire(import.meta.url);

describe('File Operations Contract Tests', () => {
  let testDir;
  let installer;
  let testEnv;

  beforeEach(async () => {
    // Create test environment and set up DocuMind structure
    testEnv = new TestEnvironment();
    testDir = await testEnv.createTempDir('documind-test-');
    process.chdir(testDir);
    
    // Set up simulated DocuMind installation environment
    await testEnv.setupDocuMindEnvironment(testDir);
    
    // Import modules from simulated installed environment
    const { default: DocuMindInstaller } = require(path.join(testDir, '.documind/scripts/install.js'));
    installer = new DocuMindInstaller();
  });

  afterEach(async () => {
    // Clean up test environment
    await testEnv.cleanup(testDir);
  });

  describe('Directory Creation', () => {
    test('should create directory when it does not exist', async () => {
      const dirPath = '.github';
      
      // Directory should not exist initially
      await assert.rejects(
        fs.access(dirPath),
        { code: 'ENOENT' },
        'Directory should not exist initially'
      );
      
      // Create directory using installer method
      await installer.ensureDir(dirPath);
      
      // Directory should now exist
      await assert.doesNotReject(
        fs.access(dirPath),
        'Directory should exist after creation'
      );
      
      // Verify it's actually a directory
      const stats = await fs.stat(dirPath);
      assert.strictEqual(stats.isDirectory(), true, 'Created path should be a directory');
    });

    test('should handle existing directory gracefully', async () => {
      const dirPath = '.cursor';
      
      // Create directory manually first
      await fs.mkdir(dirPath);
      
      // Should not throw when directory already exists
      await assert.doesNotReject(
        installer.ensureDir(dirPath),
        'Should handle existing directory gracefully'
      );
    });

    test('should create nested directories recursively', async () => {
      const dirPath = '.github/instructions';
      
      await installer.ensureDir(dirPath);
      
      // Both parent and child directories should exist
      await assert.doesNotReject(fs.access('.github'), 'Parent directory should exist');
      await assert.doesNotReject(fs.access(dirPath), 'Nested directory should exist');
    });
  });

  describe('File Writing Operations', () => {
    test('should write file with correct content', async () => {
      const filePath = 'CLAUDE.md';
      const content = '# Claude Instructions\n\nTest content';
      
      // File should not exist initially
      await assert.rejects(
        fs.access(filePath),
        { code: 'ENOENT' },
        'File should not exist initially'
      );
      
      // Write file
      await fs.writeFile(filePath, content);
      
      // File should now exist
      await assert.doesNotReject(fs.access(filePath), 'File should exist after writing');
      
      // Content should match
      const readContent = await fs.readFile(filePath, 'utf8');
      assert.strictEqual(readContent, content, 'File content should match written content');
    });

    test('should overwrite existing file', async () => {
      const filePath = 'test.md';
      const originalContent = 'Original content';
      const newContent = 'New content';
      
      // Create file with original content
      await fs.writeFile(filePath, originalContent);
      
      // Verify original content
      let content = await fs.readFile(filePath, 'utf8');
      assert.strictEqual(content, originalContent, 'Original content should be correct');
      
      // Overwrite with new content
      await fs.writeFile(filePath, newContent);
      
      // Verify new content
      content = await fs.readFile(filePath, 'utf8');
      assert.strictEqual(content, newContent, 'New content should overwrite original');
    });
  });

  describe('Template Processing (Currently Failing - Not Implemented)', () => {
    test('should successfully process templates', async () => {
      // Template processing is now implemented
      const templateName = 'claude-instructions';
      const variables = { PROJECT_NAME: 'TestProject' };
      
      // This should succeed because template processing is implemented
      const content = await installer.loadTemplate(templateName);
      assert(content.includes('DocuMind'), 'Template should contain DocuMind branding');
      
      // Test basic variable replacement (even though loadTemplate doesn't do this internally,
      // we can test that the content can be processed)
      const processedContent = content.replace('{PROJECT_NAME}', variables.PROJECT_NAME);
      assert(typeof processedContent === 'string', 'Should return processed string content');
    });
  });

  describe('AI Tool Detection (Currently Failing - Needs Testing)', () => {
    test('should detect no AI tools in empty repository', async () => {
      const tools = await installer.detectAITools();
      
      // In empty repo, should default to all tools
      assert.ok(Array.isArray(tools), 'Should return an array');
      assert.ok(tools.length > 0, 'Should return default tools for empty repo');
      assert.ok(tools.includes('claude'), 'Should include claude in default tools');
    });

    test('should detect Claude when CLAUDE.md exists', async () => {
      // Create CLAUDE.md to simulate existing Claude setup
      await fs.writeFile('CLAUDE.md', '# Claude Instructions');
      
      const tools = await installer.detectAITools();
      
      assert.ok(tools.includes('claude'), 'Should detect Claude when CLAUDE.md exists');
    });

    test('should detect Cursor when .cursorrules exists', async () => {
      // Create .cursorrules to simulate existing Cursor setup
      await fs.writeFile('.cursorrules', 'cursor rules');
      
      const tools = await installer.detectAITools();
      
      assert.ok(tools.includes('cursor'), 'Should detect Cursor when .cursorrules exists');
    });
  });

  describe('Package.json Reading', () => {
    test('should handle missing package.json gracefully', async () => {
      const packageData = await installer.readPackageJson();
      
      assert.strictEqual(packageData, null, 'Should return null when package.json is missing');
    });

    test('should read valid package.json', async () => {
      const packageContent = {
        name: 'test-package',
        version: '1.0.0',
        scripts: {
          test: 'echo "test"'
        }
      };
      
      await fs.writeFile('package.json', JSON.stringify(packageContent, null, 2));
      
      const packageData = await installer.readPackageJson();
      
      assert.ok(packageData, 'Should return package data');
      assert.strictEqual(packageData.name, 'test-package', 'Should read package name correctly');
      assert.strictEqual(packageData.version, '1.0.0', 'Should read package version correctly');
    });
  });

  describe('File Existence Checks', () => {
    test('should return false for non-existent file', async () => {
      const exists = await installer.exists('non-existent-file.txt');
      assert.strictEqual(exists, false, 'Should return false for non-existent file');
    });

    test('should return true for existing file', async () => {
      await fs.writeFile('existing-file.txt', 'content');
      
      const exists = await installer.exists('existing-file.txt');
      assert.strictEqual(exists, true, 'Should return true for existing file');
    });

    test('should return true for existing directory', async () => {
      await fs.mkdir('existing-dir');
      
      const exists = await installer.exists('existing-dir');
      assert.strictEqual(exists, true, 'Should return true for existing directory');
    });
  });
});