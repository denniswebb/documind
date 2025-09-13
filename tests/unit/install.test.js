#!/usr/bin/env node

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import DocuMindCLI from '../../install.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DocuMindCLI', () => {
  let cli;
  let originalProcessArgv;
  let originalProcessExit;
  let originalConsoleLog;
  let originalConsoleError;
  let mockConsoleOutput;
  let mockConsoleErrors;

  beforeEach(() => {
    cli = new DocuMindCLI();
    originalProcessArgv = process.argv;
    originalProcessExit = process.exit;
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    
    mockConsoleOutput = [];
    mockConsoleErrors = [];
    
    // Mock console methods
    console.log = (...args) => mockConsoleOutput.push(args.join(' '));
    console.error = (...args) => mockConsoleErrors.push(args.join(' '));
    
    // Mock process.exit
    process.exit = mock.fn(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    process.argv = originalProcessArgv;
    process.exit = originalProcessExit;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('constructor', () => {
    it('should initialize with proper colors and commands', () => {
      assert.ok(cli.colors);
      assert.ok(cli.commands);
      assert.strictEqual(typeof cli.colors.reset, 'string');
      assert.strictEqual(typeof cli.colors.neonPink, 'string');
      assert.strictEqual(typeof cli.commands.init, 'function');
      assert.strictEqual(typeof cli.commands.update, 'function');
      assert.strictEqual(typeof cli.commands.help, 'function');
    });

    it('should have all required commands', () => {
      const expectedCommands = ['init', 'update', 'register', 'install-publish-workflow', 'help', 'version', '--version', '-v', '--help', '-h'];
      expectedCommands.forEach(cmd => {
        assert.ok(cli.commands[cmd], `Missing command: ${cmd}`);
      });
    });
  });

  describe('parseInitArgs', () => {
    it('should parse empty args with defaults', () => {
      const result = cli.parseInitArgs([]);
      assert.strictEqual(result.targetDir, '.');
      assert.deepStrictEqual(result.sourceOptions, {});
      assert.strictEqual(result.debug, false);
    });

    it('should parse target directory', () => {
      const result = cli.parseInitArgs(['./my-project']);
      assert.strictEqual(result.targetDir, './my-project');
    });

    it('should parse --local option', () => {
      const result = cli.parseInitArgs(['--local', '/path/to/source', './target']);
      assert.strictEqual(result.sourceOptions.type, 'local');
      assert.strictEqual(result.sourceOptions.path, '/path/to/source');
      assert.strictEqual(result.targetDir, './target');
    });

    it('should parse --git option', () => {
      const result = cli.parseInitArgs(['--git', 'main', './target']);
      assert.strictEqual(result.sourceOptions.type, 'git');
      assert.strictEqual(result.sourceOptions.ref, 'main');
    });

    it('should parse --release option', () => {
      const result = cli.parseInitArgs(['--release', 'v1.0.0', './target']);
      assert.strictEqual(result.sourceOptions.type, 'release');
      assert.strictEqual(result.sourceOptions.version, 'v1.0.0');
    });

    it('should parse --debug option', () => {
      const result = cli.parseInitArgs(['--debug']);
      assert.strictEqual(result.debug, true);
    });

    it('should parse --verbose option', () => {
      const result = cli.parseInitArgs(['--verbose']);
      assert.strictEqual(result.debug, true);
    });

    it('should handle multiple options', () => {
      const result = cli.parseInitArgs(['--local', '/source', '--debug', './target']);
      assert.strictEqual(result.sourceOptions.type, 'local');
      assert.strictEqual(result.sourceOptions.path, '/source');
      assert.strictEqual(result.debug, true);
      assert.strictEqual(result.targetDir, './target');
    });
  });

  describe('initInstaller', () => {
    it('should initialize installer properties', () => {
      cli.initInstaller('./test', { type: 'local' }, true);
      
      assert.ok(cli.targetDir.endsWith('test'));
      assert.ok(cli.documindDir.endsWith('.documind'));
      assert.deepStrictEqual(cli.sourceOptions, { type: 'local' });
      assert.strictEqual(cli.debug, true);
      assert.strictEqual(cli.srcDir, null);
    });

    it('should resolve target directory path', () => {
      cli.initInstaller('../test', {}, false);
      assert.ok(path.isAbsolute(cli.targetDir));
    });
  });

  describe('exists', () => {
    it('should return true for existing files', async () => {
      const result = await cli.exists(__filename);
      assert.strictEqual(result, true);
    });

    it('should return false for non-existing files', async () => {
      const result = await cli.exists('/non/existent/file.txt');
      assert.strictEqual(result, false);
    });
  });

  describe('showVaporwaveLogo', () => {
    it('should display the vaporwave logo', () => {
      cli.showVaporwaveLogo();
      assert.ok(mockConsoleOutput.length > 0);
      const logoOutput = mockConsoleOutput.join(' ');
      assert.ok(logoOutput.includes('DocuMind') || logoOutput.includes('◆'));
    });

    it('should use correct colors in logo', () => {
      cli.showVaporwaveLogo();
      const logoOutput = mockConsoleOutput.join('');
      assert.ok(logoOutput.includes(cli.colors.electricBlue));
      assert.ok(logoOutput.includes(cli.colors.neonPink));
      assert.ok(logoOutput.includes(cli.colors.neonCyan));
    });
  });

  describe('version', () => {
    it('should display version information', async () => {
      await cli.version();
      assert.ok(mockConsoleOutput.length > 0);
      assert.ok(mockConsoleOutput[0].includes('DocuMind'));
      assert.ok(mockConsoleOutput[0].includes('v'));
    });

    it('should handle missing package.json gracefully', async () => {
      // Mock fs.readFile to throw error
      const originalReadFile = fs.readFile;
      fs.readFile = mock.fn(() => Promise.reject(new Error('File not found')));
      
      await cli.version();
      assert.ok(mockConsoleOutput[0].includes('v1.0.0')); // fallback version
      
      fs.readFile = originalReadFile;
    });
  });

  describe('help', () => {
    it('should display help information', async () => {
      await cli.help();
      assert.ok(mockConsoleOutput.length > 0);
      const helpOutput = mockConsoleOutput.join(' ');
      assert.ok(helpOutput.includes('USAGE:'));
      assert.ok(helpOutput.includes('COMMANDS:'));
      assert.ok(helpOutput.includes('EXAMPLES:'));
      assert.ok(helpOutput.includes('documind init'));
    });

    it('should show vaporwave logo in help', async () => {
      await cli.help();
      const helpOutput = mockConsoleOutput.join(' ');
      assert.ok(helpOutput.includes('DocuMind'));
    });
  });

  describe('detectAITools', () => {
    beforeEach(() => {
      cli.initInstaller('.', {}, false);
    });

    it('should return default tools when none detected', async () => {
      // Mock exists to return false for all checks
      cli.exists = mock.fn(() => Promise.resolve(false));
      cli.readPackageJson = mock.fn(() => Promise.resolve(null));

      const tools = await cli.detectAITools();
      assert.ok(Array.isArray(tools));
      assert.ok(tools.includes('claude'));
      assert.ok(tools.includes('cursor'));
      assert.ok(tools.includes('copilot'));
      assert.ok(tools.includes('gemini'));
    });

    it('should detect existing AI tools', async () => {
      // Mock exists to return true for .github (copilot)
      cli.exists = mock.fn((path) => {
        if (path.includes('.github')) return Promise.resolve(true);
        return Promise.resolve(false);
      });
      cli.readPackageJson = mock.fn(() => Promise.resolve(null));

      const tools = await cli.detectAITools();
      assert.ok(tools.includes('copilot'));
    });

    it('should detect cursor tools', async () => {
      // Mock exists to return true for .cursorrules
      cli.exists = mock.fn((path) => {
        if (path.includes('.cursorrules')) return Promise.resolve(true);
        return Promise.resolve(false);
      });
      cli.readPackageJson = mock.fn(() => Promise.resolve(null));

      const tools = await cli.detectAITools();
      assert.ok(tools.includes('cursor'));
    });

    it('should detect claude tools', async () => {
      // Mock exists to return true for CLAUDE.md
      cli.exists = mock.fn((path) => {
        if (path.includes('CLAUDE.md')) return Promise.resolve(true);
        return Promise.resolve(false);
      });
      cli.readPackageJson = mock.fn(() => Promise.resolve(null));

      const tools = await cli.detectAITools();
      assert.ok(tools.includes('claude'));
    });

    it('should detect gemini from package.json scripts', async () => {
      cli.exists = mock.fn(() => Promise.resolve(false));
      cli.readPackageJson = mock.fn(() => Promise.resolve({
        scripts: {
          'ai': 'gemini chat',
          'test': 'node test.js'
        }
      }));

      const tools = await cli.detectAITools();
      assert.ok(tools.includes('gemini'));
    });

    it('should return unique tools only', async () => {
      cli.exists = mock.fn(() => Promise.resolve(true)); // All tools detected
      cli.readPackageJson = mock.fn(() => Promise.resolve({
        scripts: { 'ai': 'gemini chat' }
      }));

      const tools = await cli.detectAITools();
      const uniqueTools = [...new Set(tools)];
      assert.strictEqual(tools.length, uniqueTools.length);
    });
  });

  describe('readPackageJson', () => {
    beforeEach(() => {
      cli.initInstaller('.', {}, false);
    });

    it('should read and parse package.json', async () => {
      const result = await cli.readPackageJson();
      assert.ok(result);
      assert.strictEqual(result.name, '@documind/core');
      assert.strictEqual(result.type, 'module');
    });

    it('should return null for non-existent package.json', async () => {
      cli.targetDir = '/non/existent/directory';
      const result = await cli.readPackageJson();
      assert.strictEqual(result, null);
    });
  });

  describe('generateCommandsForTool', () => {
    beforeEach(() => {
      cli.initInstaller('.', {}, false);
      // Mock the generator methods
      cli.generateClaudeConfig = mock.fn(() => Promise.resolve());
      cli.generateCursorConfig = mock.fn(() => Promise.resolve());
      cli.generateCopilotConfig = mock.fn(() => Promise.resolve());
      cli.generateGeminiConfig = mock.fn(() => Promise.resolve());
    });

    it('should generate commands for claude', async () => {
      const result = await cli.generateCommandsForTool('claude');
      assert.strictEqual(result, true);
      assert.strictEqual(cli.generateClaudeConfig.mock.calls.length, 1);
    });

    it('should generate commands for cursor', async () => {
      const result = await cli.generateCommandsForTool('cursor');
      assert.strictEqual(result, true);
      assert.strictEqual(cli.generateCursorConfig.mock.calls.length, 1);
    });

    it('should generate commands for copilot', async () => {
      const result = await cli.generateCommandsForTool('copilot');
      assert.strictEqual(result, true);
      assert.strictEqual(cli.generateCopilotConfig.mock.calls.length, 1);
    });

    it('should generate commands for gemini', async () => {
      const result = await cli.generateCommandsForTool('gemini');
      assert.strictEqual(result, true);
      assert.strictEqual(cli.generateGeminiConfig.mock.calls.length, 1);
    });

    it('should return false for unknown tools', async () => {
      const result = await cli.generateCommandsForTool('unknown');
      assert.strictEqual(result, false);
    });
  });

  describe('extractDocuMindSection', () => {
    it('should return proper DocuMind section content', () => {
      const template = 'some template content';
      const result = cli.extractDocuMindSection(template);
      
      assert.ok(typeof result === 'string');
      assert.ok(result.includes('# DocuMind Integration'));
      assert.ok(result.includes('/document bootstrap'));
      assert.ok(result.includes('/document expand'));
      assert.ok(result.includes('/document update'));
    });

    it('should include all expected commands in section', () => {
      const result = cli.extractDocuMindSection('');
      assert.ok(result.includes('/document analyze'));
      assert.ok(result.includes('/document index'));
      assert.ok(result.includes('/document search'));
    });
  });

  describe('run', () => {
    it('should execute help command by default', async () => {
      process.argv = ['node', 'install.js'];
      const helpMock = mock.fn(() => Promise.resolve());
      cli.help = helpMock;
      cli.commands.help = helpMock;
      
      await cli.run();
      assert.strictEqual(helpMock.mock.calls.length, 1);
    });

    it('should execute specified command', async () => {
      process.argv = ['node', 'install.js', 'version'];
      const versionMock = mock.fn(() => Promise.resolve());
      cli.version = versionMock;
      cli.commands.version = versionMock;
      
      await cli.run();
      assert.strictEqual(versionMock.mock.calls.length, 1);
    });

    it('should handle unknown commands', async () => {
      process.argv = ['node', 'install.js', 'unknown'];
      
      try {
        await cli.run();
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'process.exit called');
      }
      
      assert.ok(mockConsoleErrors.some(msg => msg.includes('Unknown command: unknown')));
    });

    it('should handle command execution errors', async () => {
      process.argv = ['node', 'install.js', 'init'];
      const initMock = mock.fn(() => Promise.reject(new Error('Test error')));
      cli.init = initMock;
      cli.commands.init = initMock;
      
      try {
        await cli.run();
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'process.exit called');
      }
      
      assert.ok(mockConsoleErrors.some(msg => msg.includes('❌ Error: Test error')));
    });
  });

  describe('ensureDir', () => {
    it('should create directory recursively', async () => {
      const testDir = path.join(__dirname, '../../temp/test/nested/dir');
      
      // Clean up first
      try {
        await fs.rm(path.join(__dirname, '../../temp'), { recursive: true, force: true });
      } catch (error) {
        // Directory might not exist
      }
      
      await cli.ensureDir(testDir);
      
      const exists = await cli.exists(testDir);
      assert.strictEqual(exists, true);
      
      // Clean up
      await fs.rm(path.join(__dirname, '../../temp'), { recursive: true, force: true });
    });
  });

  describe('resolveDefaultSource', () => {
    it('should try development source first', async () => {
      cli.validateSourceStructure = mock.fn(() => Promise.resolve());
      
      const result = await cli.resolveDefaultSource();
      assert.ok(typeof result === 'string');
      assert.strictEqual(cli.validateSourceStructure.mock.calls.length, 1);
    });

    it('should fallback to release source when development fails', async () => {
      cli.validateSourceStructure = mock.fn(() => Promise.reject(new Error('Not found')));
      cli.resolveReleaseSource = mock.fn(() => Promise.resolve('/release/path'));
      
      const result = await cli.resolveDefaultSource();
      assert.strictEqual(result, '/release/path');
    });
  });

  describe('validateSourceStructure', () => {
    it('should validate existing source structure', async () => {
      const validPath = path.join(__dirname, '../../src');
      await assert.doesNotReject(() => cli.validateSourceStructure(validPath));
    });

    it('should reject invalid source structure', async () => {
      const invalidPath = '/non/existent/path';
      await assert.rejects(
        () => cli.validateSourceStructure(invalidPath),
        /Invalid source directory/
      );
    });
  });

  describe('resolveLocalSource', () => {
    it('should resolve and validate local source path', async () => {
      cli.validateSourceStructure = mock.fn(() => Promise.resolve());
      
      const result = await cli.resolveLocalSource('./src');
      assert.ok(path.isAbsolute(result));
      assert.ok(result.includes('src'));
      assert.strictEqual(cli.validateSourceStructure.mock.calls.length, 1);
    });

    it('should throw error when no local path provided', async () => {
      await assert.rejects(
        () => cli.resolveLocalSource(null),
        /Local source path is required/
      );
    });
  });

  describe('resolveGitSource', () => {
    it('should throw not implemented error', async () => {
      await assert.rejects(
        () => cli.resolveGitSource('main'),
        /Git source not yet implemented/
      );
    });
  });

  describe('resolveReleaseSource', () => {
    it('should throw not implemented error', async () => {
      await assert.rejects(
        () => cli.resolveReleaseSource('latest'),
        /Release source not yet implemented/
      );
    });
  });

  describe('resolveSource', () => {
    beforeEach(() => {
      cli.initInstaller('.', {}, false);
    });

    it('should resolve local source when type is local', async () => {
      cli.sourceOptions = { type: 'local', path: './src' };
      cli.resolveLocalSource = mock.fn(() => Promise.resolve('/local/path'));
      
      const result = await cli.resolveSource();
      assert.strictEqual(result, '/local/path');
      assert.strictEqual(cli.resolveLocalSource.mock.calls.length, 1);
    });

    it('should resolve git source when type is git', async () => {
      cli.sourceOptions = { type: 'git', ref: 'main' };
      cli.resolveGitSource = mock.fn(() => Promise.resolve('/git/path'));
      
      const result = await cli.resolveSource();
      assert.strictEqual(result, '/git/path');
      assert.strictEqual(cli.resolveGitSource.mock.calls.length, 1);
    });

    it('should resolve release source when type is release', async () => {
      cli.sourceOptions = { type: 'release', version: 'v1.0.0' };
      cli.resolveReleaseSource = mock.fn(() => Promise.resolve('/release/path'));
      
      const result = await cli.resolveSource();
      assert.strictEqual(result, '/release/path');
      assert.strictEqual(cli.resolveReleaseSource.mock.calls.length, 1);
    });

    it('should use default source resolution when no type specified', async () => {
      cli.sourceOptions = {};
      cli.resolveDefaultSource = mock.fn(() => Promise.resolve('/default/path'));
      
      const result = await cli.resolveSource();
      assert.strictEqual(result, '/default/path');
      assert.strictEqual(cli.resolveDefaultSource.mock.calls.length, 1);
    });

    it('should use default ref for git when none provided', async () => {
      cli.sourceOptions = { type: 'git' };
      cli.resolveGitSource = mock.fn(() => Promise.resolve('/git/path'));
      
      await cli.resolveSource();
      assert.deepStrictEqual(cli.resolveGitSource.mock.calls[0].arguments, ['main']);
    });

    it('should use default version for release when none provided', async () => {
      cli.sourceOptions = { type: 'release' };
      cli.resolveReleaseSource = mock.fn(() => Promise.resolve('/release/path'));
      
      await cli.resolveSource();
      assert.deepStrictEqual(cli.resolveReleaseSource.mock.calls[0].arguments, ['latest']);
    });
  });
});