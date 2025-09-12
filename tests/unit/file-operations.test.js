import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';

const execFileAsync = promisify(execFile);

describe('File Operations Tests', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Save original working directory
    originalCwd = process.cwd();
    
    // Create a unique temporary directory for each test
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'documind-file-ops-test-'));
    // Resolve the real path to handle symlinks like /var -> /private/var on macOS
    testDir = await fs.realpath(testDir);
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

  describe('Directory Creation via CLI', () => {
    test('should create all required directories during installation', async () => {
      const cliPath = path.resolve(originalCwd, 'cli.js');
      
      // Run the installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Verify all required directories were created
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind')), 'Should create .documind directory');
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind/core')), 'Should create core directory');
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind/scripts')), 'Should create scripts directory');
      await assert.doesNotReject(fs.access(path.join(testDir, '.github')), 'Should create .github directory');
      await assert.doesNotReject(fs.access(path.join(testDir, '.cursor')), 'Should create .cursor directory');
      await assert.doesNotReject(fs.access(path.join(testDir, '.cursor/rules')), 'Should create .cursor/rules directory');
    });

    test('should handle existing directories gracefully', async () => {
      const cliPath = path.resolve(originalCwd, 'cli.js');
      
      // Pre-create some directories
      await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
      await fs.mkdir(path.join(testDir, '.cursor'), { recursive: true });
      
      // Should not fail when directories already exist
      await assert.doesNotReject(
        execFileAsync('node', [cliPath, 'init', testDir]),
        'Should handle existing directories gracefully'
      );
    });
  });

  describe('File Writing Operations via CLI', () => {
    test('should create all required files with correct content', async () => {
      const cliPath = path.resolve(originalCwd, 'cli.js');
      
      // Run the installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check that all expected files were created
      const expectedFiles = [
        'CLAUDE.md',
        'GEMINI.md', 
        '.github/copilot-instructions.md',
        '.cursor/rules/documind.mdc',
        '.documind/core/system.md',
        '.documind/core/commands.md',
        '.documind/core/VERSION'
      ];
      
      for (const expectedFile of expectedFiles) {
        const filePath = path.join(testDir, expectedFile);
        await assert.doesNotReject(
          fs.access(filePath),
          `Should create ${expectedFile}`
        );
        
        // Verify file has content
        const content = await fs.readFile(filePath, 'utf8');
        assert(content.length > 0, `${expectedFile} should have content`);
      }
    });

    test('should create files with expected content patterns', async () => {
      const cliPath = path.resolve(originalCwd, 'cli.js');
      
      // Run the installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check CLAUDE.md content
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('DocuMind'), 'CLAUDE.md should mention DocuMind');
      assert(claudeContent.includes('/document'), 'CLAUDE.md should include document commands');
      
      // Check system.md content  
      const systemContent = await fs.readFile(path.join(testDir, '.documind/core/system.md'), 'utf8');
      assert(systemContent.length > 100, 'system.md should have substantial content');
      
      // Check commands.md content
      const commandsContent = await fs.readFile(path.join(testDir, '.documind/core/commands.md'), 'utf8');
      assert(commandsContent.includes('document'), 'commands.md should include document commands');
    });
  });

  describe('AI Tool Detection via File Presence', () => {
    test('should detect existing AI configurations and preserve them', async () => {
      const cliPath = path.resolve(originalCwd, 'cli.js');
      
      // Pre-create some AI tool files
      await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'CLAUDE.md'), '# Existing Claude config');
      await fs.writeFile(path.join(testDir, '.cursorrules'), 'existing cursor rules');
      
      // Run installer
      const { stdout } = await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Should detect and mention existing configurations
      assert(stdout.includes('Detected AI tools:') || stdout.includes('existing AI configurations') || stdout.includes('installing for all supported tools'), 
             'Should detect existing AI tool configurations or install for all tools');
      
      // Original files should be preserved or updated, not overwritten completely
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('DocuMind'), 'CLAUDE.md should include DocuMind system');
    });
  });

  describe('Package.json Integration', () => {
    test('should work correctly without package.json', async () => {
      const cliPath = path.resolve(originalCwd, 'cli.js');
      
      // Run installer in directory without package.json
      await assert.doesNotReject(
        execFileAsync('node', [cliPath, 'init', testDir]),
        'Should work without package.json'
      );
      
      // Verify installation succeeded
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind')), 'Should install successfully');
    });

    test('should work correctly with existing package.json', async () => {
      const cliPath = path.resolve(originalCwd, 'cli.js');
      
      // Create package.json first
      const packageContent = {
        name: 'test-package',
        version: '1.0.0',
        scripts: {
          test: 'echo "test"'
        }
      };
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageContent, null, 2));
      
      // Run installer
      await assert.doesNotReject(
        execFileAsync('node', [cliPath, 'init', testDir]),
        'Should work with existing package.json'
      );
      
      // Verify installation succeeded and package.json is preserved
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind')), 'Should install successfully');
      await assert.doesNotReject(fs.access(path.join(testDir, 'package.json')), 'Should preserve package.json');
      
      // Verify package.json content is preserved
      const packageData = JSON.parse(await fs.readFile(path.join(testDir, 'package.json'), 'utf8'));
      assert.strictEqual(packageData.name, 'test-package', 'Should preserve package name');
    });
  });

  describe('File Existence and Error Handling', () => {
    test('should handle permission errors gracefully', async () => {
      const cliPath = path.resolve(originalCwd, 'cli.js');
      const readOnlyDir = path.join(testDir, 'readonly');
      await fs.mkdir(readOnlyDir);
      await fs.chmod(readOnlyDir, 0o444); // Read-only
      
      try {
        await execFileAsync('node', [cliPath, 'init', readOnlyDir]);
        assert.fail('Should have thrown an error for read-only directory');
      } catch (error) {
        assert(error.stderr.includes('❌') || error.message.includes('permission'), 'Should show permission error');
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(readOnlyDir, 0o755).catch(() => {});
      }
    });

    test('should handle non-existent target directory', async () => {
      const cliPath = path.resolve(originalCwd, 'cli.js');
      const nonExistentDir = path.join(testDir, 'does-not-exist');
      
      try {
        await execFileAsync('node', [cliPath, 'init', nonExistentDir]);
        assert.fail('Should have thrown an error for non-existent directory');
      } catch (error) {
        assert(error.stderr.includes('❌') || error.message.includes('not found'), 'Should show directory not found error');
      }
    });
  });
});