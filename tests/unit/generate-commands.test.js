#!/usr/bin/env node

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import CommandGenerator from '../../src/scripts/generate-commands.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CommandGenerator', () => {
  let generator;
  let originalConsoleLog;
  let originalConsoleWarn;
  let originalConsoleError;
  let mockConsoleOutput;
  let mockConsoleWarnings;
  let mockConsoleErrors;

  beforeEach(() => {
    generator = new CommandGenerator();
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    
    mockConsoleOutput = [];
    mockConsoleWarnings = [];
    mockConsoleErrors = [];
    
    // Mock console methods
    console.log = (...args) => mockConsoleOutput.push(args.join(' '));
    console.warn = (...args) => mockConsoleWarnings.push(args.join(' '));
    console.error = (...args) => mockConsoleErrors.push(args.join(' '));
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe('constructor', () => {
    it('should initialize with proper paths', () => {
      assert.ok(generator.repoRoot);
      assert.ok(generator.documindDir);
      assert.ok(generator.documindDir.endsWith('.documind'));
      assert.ok(path.isAbsolute(generator.repoRoot));
    });

    it('should use process.cwd() for repo root', () => {
      const expectedRoot = process.cwd() || path.resolve('.');
      assert.strictEqual(generator.repoRoot, expectedRoot);
    });

    it('should construct documind directory path correctly', () => {
      const expectedDocumindDir = path.join(generator.repoRoot, '.documind');
      assert.strictEqual(generator.documindDir, expectedDocumindDir);
    });
  });

  describe('generateCommandsForTool', () => {
    beforeEach(() => {
      // Mock the generator methods
      generator.generateClaudeCommands = mock.fn(() => Promise.resolve());
      generator.generateCursorCommands = mock.fn(() => Promise.resolve());
      generator.generateCopilotCommands = mock.fn(() => Promise.resolve());
      generator.generateGeminiCommands = mock.fn(() => Promise.resolve());
    });

    it('should generate commands for claude', async () => {
      const result = await generator.generateCommandsForTool('claude');
      assert.strictEqual(result, true);
      assert.strictEqual(generator.generateClaudeCommands.mock.calls.length, 1);
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✓ Generated claude commands')));
    });

    it('should generate commands for cursor', async () => {
      const result = await generator.generateCommandsForTool('cursor');
      assert.strictEqual(result, true);
      assert.strictEqual(generator.generateCursorCommands.mock.calls.length, 1);
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✓ Generated cursor commands')));
    });

    it('should generate commands for copilot', async () => {
      const result = await generator.generateCommandsForTool('copilot');
      assert.strictEqual(result, true);
      assert.strictEqual(generator.generateCopilotCommands.mock.calls.length, 1);
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✓ Generated copilot commands')));
    });

    it('should generate commands for gemini', async () => {
      const result = await generator.generateCommandsForTool('gemini');
      assert.strictEqual(result, true);
      assert.strictEqual(generator.generateGeminiCommands.mock.calls.length, 1);
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✓ Generated gemini commands')));
    });

    it('should return false for unknown tools', async () => {
      const result = await generator.generateCommandsForTool('unknown');
      assert.strictEqual(result, false);
      assert.ok(mockConsoleWarnings.some(msg => msg.includes('⚠️  Unknown tool: unknown')));
    });

    it('should handle case sensitivity', async () => {
      const result = await generator.generateCommandsForTool('CLAUDE');
      assert.strictEqual(result, false);
      assert.ok(mockConsoleWarnings.some(msg => msg.includes('⚠️  Unknown tool: CLAUDE')));
    });
  });

  describe('generateClaudeCommands', () => {
    let originalWriteFile;

    beforeEach(() => {
      generator.ensureDir = mock.fn(() => Promise.resolve());
      generator.readCommandTemplate = mock.fn(() => Promise.resolve('mock command content'));
      originalWriteFile = fs.writeFile;
      fs.writeFile = mock.fn(() => Promise.resolve());
    });

    afterEach(() => {
      // Restore fs.writeFile
      fs.writeFile = originalWriteFile;
    });

    it('should ensure .claude/commands directory exists', async () => {
      await generator.generateClaudeCommands();
      assert.strictEqual(generator.ensureDir.mock.calls.length, 1);
      assert.strictEqual(generator.ensureDir.mock.calls[0].arguments[0], '.claude/commands');
    });

    it('should read command template', async () => {
      await generator.generateClaudeCommands();
      assert.strictEqual(generator.readCommandTemplate.mock.calls.length, 1);
    });

    it('should write document.md file', async () => {
      await generator.generateClaudeCommands();
      assert.strictEqual(fs.writeFile.mock.calls.length, 1);
      
      const filePath = fs.writeFile.mock.calls[0].arguments[0];
      const content = fs.writeFile.mock.calls[0].arguments[1];
      assert.ok(filePath.endsWith('document.md'));
      assert.ok(filePath.includes('.claude/commands'));
      assert.strictEqual(content, 'mock command content');
    });
  });

  describe('generateCursorCommands', () => {
    it('should log information about cursor rules', async () => {
      await generator.generateCursorCommands();
      assert.ok(mockConsoleOutput.some(msg => msg.includes('Cursor uses .cursorrules')));
    });

    it('should not throw errors', async () => {
      await assert.doesNotReject(() => generator.generateCursorCommands());
    });
  });

  describe('generateCopilotCommands', () => {
    it('should log information about copilot instructions', async () => {
      await generator.generateCopilotCommands();
      assert.ok(mockConsoleOutput.some(msg => msg.includes('GitHub Copilot uses .github/copilot-instructions.md')));
    });

    it('should not throw errors', async () => {
      await assert.doesNotReject(() => generator.generateCopilotCommands());
    });
  });

  describe('generateGeminiCommands', () => {
    it('should log information about gemini configuration', async () => {
      await generator.generateGeminiCommands();
      assert.ok(mockConsoleOutput.some(msg => msg.includes('Gemini CLI uses GEMINI.md')));
    });

    it('should not throw errors', async () => {
      await assert.doesNotReject(() => generator.generateGeminiCommands());
    });
  });

  describe('readCommandTemplate', () => {
    let originalReadFile;

    beforeEach(() => {
      generator.generateClaudeCommandContent = mock.fn(() => Promise.resolve('fallback content'));
      originalReadFile = fs.readFile;
    });

    afterEach(() => {
      // Restore fs.readFile
      fs.readFile = originalReadFile;
    });

    it('should read template file when it exists', async () => {
      fs.readFile = mock.fn(() => Promise.resolve('template content'));
      
      const result = await generator.readCommandTemplate();
      assert.strictEqual(result, 'template content');
      assert.strictEqual(fs.readFile.mock.calls.length, 1);
      
      const filePath = fs.readFile.mock.calls[0].arguments[0];
      assert.ok(filePath.includes('claude-command.md'));
    });

    it('should fallback to generated content when template file does not exist', async () => {
      fs.readFile = mock.fn(() => Promise.reject(new Error('File not found')));
      
      const result = await generator.readCommandTemplate();
      assert.strictEqual(result, 'fallback content');
      assert.strictEqual(generator.generateClaudeCommandContent.mock.calls.length, 1);
    });

    it('should use correct template path', async () => {
      fs.readFile = mock.fn(() => Promise.resolve('template content'));
      
      await generator.readCommandTemplate();
      
      const filePath = fs.readFile.mock.calls[0].arguments[0];
      const expectedPath = path.join(generator.documindDir, 'templates', 'claude-command.md');
      assert.strictEqual(filePath, expectedPath);
    });
  });

  describe('generateClaudeCommandContent', () => {
    beforeEach(() => {
      generator.readDocuMindFile = mock.fn((filename) => {
        if (filename === 'system.md') return Promise.resolve('system content');
        if (filename === 'commands.md') return Promise.resolve('commands content');
        return Promise.resolve(null);
      });
    });

    it('should read system and commands files', async () => {
      await generator.generateClaudeCommandContent();
      assert.strictEqual(generator.readDocuMindFile.mock.calls.length, 2);
      assert.deepStrictEqual(generator.readDocuMindFile.mock.calls[0].arguments, ['system.md']);
      assert.deepStrictEqual(generator.readDocuMindFile.mock.calls[1].arguments, ['commands.md']);
    });

    it('should generate content with proper structure', async () => {
      const result = await generator.generateClaudeCommandContent();
      
      assert.ok(typeof result === 'string');
      assert.ok(result.includes('Intelligent documentation command processor'));
      assert.ok(result.includes('/document bootstrap'));
      assert.ok(result.includes('/document expand'));
      assert.ok(result.includes('/document update'));
      assert.ok(result.includes('/document analyze'));
      assert.ok(result.includes('/document index'));
      assert.ok(result.includes('/document search'));
    });

    it('should include system content when available', async () => {
      const result = await generator.generateClaudeCommandContent();
      assert.ok(result.includes('system content'));
    });

    it('should include commands content when available', async () => {
      const result = await generator.generateClaudeCommandContent();
      assert.ok(result.includes('commands content'));
    });

    it('should handle missing system content gracefully', async () => {
      generator.readDocuMindFile = mock.fn((filename) => {
        if (filename === 'system.md') return Promise.resolve(null);
        if (filename === 'commands.md') return Promise.resolve('commands content');
        return Promise.resolve(null);
      });

      const result = await generator.generateClaudeCommandContent();
      assert.ok(result.includes('Follow standard DocuMind principles'));
      assert.ok(result.includes('commands content'));
    });

    it('should handle missing commands content gracefully', async () => {
      generator.readDocuMindFile = mock.fn((filename) => {
        if (filename === 'system.md') return Promise.resolve('system content');
        if (filename === 'commands.md') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const result = await generator.generateClaudeCommandContent();
      assert.ok(result.includes('system content'));
      assert.ok(result.includes('See .documind/commands.md'));
    });

    it('should include example commands', async () => {
      const result = await generator.generateClaudeCommandContent();
      assert.ok(result.includes("let's update the docs about the database"));
      assert.ok(result.includes('walk me through an API request'));
      assert.ok(result.includes('how do we handle user authentication'));
    });

    it('should include processing logic', async () => {
      const result = await generator.generateClaudeCommandContent();
      assert.ok(result.includes('Processing Logic'));
      assert.ok(result.includes('Parse Arguments'));
      assert.ok(result.includes('Interactive Mode'));
      assert.ok(result.includes('Free-Form Request Processing'));
    });
  });

  describe('readDocuMindFile', () => {
    let originalReadFile;

    beforeEach(() => {
      originalReadFile = fs.readFile;
    });

    afterEach(() => {
      // Restore fs.readFile
      fs.readFile = originalReadFile;
    });

    it('should read file when it exists', async () => {
      fs.readFile = mock.fn(() => Promise.resolve('file content'));
      
      const result = await generator.readDocuMindFile('test.md');
      assert.strictEqual(result, 'file content');
      assert.strictEqual(fs.readFile.mock.calls.length, 1);
      
      const filePath = fs.readFile.mock.calls[0].arguments[0];
      const expectedPath = path.join(generator.documindDir, 'core', 'test.md');
      assert.strictEqual(filePath, expectedPath);
    });

    it('should return null and warn when file does not exist', async () => {
      fs.readFile = mock.fn(() => Promise.reject(new Error('File not found')));
      
      const result = await generator.readDocuMindFile('missing.md');
      assert.strictEqual(result, null);
      assert.ok(mockConsoleWarnings.some(msg => msg.includes('Warning: Could not read missing.md')));
    });

    it('should use utf8 encoding', async () => {
      fs.readFile = mock.fn(() => Promise.resolve('file content'));
      
      await generator.readDocuMindFile('test.md');
      
      const encoding = fs.readFile.mock.calls[0].arguments[1];
      assert.strictEqual(encoding, 'utf8');
    });
  });

  describe('ensureDir', () => {
    let originalMkdir;

    beforeEach(() => {
      originalMkdir = fs.mkdir;
    });

    afterEach(() => {
      // Restore fs.mkdir
      fs.mkdir = originalMkdir;
    });

    it('should create directory recursively', async () => {
      fs.mkdir = mock.fn(() => Promise.resolve());
      
      await generator.ensureDir('test/nested/dir');
      assert.strictEqual(fs.mkdir.mock.calls.length, 1);
      
      const dirPath = fs.mkdir.mock.calls[0].arguments[0];
      const options = fs.mkdir.mock.calls[0].arguments[1];
      assert.ok(dirPath.includes('test/nested/dir'));
      assert.strictEqual(options.recursive, true);
    });

    it('should handle existing directory gracefully', async () => {
      const existsError = new Error('Directory exists');
      existsError.code = 'EEXIST';
      fs.mkdir = mock.fn(() => Promise.reject(existsError));
      
      await assert.doesNotReject(() => generator.ensureDir('existing/dir'));
    });

    it('should throw non-EEXIST errors', async () => {
      const otherError = new Error('Permission denied');
      otherError.code = 'EACCES';
      fs.mkdir = mock.fn(() => Promise.reject(otherError));
      
      await assert.rejects(() => generator.ensureDir('test/dir'), /Permission denied/);
    });

    it('should resolve relative to repo root', async () => {
      fs.mkdir = mock.fn(() => Promise.resolve());
      
      await generator.ensureDir('relative/path');
      
      const dirPath = fs.mkdir.mock.calls[0].arguments[0];
      const expectedPath = path.join(generator.repoRoot, 'relative/path');
      assert.strictEqual(dirPath, expectedPath);
    });
  });

  describe('detectAITools', () => {
    beforeEach(() => {
      generator.readPackageJson = mock.fn(() => Promise.resolve(null));
    });

    it('should detect copilot when .github exists', async () => {
      generator.exists = mock.fn((filePath) => {
        return Promise.resolve(filePath === '.github');
      });

      const tools = await generator.detectAITools();
      assert.ok(tools.includes('copilot'));
    });

    it('should detect cursor when .cursor exists', async () => {
      generator.exists = mock.fn((filePath) => {
        return Promise.resolve(filePath === '.cursor');
      });

      const tools = await generator.detectAITools();
      assert.ok(tools.includes('cursor'));
    });

    it('should detect cursor when .cursorrules exists', async () => {
      generator.exists = mock.fn((filePath) => {
        return Promise.resolve(filePath === '.cursorrules');
      });

      const tools = await generator.detectAITools();
      assert.ok(tools.includes('cursor'));
    });

    it('should detect claude when CLAUDE.md exists', async () => {
      generator.exists = mock.fn((filePath) => {
        return Promise.resolve(filePath === 'CLAUDE.md');
      });

      const tools = await generator.detectAITools();
      assert.ok(tools.includes('claude'));
    });

    it('should detect gemini from package.json scripts', async () => {
      generator.exists = mock.fn(() => Promise.resolve(false));
      generator.readPackageJson = mock.fn(() => Promise.resolve({
        scripts: {
          'ai': 'gemini chat',
          'test': 'node test.js'
        }
      }));

      const tools = await generator.detectAITools();
      assert.ok(tools.includes('gemini'));
    });

    it('should return default tools when none detected', async () => {
      generator.exists = mock.fn(() => Promise.resolve(false));
      generator.readPackageJson = mock.fn(() => Promise.resolve(null));

      const tools = await generator.detectAITools();
      assert.ok(tools.includes('claude'));
      assert.ok(tools.includes('cursor'));
      assert.ok(tools.includes('copilot'));
      assert.ok(tools.includes('gemini'));
    });

    it('should return unique tools only', async () => {
      generator.exists = mock.fn(() => Promise.resolve(true)); // All files exist
      generator.readPackageJson = mock.fn(() => Promise.resolve({
        scripts: { 'ai': 'gemini chat' }
      }));

      const tools = await generator.detectAITools();
      const uniqueTools = [...new Set(tools)];
      assert.strictEqual(tools.length, uniqueTools.length);
    });

    it('should handle package.json without scripts', async () => {
      generator.exists = mock.fn(() => Promise.resolve(false));
      generator.readPackageJson = mock.fn(() => Promise.resolve({ name: 'test' }));

      const tools = await generator.detectAITools();
      assert.ok(Array.isArray(tools));
      assert.ok(tools.length > 0);
    });
  });

  describe('exists', () => {
    let originalAccess;

    beforeEach(() => {
      originalAccess = fs.access;
    });

    afterEach(() => {
      // Restore fs.access
      fs.access = originalAccess;
    });

    it('should return true for existing files', async () => {
      fs.access = mock.fn(() => Promise.resolve());
      
      const result = await generator.exists('existing/file');
      assert.strictEqual(result, true);
      
      const filePath = fs.access.mock.calls[0].arguments[0];
      const expectedPath = path.join(generator.repoRoot, 'existing/file');
      assert.strictEqual(filePath, expectedPath);
    });

    it('should return false for non-existing files', async () => {
      fs.access = mock.fn(() => Promise.reject(new Error('File not found')));
      
      const result = await generator.exists('missing/file');
      assert.strictEqual(result, false);
    });

    it('should resolve path relative to repo root', async () => {
      fs.access = mock.fn(() => Promise.resolve());
      
      await generator.exists('relative/path');
      
      const filePath = fs.access.mock.calls[0].arguments[0];
      const expectedPath = path.join(generator.repoRoot, 'relative/path');
      assert.strictEqual(filePath, expectedPath);
    });
  });

  describe('readPackageJson', () => {
    let originalReadFile;

    beforeEach(() => {
      originalReadFile = fs.readFile;
    });

    afterEach(() => {
      // Restore fs.readFile
      fs.readFile = originalReadFile;
    });

    it('should read and parse package.json', async () => {
      const packageData = { name: 'test-package', version: '1.0.0' };
      fs.readFile = mock.fn(() => Promise.resolve(JSON.stringify(packageData)));
      
      const result = await generator.readPackageJson();
      assert.deepStrictEqual(result, packageData);
      
      const filePath = fs.readFile.mock.calls[0].arguments[0];
      const expectedPath = path.join(generator.repoRoot, 'package.json');
      assert.strictEqual(filePath, expectedPath);
    });

    it('should return null for non-existing package.json', async () => {
      fs.readFile = mock.fn(() => Promise.reject(new Error('File not found')));
      
      const result = await generator.readPackageJson();
      assert.strictEqual(result, null);
    });

    it('should return null for invalid JSON', async () => {
      fs.readFile = mock.fn(() => Promise.resolve('invalid json'));
      
      const result = await generator.readPackageJson();
      assert.strictEqual(result, null);
    });

    it('should use utf8 encoding', async () => {
      fs.readFile = mock.fn(() => Promise.resolve('{}'));
      
      await generator.readPackageJson();
      
      const encoding = fs.readFile.mock.calls[0].arguments[1];
      assert.strictEqual(encoding, 'utf8');
    });
  });
});