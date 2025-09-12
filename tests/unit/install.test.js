import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);

describe('DocuMind Installer Tests', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Get project root from this test file location
    const testFileDir = path.dirname(fileURLToPath(import.meta.url));
    originalCwd = path.resolve(testFileDir, '..', '..');
    
    // Create a unique temporary directory for each test
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'documind-install-test-'));
    // Resolve the real path to handle symlinks like /var -> /private/var on macOS
    testDir = await fs.realpath(testDir);
  });

  afterEach(async () => {
    // Restore original working directory
    if (originalCwd) {
      process.chdir(originalCwd);
    }
    
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('CLI Installation', () => {
    test('should install DocuMind successfully in empty directory', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Run the installer
      const { stdout } = await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Verify installation succeeded
      assert(stdout.includes('✅ DocuMind installed successfully!'), 'Should show success message');
      
      // Verify core files were created
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind')), 'Should create .documind directory');
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind/core')), 'Should create core directory');
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind/core/system.md')), 'Should create system.md');
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind/core/commands.md')), 'Should create commands.md');
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind/core/VERSION')), 'Should create VERSION file');
      
      // Verify AI configuration files were created
      await assert.doesNotReject(fs.access(path.join(testDir, 'CLAUDE.md')), 'Should create CLAUDE.md');
      await assert.doesNotReject(fs.access(path.join(testDir, '.github/copilot-instructions.md')), 'Should create copilot instructions');
      await assert.doesNotReject(fs.access(path.join(testDir, '.cursor/rules')), 'Should create .cursor/rules directory');
      await assert.doesNotReject(fs.access(path.join(testDir, 'GEMINI.md')), 'Should create GEMINI.md');
    });

    test('should create proper file contents', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Run the installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check CLAUDE.md content
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('DocuMind'), 'CLAUDE.md should mention DocuMind');
      assert(claudeContent.includes('/document'), 'CLAUDE.md should include document commands');
      
      // Check system.md exists and has content
      const systemContent = await fs.readFile(path.join(testDir, '.documind/core/system.md'), 'utf8');
      assert(systemContent.length > 100, 'system.md should have substantial content');
      
      // Check commands.md exists and has content
      const commandsContent = await fs.readFile(path.join(testDir, '.documind/core/commands.md'), 'utf8');
      assert(commandsContent.includes('document'), 'commands.md should include document commands');
    });

    test('should handle existing installation gracefully', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Run installer twice
      await execFileAsync('node', [cliPath, 'init', testDir]);
      const { stdout } = await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Should show already initialized message
      assert(stdout.includes('already initialized'), 'Should detect existing installation');
    });

    test('should update .gitignore correctly', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create initial .gitignore
      await fs.writeFile(path.join(testDir, '.gitignore'), 'node_modules/\\n*.log\\n');
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check .gitignore was updated
      const gitignoreContent = await fs.readFile(path.join(testDir, '.gitignore'), 'utf8');
      assert(gitignoreContent.includes('node_modules/'), 'Should preserve existing entries');
      assert(gitignoreContent.includes('DocuMind'), 'Should add DocuMind comment');
    });

    test('should work with different target directories', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      const subDir = path.join(testDir, 'subproject');
      await fs.mkdir(subDir);
      
      // Run installer in subdirectory
      await execFileAsync('node', [cliPath, 'init', subDir]);
      
      // Verify files were created in subdirectory
      await assert.doesNotReject(fs.access(path.join(subDir, '.documind')), 'Should create .documind in target directory');
      await assert.doesNotReject(fs.access(path.join(subDir, 'CLAUDE.md')), 'Should create CLAUDE.md in target directory');
    });
  });

  describe('Error Handling', () => {
    test('should handle permission errors gracefully', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      const readOnlyDir = path.join(testDir, 'readonly');
      await fs.mkdir(readOnlyDir);
      await fs.chmod(readOnlyDir, 0o444); // Read-only
      
      try {
        await execFileAsync('node', [cliPath, 'init', readOnlyDir]);
        assert.fail('Should have thrown an error for read-only directory');
      } catch (error) {
        assert(error.stderr.includes('❌'), 'Should show error message');
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(readOnlyDir, 0o755).catch(() => {});
      }
    });

    test('should handle non-existent target directory', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      const nonExistentDir = path.join(testDir, 'does-not-exist');
      
      try {
        await execFileAsync('node', [cliPath, 'init', nonExistentDir]);
        assert.fail('Should have thrown an error for non-existent directory');
      } catch (error) {
        assert(error.stderr.includes('❌'), 'Should show error message');
      }
    });
  });
});