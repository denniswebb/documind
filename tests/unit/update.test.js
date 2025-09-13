#!/usr/bin/env node

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import DocuMindUpdater from '../../src/scripts/update.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DocuMindUpdater', () => {
  let updater;
  let originalConsoleLog;
  let originalConsoleError;
  let originalProcessExit;
  let mockConsoleOutput;
  let mockConsoleErrors;

  beforeEach(() => {
    updater = new DocuMindUpdater();
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalProcessExit = process.exit;
    
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
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  describe('constructor', () => {
    it('should initialize with proper paths', () => {
      assert.ok(updater.repoRoot);
      assert.ok(updater.documindDir);
      assert.ok(updater.versionFile);
      assert.ok(updater.updateUrl);
      assert.ok(path.isAbsolute(updater.repoRoot));
      assert.ok(updater.documindDir.endsWith('.documind'));
      assert.ok(updater.versionFile.endsWith('VERSION'));
    });

    it('should set update URL correctly', () => {
      assert.strictEqual(updater.updateUrl, 'https://api.github.com/repos/denniswebb/documind/releases/latest');
    });

    it('should construct file paths correctly', () => {
      const expectedDocumindDir = path.join(updater.repoRoot, '.documind');
      const expectedVersionFile = path.join(expectedDocumindDir, 'core', 'VERSION');
      
      assert.strictEqual(updater.documindDir, expectedDocumindDir);
      assert.strictEqual(updater.versionFile, expectedVersionFile);
    });
  });

  describe('getCurrentVersion', () => {
    let originalReadFile;

    beforeEach(() => {
      originalReadFile = fs.readFile;
    });

    afterEach(() => {
      // Restore fs.readFile
      fs.readFile = originalReadFile;
    });

    it('should read version from file', async () => {
      fs.readFile = mock.fn(() => Promise.resolve('1.2.3\n'));
      
      const version = await updater.getCurrentVersion();
      assert.strictEqual(version, '1.2.3');
      assert.strictEqual(fs.readFile.mock.calls.length, 1);
      assert.strictEqual(fs.readFile.mock.calls[0].arguments[0], updater.versionFile);
      assert.strictEqual(fs.readFile.mock.calls[0].arguments[1], 'utf8');
    });

    it('should trim whitespace from version', async () => {
      fs.readFile = mock.fn(() => Promise.resolve('  2.0.0  \n\t  '));
      
      const version = await updater.getCurrentVersion();
      assert.strictEqual(version, '2.0.0');
    });

    it('should throw error when file cannot be read', async () => {
      fs.readFile = mock.fn(() => Promise.reject(new Error('File not found')));
      
      await assert.rejects(
        () => updater.getCurrentVersion(),
        /Cannot read current version: File not found/
      );
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      assert.strictEqual(updater.compareVersions('1.0.0', '1.0.0'), 0);
      assert.strictEqual(updater.compareVersions('2.5.10', '2.5.10'), 0);
    });

    it('should return -1 when current is less than latest', () => {
      assert.strictEqual(updater.compareVersions('1.0.0', '1.0.1'), -1);
      assert.strictEqual(updater.compareVersions('1.0.0', '1.1.0'), -1);
      assert.strictEqual(updater.compareVersions('1.0.0', '2.0.0'), -1);
      assert.strictEqual(updater.compareVersions('1.5.3', '1.5.4'), -1);
    });

    it('should return 1 when current is greater than latest', () => {
      assert.strictEqual(updater.compareVersions('1.0.1', '1.0.0'), 1);
      assert.strictEqual(updater.compareVersions('1.1.0', '1.0.0'), 1);
      assert.strictEqual(updater.compareVersions('2.0.0', '1.0.0'), 1);
      assert.strictEqual(updater.compareVersions('1.5.4', '1.5.3'), 1);
    });

    it('should handle different length versions', () => {
      assert.strictEqual(updater.compareVersions('1.0', '1.0.0'), 0);
      assert.strictEqual(updater.compareVersions('1.0.0', '1.0'), 0);
      assert.strictEqual(updater.compareVersions('1.0', '1.0.1'), -1);
      assert.strictEqual(updater.compareVersions('1.0.1', '1.0'), 1);
    });

    it('should handle single digit versions', () => {
      assert.strictEqual(updater.compareVersions('1', '1'), 0);
      assert.strictEqual(updater.compareVersions('1', '2'), -1);
      assert.strictEqual(updater.compareVersions('2', '1'), 1);
    });

    it('should handle large version numbers', () => {
      assert.strictEqual(updater.compareVersions('10.20.30', '10.20.31'), -1);
      assert.strictEqual(updater.compareVersions('100.200.300', '100.200.300'), 0);
    });
  });

  describe('getLatestRelease', () => {
    let originalHttpsRequest;
    let mockRequest;

    beforeEach(() => {
      originalHttpsRequest = https.request;
      mockRequest = {
        on: mock.fn(),
        setTimeout: mock.fn(),
        end: mock.fn(),
        destroy: mock.fn()
      };
    });

    afterEach(() => {
      https.request = originalHttpsRequest;
    });

    it('should make correct HTTPS request', async () => {
      https.request = mock.fn((options, callback) => {
        // Verify request options
        assert.strictEqual(options.hostname, 'api.github.com');
        assert.strictEqual(options.path, '/repos/denniswebb/documind/releases/latest');
        assert.strictEqual(options.method, 'GET');
        assert.strictEqual(options.headers['User-Agent'], 'DocuMind-Updater');
        assert.strictEqual(options.headers['Accept'], 'application/vnd.github.v3+json');
        
        // Simulate successful response
        const mockResponse = {
          statusCode: 200,
          on: mock.fn((event, handler) => {
            if (event === 'data') {
              handler('{"tag_name": "v1.0.0"}');
            } else if (event === 'end') {
              handler();
            }
          })
        };
        
        callback(mockResponse);
        return mockRequest;
      });

      const release = await updater.getLatestRelease();
      assert.deepStrictEqual(release, { tag_name: 'v1.0.0' });
    });

    it('should handle successful response with complete data', async () => {
      const mockReleaseData = {
        tag_name: 'v1.2.3',
        name: 'Release 1.2.3',
        body: 'Release notes'
      };

      https.request = mock.fn((options, callback) => {
        const mockResponse = {
          statusCode: 200,
          on: mock.fn((event, handler) => {
            if (event === 'data') {
              handler(JSON.stringify(mockReleaseData));
            } else if (event === 'end') {
              handler();
            }
          })
        };
        
        callback(mockResponse);
        return mockRequest;
      });

      const release = await updater.getLatestRelease();
      assert.deepStrictEqual(release, mockReleaseData);
    });

    it('should handle chunked response data', async () => {
      https.request = mock.fn((options, callback) => {
        const mockResponse = {
          statusCode: 200,
          on: mock.fn((event, handler) => {
            if (event === 'data') {
              handler('{"tag_');
              handler('name": "v1.0.0"}');
            } else if (event === 'end') {
              handler();
            }
          })
        };
        
        callback(mockResponse);
        return mockRequest;
      });

      const release = await updater.getLatestRelease();
      assert.deepStrictEqual(release, { tag_name: 'v1.0.0' });
    });

    it('should reject on HTTP error status', async () => {
      https.request = mock.fn((options, callback) => {
        const mockResponse = {
          statusCode: 404,
          on: mock.fn((event, handler) => {
            if (event === 'data') {
              handler('Not Found');
            } else if (event === 'end') {
              handler();
            }
          })
        };
        
        callback(mockResponse);
        return mockRequest;
      });

      await assert.rejects(
        () => updater.getLatestRelease(),
        /GitHub API returned 404: Not Found/
      );
    });

    it('should reject on invalid JSON response', async () => {
      https.request = mock.fn((options, callback) => {
        const mockResponse = {
          statusCode: 200,
          on: mock.fn((event, handler) => {
            if (event === 'data') {
              handler('invalid json');
            } else if (event === 'end') {
              handler();
            }
          })
        };
        
        callback(mockResponse);
        return mockRequest;
      });

      await assert.rejects(
        () => updater.getLatestRelease(),
        /Failed to parse GitHub response/
      );
    });

    it('should reject on request error', async () => {
      https.request = mock.fn((options, callback) => {
        mockRequest.on = mock.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('Network error'));
          }
        });
        return mockRequest;
      });

      await assert.rejects(
        () => updater.getLatestRelease(),
        /Failed to fetch latest release: Network error/
      );
    });

    it('should reject on timeout', async () => {
      https.request = mock.fn((options, callback) => {
        mockRequest.setTimeout = mock.fn((timeout, handler) => {
          assert.strictEqual(timeout, 10000);
          // Simulate timeout
          setTimeout(handler, 0);
        });
        return mockRequest;
      });

      await assert.rejects(
        () => updater.getLatestRelease(),
        /Request timed out/
      );
    });
  });

  describe('downloadAndApplyUpdate', () => {
    let originalWriteFile;

    beforeEach(() => {
      originalWriteFile = fs.writeFile;
    });

    afterEach(() => {
      // Restore fs.writeFile
      fs.writeFile = originalWriteFile;
    });

    it('should update version file with release version', async () => {
      fs.writeFile = mock.fn(() => Promise.resolve());
      
      const mockRelease = { tag_name: 'v2.1.0' };
      await updater.downloadAndApplyUpdate(mockRelease);
      
      assert.strictEqual(fs.writeFile.mock.calls.length, 1);
      assert.strictEqual(fs.writeFile.mock.calls[0].arguments[0], updater.versionFile);
      assert.strictEqual(fs.writeFile.mock.calls[0].arguments[1], '2.1.0');
    });

    it('should strip v prefix from tag name', async () => {
      fs.writeFile = mock.fn(() => Promise.resolve());
      
      const mockRelease = { tag_name: 'v10.5.3' };
      await updater.downloadAndApplyUpdate(mockRelease);
      
      assert.strictEqual(fs.writeFile.mock.calls[0].arguments[1], '10.5.3');
    });

    it('should handle tag names without v prefix', async () => {
      fs.writeFile = mock.fn(() => Promise.resolve());
      
      const mockRelease = { tag_name: '1.0.0' };
      await updater.downloadAndApplyUpdate(mockRelease);
      
      assert.strictEqual(fs.writeFile.mock.calls[0].arguments[1], '1.0.0');
    });

    it('should log progress messages', async () => {
      fs.writeFile = mock.fn(() => Promise.resolve());
      
      const mockRelease = { tag_name: 'v1.0.0' };
      await updater.downloadAndApplyUpdate(mockRelease);
      
      assert.ok(mockConsoleOutput.some(msg => msg.includes('📥 Downloading core system files')));
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✓ Core system files updated')));
    });
  });

  describe('copyDirectory', () => {
    let originalMkdir;
    let originalReaddir;
    let originalCopyFile;

    beforeEach(() => {
      originalMkdir = fs.mkdir;
      originalReaddir = fs.readdir;
      originalCopyFile = fs.copyFile;
    });

    afterEach(() => {
      // Restore fs methods
      fs.mkdir = originalMkdir;
      fs.readdir = originalReaddir;
      fs.copyFile = originalCopyFile;
    });

    it('should create destination directory', async () => {
      fs.mkdir = mock.fn(() => Promise.resolve());
      fs.readdir = mock.fn(() => Promise.resolve([]));
      
      await updater.copyDirectory('/source', '/dest');
      
      assert.strictEqual(fs.mkdir.mock.calls.length, 1);
      assert.strictEqual(fs.mkdir.mock.calls[0].arguments[0], '/dest');
      assert.deepStrictEqual(fs.mkdir.mock.calls[0].arguments[1], { recursive: true });
    });

    it('should copy files', async () => {
      fs.mkdir = mock.fn(() => Promise.resolve());
      fs.readdir = mock.fn(() => Promise.resolve([
        { name: 'file1.txt', isDirectory: () => false },
        { name: 'file2.js', isDirectory: () => false }
      ]));
      fs.copyFile = mock.fn(() => Promise.resolve());
      
      await updater.copyDirectory('/source', '/dest');
      
      assert.strictEqual(fs.copyFile.mock.calls.length, 2);
      assert.strictEqual(fs.copyFile.mock.calls[0].arguments[0], '/source/file1.txt');
      assert.strictEqual(fs.copyFile.mock.calls[0].arguments[1], '/dest/file1.txt');
      assert.strictEqual(fs.copyFile.mock.calls[1].arguments[0], '/source/file2.js');
      assert.strictEqual(fs.copyFile.mock.calls[1].arguments[1], '/dest/file2.js');
    });

    it('should recursively copy directories', async () => {
      let mkdirCallCount = 0;
      fs.mkdir = mock.fn(() => {
        mkdirCallCount++;
        return Promise.resolve();
      });
      
      // Mock readdir to return subdirectory first, then empty for recursive call
      let readdirCallCount = 0;
      fs.readdir = mock.fn(() => {
        readdirCallCount++;
        if (readdirCallCount === 1) {
          return Promise.resolve([
            { name: 'subdir', isDirectory: () => true }
          ]);
        } else {
          return Promise.resolve([]);
        }
      });
      
      await updater.copyDirectory('/source', '/dest');
      
      // Should create both /dest and /dest/subdir
      assert.strictEqual(mkdirCallCount, 2);
      assert.strictEqual(readdirCallCount, 2);
    });

    it('should handle mixed files and directories', async () => {
      fs.mkdir = mock.fn(() => Promise.resolve());
      fs.copyFile = mock.fn(() => Promise.resolve());
      
      let readdirCallCount = 0;
      fs.readdir = mock.fn(() => {
        readdirCallCount++;
        if (readdirCallCount === 1) {
          return Promise.resolve([
            { name: 'file.txt', isDirectory: () => false },
            { name: 'subdir', isDirectory: () => true }
          ]);
        } else {
          return Promise.resolve([]);
        }
      });
      
      await updater.copyDirectory('/source', '/dest');
      
      assert.strictEqual(fs.copyFile.mock.calls.length, 1);
      assert.strictEqual(fs.copyFile.mock.calls[0].arguments[0], '/source/file.txt');
      assert.strictEqual(fs.copyFile.mock.calls[0].arguments[1], '/dest/file.txt');
    });
  });

  describe('updateFromLocal', () => {
    let originalAccess;
    let originalMkdir;
    let originalCopyFile;

    beforeEach(() => {
      originalAccess = fs.access;
      originalMkdir = fs.mkdir;
      originalCopyFile = fs.copyFile;
    });

    afterEach(() => {
      // Restore fs methods
      fs.access = originalAccess;
      fs.mkdir = originalMkdir;
      fs.copyFile = originalCopyFile;
    });

    it('should validate source path exists', async () => {
      fs.access = mock.fn(() => Promise.reject(new Error('Path not found')));
      
      try {
        await updater.updateFromLocal('/invalid/path');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'process.exit called');
      }
      
      assert.ok(mockConsoleErrors.some(msg => msg.includes('❌ Local update failed')));
    });

    it('should copy core files', async () => {
      fs.access = mock.fn(() => Promise.resolve());
      fs.mkdir = mock.fn(() => Promise.resolve());
      fs.copyFile = mock.fn(() => Promise.resolve());
      
      // Mock regenerateInstructionFiles
      updater.regenerateInstructionFiles = mock.fn(() => Promise.resolve());
      // Mock copyDirectory
      updater.copyDirectory = mock.fn(() => Promise.resolve());
      
      await updater.updateFromLocal('/source');
      
      // Should copy system.md and commands.md
      assert.strictEqual(fs.copyFile.mock.calls.length, 2);
      assert.ok(fs.copyFile.mock.calls[0].arguments[0].includes('system.md'));
      assert.ok(fs.copyFile.mock.calls[1].arguments[0].includes('commands.md'));
    });

    it('should copy core directories', async () => {
      fs.access = mock.fn(() => Promise.resolve());
      fs.mkdir = mock.fn(() => Promise.resolve());
      fs.copyFile = mock.fn(() => Promise.resolve());
      
      updater.regenerateInstructionFiles = mock.fn(() => Promise.resolve());
      updater.copyDirectory = mock.fn(() => Promise.resolve());
      
      await updater.updateFromLocal('/source');
      
      // Should copy templates and scripts directories
      assert.strictEqual(updater.copyDirectory.mock.calls.length, 2);
      assert.ok(updater.copyDirectory.mock.calls[0].arguments[0].includes('templates'));
      assert.ok(updater.copyDirectory.mock.calls[1].arguments[0].includes('scripts'));
    });

    it('should create core directory if it does not exist', async () => {
      fs.access = mock.fn(() => Promise.resolve());
      fs.mkdir = mock.fn(() => Promise.resolve());
      fs.copyFile = mock.fn(() => Promise.resolve());
      
      updater.regenerateInstructionFiles = mock.fn(() => Promise.resolve());
      updater.copyDirectory = mock.fn(() => Promise.resolve());
      
      await updater.updateFromLocal('/source');
      
      assert.strictEqual(fs.mkdir.mock.calls.length, 1);
      assert.ok(fs.mkdir.mock.calls[0].arguments[0].includes('core'));
      assert.deepStrictEqual(fs.mkdir.mock.calls[0].arguments[1], { recursive: true });
    });

    it('should regenerate instruction files', async () => {
      fs.access = mock.fn(() => Promise.resolve());
      fs.mkdir = mock.fn(() => Promise.resolve());
      fs.copyFile = mock.fn(() => Promise.resolve());
      updater.copyDirectory = mock.fn(() => Promise.resolve());
      updater.regenerateInstructionFiles = mock.fn(() => Promise.resolve());
      
      await updater.updateFromLocal('/source');
      
      assert.strictEqual(updater.regenerateInstructionFiles.mock.calls.length, 1);
    });

    it('should log progress messages', async () => {
      fs.access = mock.fn(() => Promise.resolve());
      fs.mkdir = mock.fn(() => Promise.resolve());
      fs.copyFile = mock.fn(() => Promise.resolve());
      updater.copyDirectory = mock.fn(() => Promise.resolve());
      updater.regenerateInstructionFiles = mock.fn(() => Promise.resolve());
      
      await updater.updateFromLocal('/source');
      
      assert.ok(mockConsoleOutput.some(msg => msg.includes('🔄 Updating DocuMind from local source')));
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✓ Updated system.md')));
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✓ Updated commands.md')));
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✓ Updated templates/')));
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✓ Updated scripts/')));
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✅ Local update completed successfully!')));
    });
  });

  describe('update', () => {
    beforeEach(() => {
      updater.getCurrentVersion = mock.fn(() => Promise.resolve('1.0.0'));
      updater.getLatestRelease = mock.fn(() => Promise.resolve({ tag_name: 'v2.0.0' }));
      updater.downloadAndApplyUpdate = mock.fn(() => Promise.resolve());
      updater.regenerateInstructionFiles = mock.fn(() => Promise.resolve());
    });

    it('should check current version', async () => {
      await updater.update();
      assert.strictEqual(updater.getCurrentVersion.mock.calls.length, 1);
    });

    it('should fetch latest release', async () => {
      await updater.update();
      assert.strictEqual(updater.getLatestRelease.mock.calls.length, 1);
    });

    it('should update when new version is available', async () => {
      await updater.update();
      
      assert.strictEqual(updater.downloadAndApplyUpdate.mock.calls.length, 1);
      assert.strictEqual(updater.regenerateInstructionFiles.mock.calls.length, 1);
      assert.ok(mockConsoleOutput.some(msg => msg.includes('📦 New version available')));
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✅ DocuMind updated successfully!')));
    });

    it('should skip update when already up to date', async () => {
      updater.getCurrentVersion = mock.fn(() => Promise.resolve('2.0.0'));
      updater.getLatestRelease = mock.fn(() => Promise.resolve({ tag_name: 'v2.0.0' }));
      
      await updater.update();
      
      assert.strictEqual(updater.downloadAndApplyUpdate.mock.calls.length, 0);
      assert.strictEqual(updater.regenerateInstructionFiles.mock.calls.length, 0);
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✅ DocuMind is already up to date!')));
    });

    it('should skip update when current version is newer', async () => {
      updater.getCurrentVersion = mock.fn(() => Promise.resolve('2.1.0'));
      updater.getLatestRelease = mock.fn(() => Promise.resolve({ tag_name: 'v2.0.0' }));
      
      await updater.update();
      
      assert.strictEqual(updater.downloadAndApplyUpdate.mock.calls.length, 0);
      assert.ok(mockConsoleOutput.some(msg => msg.includes('✅ DocuMind is already up to date!')));
    });

    it('should handle errors gracefully', async () => {
      updater.getCurrentVersion = mock.fn(() => Promise.reject(new Error('Version file not found')));
      
      try {
        await updater.update();
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'process.exit called');
      }
      
      assert.ok(mockConsoleErrors.some(msg => msg.includes('❌ Update failed')));
    });

    it('should provide helpful tip for VERSION file errors', async () => {
      const versionError = new Error('File not found');
      versionError.code = 'ENOENT';
      versionError.path = '/path/to/VERSION';
      updater.getCurrentVersion = mock.fn(() => Promise.reject(versionError));
      
      try {
        await updater.update();
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'process.exit called');
      }
      
      assert.ok(mockConsoleOutput.some(msg => msg.includes('💡 Tip: This might be a fresh install')));
    });

    it('should log version information', async () => {
      await updater.update();
      
      assert.ok(mockConsoleOutput.some(msg => msg.includes('📍 Current version: 1.0.0')));
      assert.ok(mockConsoleOutput.some(msg => msg.includes('🚀 Latest version: 2.0.0')));
      assert.ok(mockConsoleOutput.some(msg => msg.includes('Updated from 1.0.0 to 2.0.0')));
    });
  });
});