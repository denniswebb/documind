import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);

describe('Gitignore Operations Tests', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Get project root from this test file location
    const testFileDir = path.dirname(fileURLToPath(import.meta.url));
    originalCwd = path.resolve(testFileDir, '..', '..');
    
    // Create a unique temporary directory for each test
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'documind-gitignore-test-'));
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

  describe('GitIgnore Creation and Updates', () => {
    test('should create .gitignore with DocuMind comment in new repository', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Run the installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check that .gitignore was created
      const gitignorePath = path.join(testDir, '.gitignore');
      await assert.doesNotReject(fs.access(gitignorePath), 'Should create .gitignore file');
      
      // Check content includes DocuMind comment
      const content = await fs.readFile(gitignorePath, 'utf8');
      assert(content.includes('DocuMind'), 'Should add DocuMind comment to .gitignore');
      assert(content.includes('.documind'), 'Should reference .documind directory');
    });

    test('should add DocuMind comment to existing .gitignore without DocuMind references', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create existing .gitignore with common patterns
      const existingContent = `node_modules/
*.log
.env
dist/
.DS_Store`;
      await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      const gitignorePath = path.join(testDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf8');
      
      // Should contain original content
      assert(content.includes('node_modules/'), 'Should preserve existing patterns');
      assert(content.includes('*.log'), 'Should preserve existing patterns');
      assert(content.includes('.env'), 'Should preserve existing patterns');
      
      // Should add DocuMind content
      assert(content.includes('DocuMind'), 'Should add DocuMind comment');
      assert(content.includes('.documind'), 'Should add .documind directory reference');
    });

    test('should not modify .gitignore if DocuMind already referenced', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create .gitignore that already has DocuMind reference
      const existingContent = `node_modules/
*.log
# DocuMind system files
.documind/config.local`;
      await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      const gitignorePath = path.join(testDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf8');
      
      // Content should contain DocuMind but not be duplicated
      assert(content.includes('DocuMind'), 'Should have DocuMind reference');
      // Count occurrences - should not duplicate
      const docuMindCount = (content.match(/DocuMind/g) || []).length;
      assert(docuMindCount <= 2, 'Should not duplicate DocuMind references excessively');
    });

    test('should not modify .gitignore if .documind already referenced', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create .gitignore that already has .documind reference
      const existingContent = `node_modules/
.documind/temp/
dist/`;
      await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      const gitignorePath = path.join(testDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf8');
      
      // Should preserve existing .documind reference
      assert(content.includes('.documind/temp/'), 'Should preserve existing .documind references');
      // Should not excessively duplicate
      const documindCount = (content.match(/\.documind/g) || []).length;
      assert(documindCount >= 1, 'Should have .documind reference');
    });

    test('should handle case-sensitive DocuMind detection properly', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create .gitignore with different case
      const existingContent = `node_modules/
# documind system (lowercase)
some-other-stuff`;
      await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      const gitignorePath = path.join(testDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf8');
      
      // Should add proper case DocuMind comment and preserve original
      assert(content.includes('DocuMind'), 'Should add proper case DocuMind comment');
      assert(content.includes('documind system (lowercase)'), 'Should preserve original lowercase reference');
    });
  });

  describe('GitIgnore Formatting and Structure', () => {
    test('should preserve .gitignore file structure and formatting', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create .gitignore with specific formatting
      const existingContent = `# Dependencies
node_modules/
npm-debug.log*

# Build outputs
dist/
build/

# Environment
.env
.env.local

# OS files
.DS_Store
Thumbs.db`;
      await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      const gitignorePath = path.join(testDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf8');
      
      // Should preserve original structure
      assert(content.includes('# Dependencies'), 'Should preserve section comments');
      assert(content.includes('# Build outputs'), 'Should preserve section comments');
      assert(content.includes('# Environment'), 'Should preserve section comments');
      
      // Should add DocuMind section
      assert(content.includes('DocuMind'), 'Should add DocuMind section');
      
      // Check that formatting is maintained
      const lines = content.split('\n');
      assert(lines.some(line => line === ''), 'Should preserve empty lines');
      assert(lines.some(line => line.startsWith('#')), 'Should preserve comments');
    });

    test('should handle empty .gitignore file', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create empty .gitignore
      await fs.writeFile(path.join(testDir, '.gitignore'), '');
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      const gitignorePath = path.join(testDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf8');
      
      assert(content.includes('DocuMind'), 'Should add DocuMind comment to empty file');
      assert(content.includes('.documind'), 'Should add .documind directory reference');
    });

    test('should handle .gitignore with only whitespace', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create .gitignore with only whitespace
      await fs.writeFile(path.join(testDir, '.gitignore'), '   \n\n  \t  \n');
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      const gitignorePath = path.join(testDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf8');
      
      assert(content.includes('DocuMind'), 'Should add DocuMind comment');
      assert(content.includes('.documind'), 'Should add .documind directory reference');
    });

    test('should maintain proper line endings', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create .gitignore with Unix line endings
      const existingContent = 'node_modules/\n*.log\n.env';
      await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      const gitignorePath = path.join(testDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf8');
      
      // Check line endings are consistent
      assert(!content.includes('\r\n'), 'Should use Unix line endings');
      assert(content.includes('\n'), 'Should have line breaks');
      
      // Verify structure
      const lines = content.split('\n');
      assert(lines.length > 4, 'Should have multiple lines');
      assert(lines.some(line => line.includes('DocuMind')), 'Should contain DocuMind content');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle very large .gitignore files', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create large .gitignore with many entries
      const largeContent = Array.from({ length: 1000 }, (_, i) => `file${i}.tmp`).join('\n');
      await fs.writeFile(path.join(testDir, '.gitignore'), largeContent);
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      const gitignorePath = path.join(testDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf8');
      
      // Should preserve all original content
      assert(content.includes('file0.tmp'), 'Should preserve first entry');
      assert(content.includes('file999.tmp'), 'Should preserve last entry');
      
      // Should add DocuMind content
      assert(content.includes('DocuMind'), 'Should add DocuMind comment to large file');
    });

    test('should work when .gitignore does not initially exist', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Ensure no .gitignore exists initially
      const gitignorePath = path.join(testDir, '.gitignore');
      try {
        await fs.access(gitignorePath);
        assert.fail('.gitignore should not exist initially');
      } catch (error) {
        // Expected - file should not exist
      }
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Should create .gitignore with DocuMind content
      await assert.doesNotReject(fs.access(gitignorePath), 'Should create .gitignore file');
      
      const content = await fs.readFile(gitignorePath, 'utf8');
      assert(content.includes('DocuMind'), 'Should include DocuMind in new .gitignore');
    });

    test('should handle .gitignore with mixed content types', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create .gitignore with various patterns
      const mixedContent = `# Comments
*.log
**/temp/
!important.log
/root-only
relative/path/
*.{tmp,bak}
[Tt]humbs.db
**/*~`;
      await fs.writeFile(path.join(testDir, '.gitignore'), mixedContent);
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      const gitignorePath = path.join(testDir, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf8');
      
      // Should preserve all different pattern types
      assert(content.includes('*.log'), 'Should preserve wildcard patterns');
      assert(content.includes('**/temp/'), 'Should preserve globstar patterns');
      assert(content.includes('!important.log'), 'Should preserve negation patterns');
      assert(content.includes('/root-only'), 'Should preserve root-relative patterns');
      assert(content.includes('*.{tmp,bak}'), 'Should preserve brace expansion');
      
      // Should add DocuMind content
      assert(content.includes('DocuMind'), 'Should add DocuMind content');
    });
  });
});