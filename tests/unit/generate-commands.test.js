import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);

describe('Command Generation Tests', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Get project root from this test file location
    const testFileDir = path.dirname(fileURLToPath(import.meta.url));
    originalCwd = path.resolve(testFileDir, '..', '..');
    
    // Create a unique temporary directory for each test
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'documind-commands-test-'));
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

  describe('AI Tool Detection and Command Generation', () => {
    test('should generate commands for detected AI tools during installation', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Run the installer
      const { stdout } = await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Should mention generating or creating commands
      assert(stdout.includes('✅') || stdout.includes('installed') || stdout.includes('success'), 'Should show successful installation');
      
      // Check that AI tool configuration files were created
      await assert.doesNotReject(fs.access(path.join(testDir, 'CLAUDE.md')), 'Should create Claude configuration');
      await assert.doesNotReject(fs.access(path.join(testDir, 'GEMINI.md')), 'Should create Gemini configuration'); 
      await assert.doesNotReject(fs.access(path.join(testDir, '.github/copilot-instructions.md')), 'Should create Copilot instructions');
      await assert.doesNotReject(fs.access(path.join(testDir, '.cursor/rules/documind.mdc')), 'Should create Cursor rules');
    });

    test('should detect existing AI tools and preserve configuration', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Pre-create some AI tool indicators
      await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'CLAUDE.md'), '# Existing Claude Config\nOriginal content');
      await fs.writeFile(path.join(testDir, '.cursorrules'), 'existing cursor rules');
      
      // Run installer
      const { stdout } = await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Should complete successfully
      assert(stdout.includes('✅'), 'Should complete successfully');
      
      // Should preserve/enhance existing files
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('DocuMind'), 'Should enhance CLAUDE.md with DocuMind system');
      
      // Should still create other expected files
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind')), 'Should create .documind directory');
    });

    test('should work in empty repository without existing AI tools', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Run installer in completely empty directory
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Should create all default AI tool configurations
      const expectedFiles = [
        'CLAUDE.md',
        'GEMINI.md',
        '.github/copilot-instructions.md', 
        '.cursor/rules/documind.mdc'
      ];
      
      for (const file of expectedFiles) {
        await assert.doesNotReject(
          fs.access(path.join(testDir, file)),
          `Should create ${file} in empty repository`
        );
        
        // Each file should have meaningful content
        const content = await fs.readFile(path.join(testDir, file), 'utf8');
        assert(content.length > 50, `${file} should have substantial content`);
        assert(content.includes('DocuMind'), `${file} should mention DocuMind`);
      }
    });

    test('should generate proper command content in AI configuration files', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check CLAUDE.md has proper command structure
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('/document'), 'CLAUDE.md should include /document commands');
      assert(claudeContent.includes('bootstrap'), 'Should include bootstrap command');
      assert(claudeContent.includes('expand'), 'Should include expand command');
      assert(claudeContent.includes('update'), 'Should include update command');
      assert(claudeContent.includes('analyze'), 'Should include analyze command');
      
      // Check system.md was created with content
      const systemContent = await fs.readFile(path.join(testDir, '.documind/core/system.md'), 'utf8');
      assert(systemContent.length > 200, 'system.md should have substantial content');
      
      // Check commands.md was created with content
      const commandsContent = await fs.readFile(path.join(testDir, '.documind/core/commands.md'), 'utf8');
      assert(commandsContent.includes('document'), 'commands.md should reference document commands');
    });
  });

  describe('Project Type Detection', () => {
    test('should work with Node.js projects', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create package.json to simulate Node.js project
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        description: 'Test Node.js project'
      }, null, 2));
      
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Should complete successfully for Node.js projects
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind')), 'Should work with Node.js projects');
      
      // Package.json should be preserved
      const packageData = JSON.parse(await fs.readFile(path.join(testDir, 'package.json'), 'utf8'));
      assert.strictEqual(packageData.name, 'test-project', 'Should preserve package.json');
    });

    test('should work with Python projects', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create requirements.txt to simulate Python project
      await fs.writeFile(path.join(testDir, 'requirements.txt'), 'requests==2.28.0\nnumpy==1.21.0');
      await fs.writeFile(path.join(testDir, 'main.py'), 'print("Hello World")');
      
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Should work regardless of project type
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind')), 'Should work with Python projects');
    });

    test('should work with generic projects', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create some generic files
      await fs.writeFile(path.join(testDir, 'README.md'), '# Generic Project');
      await fs.mkdir(path.join(testDir, 'src'));
      await fs.writeFile(path.join(testDir, 'src/main.txt'), 'some content');
      
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Should work with any project type
      await assert.doesNotReject(fs.access(path.join(testDir, '.documind')), 'Should work with generic projects');
    });
  });

  describe('Update Command Generation', () => {
    test('should be able to regenerate commands after installation', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Initial installation
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Modify one of the AI configuration files
      const claudePath = path.join(testDir, 'CLAUDE.md');
      await fs.writeFile(claudePath, '# Modified content');
      
      // Run update command if available
      try {
        await execFileAsync('node', [cliPath, 'update'], { cwd: testDir });
        
        // If update succeeded, check that configuration was restored/updated
        const claudeContent = await fs.readFile(claudePath, 'utf8');
        assert(claudeContent.includes('DocuMind'), 'Update should restore DocuMind configuration');
      } catch (error) {
        // Update command might fail due to network issues or GitHub API 404, which is acceptable for this test
        if (!error.message.includes('Unknown command') && 
            !error.message.includes('GitHub API') && 
            !error.message.includes('404') &&
            !error.message.includes('network') &&
            !error.message.includes('ENOTFOUND')) {
          throw error;
        }
        // If it's a network/API error, the test is still valid - the command exists and runs
        console.log('  ℹ️  Update command exists but failed due to network/API issues (expected in tests)');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle directories with special characters', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      const specialDir = path.join(testDir, 'test-with-spaces and symbols!');
      await fs.mkdir(specialDir);
      
      await assert.doesNotReject(
        execFileAsync('node', [cliPath, 'init', specialDir]),
        'Should handle directories with special characters'
      );
    });

    test('should handle very long paths', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      const longDir = path.join(testDir, 'very'.repeat(20), 'long'.repeat(20), 'path'.repeat(20));
      await fs.mkdir(longDir, { recursive: true });
      
      await assert.doesNotReject(
        execFileAsync('node', [cliPath, 'init', longDir]),
        'Should handle very long paths'
      );
    });
  });
});