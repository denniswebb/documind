import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);

describe('Template Processing Tests', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Get project root from this test file location
    const testFileDir = path.dirname(fileURLToPath(import.meta.url));
    originalCwd = path.resolve(testFileDir, '..', '..');
    
    // Create a unique temporary directory for each test
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'documind-template-test-'));
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

  describe('Template Generation and Content', () => {
    test('should generate Claude instructions template with proper structure', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Run the installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check CLAUDE.md template was generated correctly
      const claudePath = path.join(testDir, 'CLAUDE.md');
      const content = await fs.readFile(claudePath, 'utf8');
      
      // Verify template structure
      assert(content.includes('# Claude Instructions'), 'Should have proper heading');
      assert(content.includes('DocuMind'), 'Should reference DocuMind system');
      assert(content.includes('📚 Documentation Commands') || content.includes('Documentation Commands'), 'Should have commands section');
      assert(content.includes('/document bootstrap'), 'Should include bootstrap command');
      assert(content.includes('/document expand'), 'Should include expand command');
      assert(content.includes('Command Recognition') || content.includes('🔍'), 'Should have recognition section');
      
      // Verify markdown formatting
      assert(content.includes('\n## ') || content.includes('\n# '), 'Should have proper markdown headings');
      assert(content.includes('- `/document') || content.includes('* `/document'), 'Should have command list formatting');
    });

    test('should generate Gemini instructions template correctly', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check GEMINI.md template
      const geminiPath = path.join(testDir, 'GEMINI.md');
      const content = await fs.readFile(geminiPath, 'utf8');
      
      assert(content.includes('Gemini'), 'Should have Gemini-specific content');
      assert(content.includes('DocuMind'), 'Should reference DocuMind system');
      assert(content.includes('/document'), 'Should include document commands');
      assert(content.length > 100, 'Should have substantial content');
    });

    test('should generate Copilot instructions template', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check GitHub Copilot instructions
      const copilotPath = path.join(testDir, '.github/copilot-instructions.md');
      const content = await fs.readFile(copilotPath, 'utf8');
      
      assert(content.includes('DocuMind') || content.includes('Documentation'), 'Should reference documentation system');
      assert(content.includes('/document') || content.includes('document'), 'Should mention document commands');
      assert(content.length > 50, 'Should have meaningful content');
    });

    test('should generate Cursor rules template', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check Cursor rules
      const cursorPath = path.join(testDir, '.cursor/rules/documind.mdc');
      const content = await fs.readFile(cursorPath, 'utf8');
      
      assert(content.includes('DocuMind') || content.includes('Documentation'), 'Should reference documentation system');
      assert(content.includes('/document') || content.includes('document'), 'Should mention document commands');
      assert(content.length > 50, 'Should have meaningful content');
    });
  });

  describe('Template Content Integration', () => {
    test('should include system and commands content in templates', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check that system.md and commands.md were created and have content
      const systemPath = path.join(testDir, '.documind/core/system.md');
      const commandsPath = path.join(testDir, '.documind/core/commands.md');
      
      await assert.doesNotReject(fs.access(systemPath), 'Should create system.md');
      await assert.doesNotReject(fs.access(commandsPath), 'Should create commands.md');
      
      const systemContent = await fs.readFile(systemPath, 'utf8');
      const commandsContent = await fs.readFile(commandsPath, 'utf8');
      
      assert(systemContent.length > 100, 'system.md should have substantial content');
      assert(commandsContent.length > 50, 'commands.md should have content');
      assert(commandsContent.includes('document'), 'commands.md should reference document commands');
      
      // Verify templates reference the core content appropriately
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('system.md') || claudeContent.includes('commands.md') || 
             systemContent.slice(0, 50).split(' ').some(word => word.length > 3 && claudeContent.includes(word)),
             'Template should integrate with core system files');
    });

    test('should maintain consistent command structure across templates', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Read all AI configuration templates
      const templates = {
        claude: await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8'),
        gemini: await fs.readFile(path.join(testDir, 'GEMINI.md'), 'utf8'),
        copilot: await fs.readFile(path.join(testDir, '.github/copilot-instructions.md'), 'utf8'),
        cursor: await fs.readFile(path.join(testDir, '.cursor/rules/documind.mdc'), 'utf8')
      };
      
      // Verify consistent command structure
      const expectedCommands = ['bootstrap', 'expand', 'update', 'analyze'];
      
      for (const [toolName, template] of Object.entries(templates)) {
        assert(template.includes('/document') || template.includes('document'), 
               `${toolName} template should include document commands`);
        
        // At least some of the key commands should be mentioned
        const commandsFound = expectedCommands.filter(cmd => template.includes(cmd));
        assert(commandsFound.length >= 2, 
               `${toolName} template should include multiple key commands (found: ${commandsFound})`);
      }
    });
  });

  describe('Template Formatting and Structure', () => {
    test('should generate well-formatted markdown templates', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      
      // Check markdown structure
      const lines = claudeContent.split('\n');
      assert(lines.some(line => line.startsWith('# ')), 'Should have main heading');
      assert(lines.some(line => line.startsWith('## ') || line.startsWith('### ')), 'Should have subheadings');
      assert(lines.some(line => line.startsWith('- ') || line.startsWith('* ')), 'Should have list items');
      
      // Check for proper line breaks and structure
      assert(lines.length > 10, 'Should have substantial content with multiple lines');
      assert(lines.some(line => line.trim() === ''), 'Should have empty lines for spacing');
    });

    test('should preserve template formatting consistency', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Check multiple templates for formatting consistency
      const templates = [
        path.join(testDir, 'CLAUDE.md'),
        path.join(testDir, 'GEMINI.md'),
        path.join(testDir, '.github/copilot-instructions.md'),
        path.join(testDir, '.cursor/rules/documind.mdc')
      ];
      
      for (const templatePath of templates) {
        const content = await fs.readFile(templatePath, 'utf8');
        const lines = content.split('\n');
        
        // Basic formatting checks
        assert(lines.length > 5, `Template ${path.basename(templatePath)} should have multiple lines`);
        assert(content.length > 50, `Template ${path.basename(templatePath)} should have substantial content`);
        
        // Should not have obvious formatting errors
        assert(!content.includes('undefined'), `Template ${path.basename(templatePath)} should not have undefined values`);
        assert(!content.includes('{{'), `Template ${path.basename(templatePath)} should not have unprocessed template vars`);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle template generation with custom project structure', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Create a custom project structure before installation
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'docs'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'custom-project',
        version: '2.0.0',
        description: 'A custom structured project'
      }, null, 2));
      
      await fs.writeFile(path.join(testDir, 'README.md'), '# Custom Project\nThis is a custom project structure.');
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Templates should still be generated correctly
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('DocuMind'), 'Should generate templates even with custom structure');
      assert(claudeContent.includes('/document'), 'Should include proper commands');
      
      // Original project files should be preserved
      const packageContent = await fs.readFile(path.join(testDir, 'package.json'), 'utf8');
      const packageData = JSON.parse(packageContent);
      assert.strictEqual(packageData.name, 'custom-project', 'Should preserve original package.json');
    });

    test('should work in projects with existing AI tool configurations', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Pre-create some AI configuration files
      await fs.writeFile(path.join(testDir, 'CLAUDE.md'), '# Existing Claude Config\nSome existing content');
      await fs.writeFile(path.join(testDir, '.cursorrules'), 'existing cursor rules content');
      
      // Run installer
      await execFileAsync('node', [cliPath, 'init', testDir]);
      
      // Should enhance existing configurations
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('DocuMind'), 'Should enhance existing Claude config with DocuMind');
      
      // Should create other templates
      await assert.doesNotReject(fs.access(path.join(testDir, 'GEMINI.md')), 'Should create other templates');
    });

    test('should handle template generation in various directory structures', async () => {
      // Ensure originalCwd is set, fallback if not
      const projectRoot = originalCwd || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const cliPath = path.resolve(projectRoot, 'cli.js');
      
      // Test with deeply nested target directory
      const nestedDir = path.join(testDir, 'projects', 'my-app', 'workspace');
      await fs.mkdir(nestedDir, { recursive: true });
      
      await execFileAsync('node', [cliPath, 'init', nestedDir]);
      
      // Templates should be generated in the target directory
      await assert.doesNotReject(fs.access(path.join(nestedDir, 'CLAUDE.md')), 'Should create templates in nested directory');
      await assert.doesNotReject(fs.access(path.join(nestedDir, '.documind')), 'Should create .documind in nested directory');
      
      const claudeContent = await fs.readFile(path.join(nestedDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('DocuMind'), 'Should generate proper templates in nested structure');
    });
  });
});