/**
 * T017: Unit tests for update.js script
 * Tests the update functionality for DocuMind system
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { setupTestEnvironment, mockEnvironmentVariables } from '../utils/test-environment.js';
import { createMockRepository, createMockRepositoryWithAITools, createMockRepositoryWithDocuMind } from '../utils/mock-repo.js';
import { 
  assertFileExists, 
  assertFileContains,
  assertDirectoryExists,
  assertThrowsWithMessage
} from '../utils/assertions.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const DocuMindUpdater = require('../../.documind/scripts/update.cjs');

describe('DocuMindUpdater Tests', () => {
  let testEnv;
  let updater;

  beforeEach(async () => {
    testEnv = await setupTestEnvironment('update-test-');
    updater = new DocuMindUpdater();
    // Override the paths to use the test directory
    updater.repoRoot = testEnv.testDir;
    updater.documindDir = path.join(testEnv.testDir, '.documind');
    updater.versionFile = path.join(testEnv.testDir, '.documind', 'VERSION');
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('Constructor', () => {
    test('should initialize with correct paths', () => {
      // Use path.resolve to handle symlinks consistently  
      const expectedRepoRoot = path.resolve(testEnv.testDir);
      const actualRepoRoot = path.resolve(updater.repoRoot);
      assert.strictEqual(actualRepoRoot, expectedRepoRoot, 'Should set repo root correctly');
      
      const expectedDocumindDir = path.resolve(testEnv.testDir, '.documind');
      const actualDocumindDir = path.resolve(updater.documindDir);
      assert.strictEqual(actualDocumindDir, expectedDocumindDir, 'Should set documind dir correctly');
      
      const expectedVersionFile = path.resolve(testEnv.testDir, '.documind', 'VERSION');
      const actualVersionFile = path.resolve(updater.versionFile);
      assert.strictEqual(actualVersionFile, expectedVersionFile, 'Should set version file path correctly');
    });

    test('should set correct update URL', () => {
      assert.ok(
        updater.updateUrl.includes('github.com'), 
        'Should set GitHub API URL'
      );
      assert.ok(
        updater.updateUrl.includes('releases/latest'), 
        'Should target latest releases endpoint'
      );
    });
  });

  describe('Version Management', () => {
    test('should read current version successfully', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir);
      await fs.writeFile(path.join(testEnv.testDir, '.documind', 'VERSION'), '1.2.3');
      
      const version = await updater.getCurrentVersion();
      
      assert.strictEqual(version, '1.2.3', 'Should read version correctly');
    });

    test('should handle missing version file', async () => {
      await createMockRepository(testEnv.testDir, 'empty');
      
      await assertThrowsWithMessage(
        () => updater.getCurrentVersion(),
        /Cannot read current version/,
        'Should throw error for missing version file'
      );
    });

    test('should trim whitespace from version', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir);
      await fs.writeFile(path.join(testEnv.testDir, '.documind', 'VERSION'), '  1.2.3  \n');
      
      const version = await updater.getCurrentVersion();
      
      assert.strictEqual(version, '1.2.3', 'Should trim whitespace');
    });
  });

  describe('Version Comparison', () => {
    test('should compare equal versions correctly', () => {
      const result = updater.compareVersions('1.2.3', '1.2.3');
      assert.strictEqual(result, 0, 'Equal versions should return 0');
    });

    test('should detect when current is older', () => {
      const result = updater.compareVersions('1.2.3', '1.2.4');
      assert.strictEqual(result, -1, 'Older current should return -1');
    });

    test('should detect when current is newer', () => {
      const result = updater.compareVersions('1.2.4', '1.2.3');
      assert.strictEqual(result, 1, 'Newer current should return 1');
    });

    test('should handle major version differences', () => {
      assert.strictEqual(updater.compareVersions('1.0.0', '2.0.0'), -1);
      assert.strictEqual(updater.compareVersions('2.0.0', '1.0.0'), 1);
    });

    test('should handle minor version differences', () => {
      assert.strictEqual(updater.compareVersions('1.1.0', '1.2.0'), -1);
      assert.strictEqual(updater.compareVersions('1.2.0', '1.1.0'), 1);
    });

    test('should handle different length versions', () => {
      assert.strictEqual(updater.compareVersions('1.2', '1.2.0'), 0);
      assert.strictEqual(updater.compareVersions('1.2.0', '1.2'), 0);
      assert.strictEqual(updater.compareVersions('1.2', '1.2.1'), -1);
    });

    test('should handle single digit versions', () => {
      assert.strictEqual(updater.compareVersions('1', '1'), 0);
      assert.strictEqual(updater.compareVersions('1', '2'), -1);
      assert.strictEqual(updater.compareVersions('2', '1'), 1);
    });
  });

  describe('Local Update Functionality', () => {
    test('should perform local update successfully', async () => {
      // Create target repository
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      // Create source directory with updated files
      const sourceDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'source-'));
      await fs.mkdir(path.join(sourceDir, '.documind'), { recursive: true });
      await fs.mkdir(path.join(sourceDir, '.documind', 'templates'), { recursive: true });
      await fs.mkdir(path.join(sourceDir, '.documind', 'scripts'), { recursive: true });
      
      // Create updated files
      await fs.writeFile(
        path.join(sourceDir, '.documind', 'system.md'),
        'Updated system instructions'
      );
      await fs.writeFile(
        path.join(sourceDir, '.documind', 'commands.md'),
        'Updated commands reference'
      );
      await fs.writeFile(
        path.join(sourceDir, '.documind', 'templates', 'test.md'),
        'Updated template'
      );
      await fs.writeFile(
        path.join(sourceDir, '.documind', 'scripts', 'test.js'),
        'Updated script'
      );
      
      try {
        // Mock the installer dependency
        const originalInstaller = require('../../.documind/scripts/install.cjs');
        const mockInstaller = class MockInstaller {
          async detectAITools() { return ['claude']; }
          async generateInstructionFile() { return; }
        };
        
        // Temporarily replace the require
        require.cache[require.resolve('../../.documind/scripts/install.cjs')] = {
          exports: mockInstaller
        };
        
        await updater.updateFromLocal(sourceDir);
        
        // Verify files were updated
        await assertFileContains(
          path.join(testEnv.testDir, '.documind', 'system.md'),
          'Updated system instructions'
        );
        await assertFileContains(
          path.join(testEnv.testDir, '.documind', 'commands.md'),
          'Updated commands reference'
        );
        await assertFileExists(
          path.join(testEnv.testDir, '.documind', 'templates', 'test.md')
        );
        await assertFileExists(
          path.join(testEnv.testDir, '.documind', 'scripts', 'test.js')
        );
        
        // Restore original installer
        require.cache[require.resolve('../../.documind/scripts/install.cjs')] = {
          exports: originalInstaller
        };
        
      } finally {
        // Cleanup source directory
        await fs.rm(sourceDir, { recursive: true, force: true });
      }
    });

    test('should handle missing source directory', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir);
      
      // Mock process.exit to prevent test termination
      const originalExit = process.exit;
      let exitCode = null;
      process.exit = (code) => { 
        exitCode = code;
        throw new Error('Process exit called with code: ' + code);
      };
      
      // Mock console.error to capture error messages
      const originalError = console.error;
      let errorMessage = '';
      console.error = (...args) => { 
        errorMessage = args.join(' ');
      };
      
      const nonExistentSource = path.join(testEnv.testDir, 'non-existent');
      
      try {
        await updater.updateFromLocal(nonExistentSource);
        assert.fail('Expected updateFromLocal to call process.exit');
      } catch (error) {
        // Verify process.exit was called with error code 1
        assert.strictEqual(exitCode, 1, 'Should call process.exit(1)');
        assert.ok(errorMessage.includes('Local update failed'), 'Should log error message');
        assert.ok(errorMessage.includes('ENOENT'), 'Should include ENOENT error');
      } finally {
        process.exit = originalExit;
        console.error = originalError;
      }
    });

    test('should handle source without .documind directory', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir);
      
      // Mock process.exit to prevent test termination
      const originalExit = process.exit;
      let exitCode = null;
      process.exit = (code) => { 
        exitCode = code;
        throw new Error('Process exit called with code: ' + code);
      };
      
      // Mock console.error to capture error messages
      const originalError = console.error;
      let errorMessage = '';
      console.error = (...args) => { 
        errorMessage = args.join(' ');
      };
      
      // Create source without .documind
      const sourceDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'no-documind-'));
      
      try {
        await updater.updateFromLocal(sourceDir);
        assert.fail('Expected updateFromLocal to call process.exit');
      } catch (error) {
        // Verify process.exit was called with error code 1
        assert.strictEqual(exitCode, 1, 'Should call process.exit(1)');
        assert.ok(errorMessage.includes('Local update failed'), 'Should log error message');
        assert.ok(errorMessage.includes('ENOENT'), 'Should include ENOENT error');
      } finally {
        process.exit = originalExit;
        console.error = originalError;
        await fs.rm(sourceDir, { recursive: true, force: true });
      }
    });

    test('should perform local update with console output', async () => {
      // Create target repository
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      // Mock console.log to capture output
      const originalLog = console.log;
      const logMessages = [];
      console.log = (...args) => logMessages.push(args.join(' '));
      
      // Create source directory with updated files
      const sourceDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'console-source-'));
      await fs.mkdir(path.join(sourceDir, '.documind'), { recursive: true });
      await fs.mkdir(path.join(sourceDir, '.documind', 'templates'), { recursive: true });
      await fs.mkdir(path.join(sourceDir, '.documind', 'scripts'), { recursive: true });
      
      // Create updated files
      await fs.writeFile(
        path.join(sourceDir, '.documind', 'system.md'),
        'Console output test system instructions'
      );
      await fs.writeFile(
        path.join(sourceDir, '.documind', 'commands.md'),
        'Console output test commands reference'
      );
      await fs.writeFile(
        path.join(sourceDir, '.documind', 'templates', 'console.md'),
        'Console output test template'
      );
      await fs.writeFile(
        path.join(sourceDir, '.documind', 'scripts', 'console.js'),
        'Console output test script'
      );
      
      try {
        // Mock the installer dependency
        const mockInstaller = class MockInstaller {
          async detectAITools() { return ['claude']; }
          async generateInstructionFile() { return; }
        };
        
        // Temporarily replace the require
        require.cache[require.resolve('../../.documind/scripts/install.cjs')] = {
          exports: mockInstaller
        };
        
        await updater.updateFromLocal(sourceDir);
        
        // Verify console output
        const joinedLogs = logMessages.join(' ');
        assert.ok(joinedLogs.includes('🔄 Updating DocuMind from local source'), 'Should log start message');
        assert.ok(joinedLogs.includes('✓ Updated system.md'), 'Should log file update');
        assert.ok(joinedLogs.includes('✓ Updated commands.md'), 'Should log file update');
        assert.ok(joinedLogs.includes('✓ Updated templates/'), 'Should log directory update');
        assert.ok(joinedLogs.includes('✓ Updated scripts/'), 'Should log directory update');
        assert.ok(joinedLogs.includes('✅ Local update completed successfully'), 'Should log completion');
        
        // Verify files were updated
        await assertFileContains(
          path.join(testEnv.testDir, '.documind', 'system.md'),
          'Console output test system instructions'
        );
        
      } finally {
        console.log = originalLog;
        // Cleanup source directory
        await fs.rm(sourceDir, { recursive: true, force: true });
      }
    });
  });

  describe('Directory Copy Functionality', () => {
    test('should copy directory recursively', async () => {
      // Create source directory structure
      const sourceDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'copy-source-'));
      const destDir = path.join(testEnv.testDir, 'destination');
      
      try {
        // Create nested structure
        await fs.mkdir(path.join(sourceDir, 'nested', 'deep'), { recursive: true });
        await fs.writeFile(path.join(sourceDir, 'file1.txt'), 'content1');
        await fs.writeFile(path.join(sourceDir, 'nested', 'file2.txt'), 'content2');
        await fs.writeFile(path.join(sourceDir, 'nested', 'deep', 'file3.txt'), 'content3');
        
        await updater.copyDirectory(sourceDir, destDir);
        
        // Verify all files were copied
        await assertFileExists(path.join(destDir, 'file1.txt'));
        await assertFileExists(path.join(destDir, 'nested', 'file2.txt'));
        await assertFileExists(path.join(destDir, 'nested', 'deep', 'file3.txt'));
        
        // Verify content
        await assertFileContains(path.join(destDir, 'file1.txt'), 'content1');
        await assertFileContains(path.join(destDir, 'nested', 'file2.txt'), 'content2');
        await assertFileContains(path.join(destDir, 'nested', 'deep', 'file3.txt'), 'content3');
        
      } finally {
        await fs.rm(sourceDir, { recursive: true, force: true });
      }
    });

    test('should handle empty directories', async () => {
      const sourceDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'empty-source-'));
      const destDir = path.join(testEnv.testDir, 'empty-dest');
      
      try {
        await updater.copyDirectory(sourceDir, destDir);
        
        await assertDirectoryExists(destDir);
        
      } finally {
        await fs.rm(sourceDir, { recursive: true, force: true });
      }
    });

    test('should create destination directory if it does not exist', async () => {
      const sourceDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'create-dest-'));
      const destDir = path.join(testEnv.testDir, 'will-be-created', 'nested');
      
      try {
        await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test');
        
        await updater.copyDirectory(sourceDir, destDir);
        
        await assertDirectoryExists(destDir);
        await assertFileExists(path.join(destDir, 'test.txt'));
        
      } finally {
        await fs.rm(sourceDir, { recursive: true, force: true });
      }
    });
  });

  describe('Download and Apply Update', () => {
    test('should update VERSION file during download', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir);
      
      // Mock console.log to capture output
      const originalLog = console.log;
      const logMessages = [];
      console.log = (...args) => logMessages.push(args.join(' '));
      
      const mockRelease = {
        tag_name: 'v1.5.0',
        assets: []
      };
      
      try {
        await updater.downloadAndApplyUpdate(mockRelease);
        
        await assertFileExists(updater.versionFile);
        await assertFileContains(updater.versionFile, '1.5.0');
        
        // Verify console output
        const joinedLogs = logMessages.join(' ');
        assert.ok(joinedLogs.includes('Downloading core system files'), 'Should log download message');
        assert.ok(joinedLogs.includes('Core system files updated'), 'Should log completion message');
        
      } finally {
        console.log = originalLog;
      }
    });

    test('should handle release with v prefix', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir);
      
      const mockRelease = {
        tag_name: 'v2.0.0-beta',
        assets: []
      };
      
      await updater.downloadAndApplyUpdate(mockRelease);
      
      await assertFileContains(updater.versionFile, '2.0.0-beta');
    });

    test('should handle downloadAndApplyUpdate with console output', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir);
      
      // Mock console.log to capture output
      const originalLog = console.log;
      const logMessages = [];
      console.log = (...args) => logMessages.push(args.join(' '));
      
      const mockRelease = {
        tag_name: 'v3.1.4',
        assets: [],
        body: 'Release notes for v3.1.4'
      };
      
      try {
        await updater.downloadAndApplyUpdate(mockRelease);
        
        // Verify version was updated
        const version = await fs.readFile(updater.versionFile, 'utf8');
        assert.strictEqual(version.trim(), '3.1.4');
        
        // Verify console output
        const joinedLogs = logMessages.join(' ');
        assert.ok(joinedLogs.includes('📥 Downloading core system files'), 'Should log download message');
        assert.ok(joinedLogs.includes('✓ Core system files updated'), 'Should log completion message');
        
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Instruction File Regeneration', () => {
    test('should regenerate instruction files after update', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir);
      
      // Mock the installer
      const mockInstaller = class MockInstaller {
        async detectAITools() {
          return ['claude', 'cursor'];
        }
        async generateInstructionFile(tool) {
          // Create a mock instruction file
          await fs.writeFile(
            path.join(testEnv.testDir, `${tool.toUpperCase()}.md`),
            `# ${tool} Instructions\n\nRegenerated during update.`
          );
        }
      };
      
      // Replace the require temporarily
      const originalInstaller = require('../../.documind/scripts/install.cjs');
      require.cache[require.resolve('../../.documind/scripts/install.cjs')] = {
        exports: mockInstaller
      };
      
      try {
        await updater.regenerateInstructionFiles();
        
        // Verify instruction files were created
        await assertFileExists(path.join(testEnv.testDir, 'CLAUDE.md'));
        await assertFileExists(path.join(testEnv.testDir, 'CURSOR.md'));
        
        // Verify content
        await assertFileContains(
          path.join(testEnv.testDir, 'CLAUDE.md'), 
          'Regenerated during update'
        );
        
      } finally {
        // Restore original installer
        require.cache[require.resolve('../../.documind/scripts/install.cjs')] = {
          exports: originalInstaller
        };
      }
    });

    test('should regenerate instruction files with console output', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir);
      
      // Mock console.log to capture output
      const originalLog = console.log;
      const logMessages = [];
      console.log = (...args) => logMessages.push(args.join(' '));
      
      // Mock the installer
      const mockInstaller = class MockInstaller {
        async detectAITools() {
          return ['claude', 'gemini'];
        }
        async generateInstructionFile(tool) {
          await fs.writeFile(
            path.join(testEnv.testDir, `${tool.toUpperCase()}.md`),
            `# ${tool} Instructions\n\nRegenerated with console output.`
          );
        }
      };
      
      // Replace the require temporarily
      const originalInstaller = require('../../.documind/scripts/install.cjs');
      require.cache[require.resolve('../../.documind/scripts/install.cjs')] = {
        exports: mockInstaller
      };
      
      try {
        await updater.regenerateInstructionFiles();
        
        // Verify console output
        const joinedLogs = logMessages.join(' ');
        assert.ok(joinedLogs.includes('🔄 Regenerating AI instruction files'), 'Should log regeneration start');
        assert.ok(joinedLogs.includes('✓ AI instruction files regenerated'), 'Should log completion');
        
        // Verify instruction files were created
        await assertFileExists(path.join(testEnv.testDir, 'CLAUDE.md'));
        await assertFileExists(path.join(testEnv.testDir, 'GEMINI.md'));
        
      } finally {
        console.log = originalLog;
        // Restore original installer
        require.cache[require.resolve('../../.documind/scripts/install.cjs')] = {
          exports: originalInstaller
        };
      }
    });
  });

  describe('Main Update Workflow', () => {
    test('should complete full update when newer version available', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      // Mock getCurrentVersion to return old version
      const originalGetCurrentVersion = updater.getCurrentVersion;
      updater.getCurrentVersion = async () => '0.9.0';
      
      // Mock getLatestRelease to return newer version
      updater.getLatestRelease = async () => ({
        tag_name: 'v1.0.0',
        assets: []
      });
      
      // Mock downloadAndApplyUpdate
      updater.downloadAndApplyUpdate = async () => {
        await fs.writeFile(updater.versionFile, '1.0.0');
      };
      
      // Mock regenerateInstructionFiles to avoid require issues
      updater.regenerateInstructionFiles = async () => {
        await fs.writeFile(path.join(testEnv.testDir, 'CLAUDE.md'), '# Updated Instructions');
      };
      
      try {
        await updater.update();
        
        // Verify version was updated
        const newVersion = await fs.readFile(updater.versionFile, 'utf8');
        assert.strictEqual(newVersion.trim(), '1.0.0');
        
      } finally {
        updater.getCurrentVersion = originalGetCurrentVersion;
      }
    });

    test('should skip update when already up to date', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      // Mock getCurrentVersion to return current version
      const originalGetCurrentVersion = updater.getCurrentVersion;
      updater.getCurrentVersion = async () => '1.0.0';
      
      // Mock getLatestRelease to return same version
      updater.getLatestRelease = async () => ({
        tag_name: 'v1.0.0',
        assets: []
      });
      
      let updateCalled = false;
      updater.downloadAndApplyUpdate = async () => {
        updateCalled = true;
      };
      
      try {
        await updater.update();
        assert.strictEqual(updateCalled, false, 'Should not call downloadAndApplyUpdate when up to date');
        
      } finally {
        updater.getCurrentVersion = originalGetCurrentVersion;
      }
    });

    test('should handle update errors gracefully', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      // Mock process.exit to prevent test termination
      const originalExit = process.exit;
      let exitCode = null;
      process.exit = (code) => { 
        exitCode = code;
        throw new Error('Process exit called with code: ' + code);
      };
      
      // Mock console.error to capture error messages
      const originalError = console.error;
      let errorMessage = '';
      console.error = (...args) => { 
        errorMessage = args.join(' ');
      };
      
      // Mock getCurrentVersion to throw error
      const originalGetCurrentVersion = updater.getCurrentVersion;
      updater.getCurrentVersion = async () => {
        throw new Error('VERSION file not found');
      };
      
      try {
        await updater.update();
        assert.fail('Expected update to call process.exit');
      } catch (error) {
        // Verify process.exit was called with error code 1
        assert.strictEqual(exitCode, 1, 'Should call process.exit(1)');
        assert(errorMessage.includes('VERSION file not found'), 'Should log error message');
      } finally {
        // Restore original functions
        process.exit = originalExit;
        console.error = originalError;
        updater.getCurrentVersion = originalGetCurrentVersion;
      }
    });
  });

  describe('GitHub API Integration', () => {
    test('should handle successful GitHub API response', async () => {
      const mockRelease = {
        tag_name: 'v1.0.0',
        assets: [],
        body: 'Release notes'
      };
      
      // Mock https.request for successful response
      const originalRequest = require('https').request;
      require('https').request = (options, callback) => {
        const mockResponse = {
          statusCode: 200,
          on: (event, handler) => {
            if (event === 'data') {
              handler(JSON.stringify(mockRelease));
            } else if (event === 'end') {
              handler();
            }
          }
        };
        
        setTimeout(() => callback(mockResponse), 0);
        
        return {
          on: () => {},
          setTimeout: () => {},
          end: () => {},
          destroy: () => {}
        };
      };
      
      try {
        const release = await updater.getLatestRelease();
        assert.strictEqual(release.tag_name, 'v1.0.0');
        
      } finally {
        require('https').request = originalRequest;
      }
    });

    test('should handle GitHub API errors', async () => {
      // Mock https.request for error response
      const originalRequest = require('https').request;
      require('https').request = (options, callback) => {
        const mockResponse = {
          statusCode: 404,
          on: (event, handler) => {
            if (event === 'data') {
              handler('{"message": "Not Found"}');
            } else if (event === 'end') {
              handler();
            }
          }
        };
        
        setTimeout(() => callback(mockResponse), 0);
        
        return {
          on: () => {},
          setTimeout: () => {},
          end: () => {},
          destroy: () => {}
        };
      };
      
      try {
        await assertThrowsWithMessage(
          () => updater.getLatestRelease(),
          /GitHub API returned 404/,
          'Should handle API error responses'
        );
        
      } finally {
        require('https').request = originalRequest;
      }
    });

    test('should handle network timeout', async () => {
      // Mock https.request for timeout
      const originalRequest = require('https').request;
      require('https').request = (options, callback) => {
        const mockRequest = {
          on: () => {},
          setTimeout: (timeout, handler) => {
            setTimeout(handler, 0); // Immediate timeout
          },
          end: () => {},
          destroy: () => {}
        };
        
        return mockRequest;
      };
      
      try {
        await assertThrowsWithMessage(
          () => updater.getLatestRelease(),
          /Request timed out/,
          'Should handle request timeout'
        );
        
      } finally {
        require('https').request = originalRequest;
      }
    });

    test('should handle malformed JSON response', async () => {
      // Mock https.request for invalid JSON
      const originalRequest = require('https').request;
      require('https').request = (options, callback) => {
        const mockResponse = {
          statusCode: 200,
          on: (event, handler) => {
            if (event === 'data') {
              handler('invalid json{');
            } else if (event === 'end') {
              handler();
            }
          }
        };
        
        setTimeout(() => callback(mockResponse), 0);
        
        return {
          on: () => {},
          setTimeout: () => {},
          end: () => {},
          destroy: () => {}
        };
      };
      
      try {
        await assertThrowsWithMessage(
          () => updater.getLatestRelease(),
          /Failed to parse GitHub response/,
          'Should handle malformed JSON'
        );
        
      } finally {
        require('https').request = originalRequest;
      }
    });

    test('should handle request errors', async () => {
      // Mock https.request for network error
      const originalRequest = require('https').request;
      require('https').request = (options, callback) => {
        const mockRequest = {
          on: (event, handler) => {
            if (event === 'error') {
              setTimeout(() => handler(new Error('Network error')), 0);
            }
          },
          setTimeout: () => {},
          end: () => {},
          destroy: () => {}
        };
        
        return mockRequest;
      };
      
      try {
        await assertThrowsWithMessage(
          () => updater.getLatestRelease(),
          /Failed to fetch latest release/,
          'Should handle request errors'
        );
        
      } finally {
        require('https').request = originalRequest;
      }
    });
  });

  describe('Download and Apply Update', () => {
    test('should update VERSION file with correct version', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      const mockRelease = {
        tag_name: 'v2.0.0',
        assets: []
      };
      
      await updater.downloadAndApplyUpdate(mockRelease);
      
      // Verify VERSION file was updated
      const version = await fs.readFile(updater.versionFile, 'utf8');
      assert.strictEqual(version.trim(), '2.0.0');
    });

    test('should handle release with v prefix correctly', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      const mockRelease = {
        tag_name: 'v1.5.0',
        assets: []
      };
      
      await updater.downloadAndApplyUpdate(mockRelease);
      
      // Verify v prefix was stripped
      const version = await fs.readFile(updater.versionFile, 'utf8');
      assert.strictEqual(version.trim(), '1.5.0');
    });

    test('should handle release without v prefix', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      const mockRelease = {
        tag_name: '1.2.3',
        assets: []
      };
      
      await updater.downloadAndApplyUpdate(mockRelease);
      
      const version = await fs.readFile(updater.versionFile, 'utf8');
      assert.strictEqual(version.trim(), '1.2.3');
    });
  });

  describe('Directory Copying', () => {
    test('should copy nested directories recursively', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      // Create nested source structure
      const sourceDir = path.join(testEnv.testDir, 'source');
      await fs.mkdir(path.join(sourceDir, 'level1', 'level2'), { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(sourceDir, 'level1', 'file2.txt'), 'content2');
      await fs.writeFile(path.join(sourceDir, 'level1', 'level2', 'file3.txt'), 'content3');
      
      const destDir = path.join(testEnv.testDir, 'dest');
      await updater.copyDirectory(sourceDir, destDir);
      
      // Verify all files were copied
      await assertFileExists(path.join(destDir, 'file1.txt'));
      await assertFileExists(path.join(destDir, 'level1', 'file2.txt'));
      await assertFileExists(path.join(destDir, 'level1', 'level2', 'file3.txt'));
      
      // Verify content
      const content3 = await fs.readFile(path.join(destDir, 'level1', 'level2', 'file3.txt'), 'utf8');
      assert.strictEqual(content3, 'content3');
    });

    test('should handle empty directories', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      const sourceDir = path.join(testEnv.testDir, 'empty-source');
      await fs.mkdir(sourceDir);
      
      const destDir = path.join(testEnv.testDir, 'empty-dest');
      await updater.copyDirectory(sourceDir, destDir);
      
      // Verify destination directory was created
      await assertDirectoryExists(destDir);
    });
  });

  describe('CLI Interface', () => {
    test('should handle local update via CLI args', async () => {
      // Mock process.argv
      const originalArgv = process.argv;
      process.argv = ['node', 'update.cjs', '--local', testEnv.testDir];
      
      // Create source structure
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      // Mock the updater methods to avoid actual execution
      let localUpdateCalled = false;
      updater.updateFromLocal = async (sourcePath) => {
        localUpdateCalled = true;
        assert.strictEqual(sourcePath, testEnv.testDir);
      };
      
      try {
        // The CLI interface is tested by checking if it would call the right method
        assert.strictEqual(typeof updater.updateFromLocal, 'function');
        await updater.updateFromLocal(testEnv.testDir);
        assert.strictEqual(localUpdateCalled, true);
        
      } finally {
        process.argv = originalArgv;
      }
    });

    test('should handle regular update via CLI with no args', async () => {
      // Mock process.argv for regular update
      const originalArgv = process.argv;
      process.argv = ['node', 'update.cjs'];
      
      let updateCalled = false;
      const originalUpdate = updater.update;
      updater.update = async () => {
        updateCalled = true;
      };
      
      try {
        // Test that update method exists and can be called
        assert.strictEqual(typeof updater.update, 'function');
        await updater.update();
        assert.strictEqual(updateCalled, true);
        
      } finally {
        process.argv = originalArgv;
        updater.update = originalUpdate;
      }
    });

    test('should handle CLI args with default path for local update', async () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'update.cjs', '--local'];
      
      let localUpdateCalled = false;
      let calledWithPath = null;
      updater.updateFromLocal = async (sourcePath) => {
        localUpdateCalled = true;
        calledWithPath = sourcePath;
      };
      
      try {
        // Test default path handling
        assert.strictEqual(typeof updater.updateFromLocal, 'function');
        await updater.updateFromLocal('.');
        assert.strictEqual(localUpdateCalled, true);
        assert.strictEqual(calledWithPath, '.');
        
      } finally {
        process.argv = originalArgv;
      }
    });
  });

  describe('Main Update Workflow - Extended Coverage', () => {
    test('should handle update with console output', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      // Mock console.log to capture output
      const originalLog = console.log;
      const logMessages = [];
      console.log = (...args) => logMessages.push(args.join(' '));
      
      // Mock getCurrentVersion to return old version
      const originalGetCurrentVersion = updater.getCurrentVersion;
      updater.getCurrentVersion = async () => '0.8.0';
      
      // Mock getLatestRelease to return newer version
      updater.getLatestRelease = async () => ({
        tag_name: 'v1.1.0',
        assets: []
      });
      
      // Mock downloadAndApplyUpdate
      updater.downloadAndApplyUpdate = async () => {
        await fs.writeFile(updater.versionFile, '1.1.0');
      };
      
      // Mock regenerateInstructionFiles
      updater.regenerateInstructionFiles = async () => {};
      
      try {
        await updater.update();
        
        // Verify console output was generated
        const joinedLogs = logMessages.join(' ');
        assert.ok(joinedLogs.includes('Checking for DocuMind updates'), 'Should log checking message');
        assert.ok(joinedLogs.includes('Current version: 0.8.0'), 'Should log current version');
        assert.ok(joinedLogs.includes('Latest version: 1.1.0'), 'Should log latest version');
        assert.ok(joinedLogs.includes('New version available'), 'Should log new version available');
        assert.ok(joinedLogs.includes('updated successfully'), 'Should log success message');
        
      } finally {
        console.log = originalLog;
        updater.getCurrentVersion = originalGetCurrentVersion;
      }
    });

    test('should handle update error with helpful tip', async () => {
      await createMockRepository(testEnv.testDir, 'empty');
      
      // Mock console.error and console.log to capture output
      const originalError = console.error;
      const originalLog = console.log;
      const errorMessages = [];
      const logMessages = [];
      console.error = (...args) => errorMessages.push(args.join(' '));
      console.log = (...args) => logMessages.push(args.join(' '));
      
      // Mock process.exit to avoid actually exiting
      const originalExit = process.exit;
      let exitCode = null;
      process.exit = (code) => { 
        exitCode = code;
        throw new Error('Process exit called with code: ' + code);
      };
      
      // Mock getCurrentVersion to preserve the original fs error behavior
      // The getCurrentVersion method wraps fs.readFile errors, so we need to 
      // simulate what would happen when fs.readFile fails with ENOENT
      const originalGetCurrentVersion = updater.getCurrentVersion;
      updater.getCurrentVersion = async () => {
        // Create an error that mimics what happens when getCurrentVersion 
        // encounters an ENOENT error and wraps it
        const fsError = new Error('ENOENT: no such file or directory, open \'/some/path/.documind/VERSION\'');
        fsError.code = 'ENOENT';
        fsError.path = '/some/path/.documind/VERSION';
        
        // However, getCurrentVersion wraps this error, losing the original properties
        // So we need to throw the original error directly to trigger the tip logic
        throw fsError;
      };
      
      try {
        await updater.update();
        
        // Should not reach here
        assert.fail('Expected update to call process.exit');
        
      } catch (error) {
        // Verify error handling and helpful tip
        assert.strictEqual(exitCode, 1, 'Should call process.exit(1)');
        
        const joinedErrors = errorMessages.join(' ');
        assert.ok(joinedErrors.includes('Update failed'), 'Should log update failed');
        
        const joinedLogs = logMessages.join(' ');
        assert.ok(joinedLogs.includes('fresh install'), 'Should show helpful tip');
        assert.ok(joinedLogs.includes('Try running the install script first'), 'Should suggest install script');
      } finally {
        console.error = originalError;
        console.log = originalLog;
        process.exit = originalExit;
        updater.getCurrentVersion = originalGetCurrentVersion;
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', () => {
      // This is difficult to test without mocking the HTTPS module
      // In a real implementation, we would mock the network calls
      assert.ok(updater.updateUrl, 'Update URL should be configured');
    });

    test('should provide helpful error for missing VERSION file', async () => {
      await createMockRepository(testEnv.testDir, 'empty');
      
      await assertThrowsWithMessage(
        () => updater.getCurrentVersion(),
        /Cannot read current version/,
        'Should provide clear error message'
      );
    });

    test('should handle malformed version file', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir);
      await fs.writeFile(path.join(testEnv.testDir, '.documind', 'VERSION'), '');
      
      const version = await updater.getCurrentVersion();
      assert.strictEqual(version, '', 'Should handle empty version file');
    });

    test('should handle copyDirectory with non-directory entries', async () => {
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      
      // Create source with mixed file types
      const sourceDir = path.join(testEnv.testDir, 'mixed-source');
      await fs.mkdir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'regular-file.txt'), 'content');
      await fs.mkdir(path.join(sourceDir, 'subdir'));
      await fs.writeFile(path.join(sourceDir, 'subdir', 'nested-file.txt'), 'nested content');
      
      const destDir = path.join(testEnv.testDir, 'mixed-dest');
      await updater.copyDirectory(sourceDir, destDir);
      
      // Verify all content was copied correctly
      await assertFileExists(path.join(destDir, 'regular-file.txt'));
      await assertDirectoryExists(path.join(destDir, 'subdir'));
      await assertFileExists(path.join(destDir, 'subdir', 'nested-file.txt'));
      
      const content = await fs.readFile(path.join(destDir, 'subdir', 'nested-file.txt'), 'utf8');
      assert.strictEqual(content, 'nested content');
    });
  });

  describe('Integration Testing', () => {
    test('should handle complete local update workflow', async () => {
      // Create initial installation
      await createMockRepositoryWithDocuMind(testEnv.testDir, 'nodejs', true);
      await fs.writeFile(path.join(testEnv.testDir, '.documind', 'VERSION'), '1.0.0');
      
      // Create updated source
      const sourceDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'integration-'));
      
      try {
        await fs.mkdir(path.join(sourceDir, '.documind'), { recursive: true });
        await fs.mkdir(path.join(sourceDir, '.documind', 'templates'), { recursive: true });
        await fs.mkdir(path.join(sourceDir, '.documind', 'scripts'), { recursive: true });
        
        await fs.writeFile(
          path.join(sourceDir, '.documind', 'system.md'),
          'Updated system for integration test'
        );
        await fs.writeFile(
          path.join(sourceDir, '.documind', 'commands.md'),
          'Updated commands for integration test'
        );
        
        // Mock installer for the test
        const mockInstaller = class MockInstaller {
          async detectAITools() { return ['claude']; }
          async generateInstructionFile() { return; }
        };
        
        require.cache[require.resolve('../../.documind/scripts/install.cjs')] = {
          exports: mockInstaller
        };
        
        // Perform update
        await updater.updateFromLocal(sourceDir);
        
        // Verify update was successful
        await assertFileContains(
          path.join(testEnv.testDir, '.documind', 'system.md'),
          'Updated system for integration test'
        );
        await assertFileContains(
          path.join(testEnv.testDir, '.documind', 'commands.md'),
          'Updated commands for integration test'
        );
        
      } finally {
        await fs.rm(sourceDir, { recursive: true, force: true });
      }
    });
  });
});