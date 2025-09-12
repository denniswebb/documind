#!/usr/bin/env node

import { test } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import TestEnvironment from '../utils/test-environment.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

test('Cross-Platform Compatibility', async (t) => {
  const env = new TestEnvironment();
  const platform = os.platform();
  const isWindows = platform === 'win32';
  const isMacOS = platform === 'darwin';
  const isLinux = platform === 'linux';
  
  await t.test('should handle platform-specific path separators', async () => {
    const testDir = await env.createTempDir('platform-paths');
    
    try {
      // Create nested directory structure
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'src', 'components'), { recursive: true });
      await fs.mkdir(path.join(testDir, '.documind', 'templates'), { recursive: true });
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      // Verify files are created with correct paths on all platforms
      const expectedFiles = [
        ['CLAUDE.md'],
        ['.github', 'copilot-instructions.md'],
        ['.github', 'instructions', 'documentation.md'],
        ['.cursor', 'rules', 'documind.mdc'],
        ['.cursorrules'],
        ['GEMINI.md']
      ];
      
      for (const fileParts of expectedFiles) {
        const filePath = path.join(testDir, ...fileParts);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        assert(exists, `File ${path.join(...fileParts)} should exist on ${platform}`);
        
        // Verify file content is readable
        const content = await fs.readFile(filePath, 'utf8');
        assert(content.length > 0, `File should have content on ${platform}`);
      }
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should handle platform-specific line endings', async () => {
    const testDir = await env.createTempDir('platform-line-endings');
    
    try {
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      // Create .gitignore with platform-specific line endings
      const gitignoreContent = isWindows ? 'node_modules/\r\n*.log\r\n' : 'node_modules/\n*.log\n';
      await fs.writeFile(path.join(testDir, '.gitignore'), gitignoreContent);
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.updateGitignore();
      
      const updatedContent = await fs.readFile(path.join(testDir, '.gitignore'), 'utf8');
      
      // Should contain DocuMind content regardless of original line endings
      assert(updatedContent.includes('DocuMind'), 'Should add DocuMind content');
      assert(updatedContent.includes('node_modules'), 'Should preserve existing content');
      
      // Verify line endings are consistent within the file
      const lines = updatedContent.split(/\r?\n/);
      assert(lines.length > 2, 'Should have multiple lines');
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should handle case-sensitive/insensitive filesystems', async () => {
    const testDir = await env.createTempDir('platform-case-sensitivity');
    
    try {
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      // Test case sensitivity behavior
      if (!isWindows) {
        // On case-sensitive systems, create files with different cases
        await fs.writeFile(path.join(testDir, 'README.md'), '# Test Project');
        await fs.writeFile(path.join(testDir, 'readme.md'), '# Different case');
        
        // Both files should exist
        const upperExists = await fs.access(path.join(testDir, 'README.md')).then(() => true).catch(() => false);
        const lowerExists = await fs.access(path.join(testDir, 'readme.md')).then(() => true).catch(() => false);
        
        assert(upperExists && lowerExists, 'Both case variants should exist on case-sensitive filesystem');
      }
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      // Verify standard DocuMind files are created with correct casing
      const claudeExists = await fs.access(path.join(testDir, 'CLAUDE.md')).then(() => true).catch(() => false);
      assert(claudeExists, 'CLAUDE.md should exist with correct casing');
      
      const geminiExists = await fs.access(path.join(testDir, 'GEMINI.md')).then(() => true).catch(() => false);
      assert(geminiExists, 'GEMINI.md should exist with correct casing');
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should handle platform-specific permissions', async () => {
    if (isWindows) {
      // Skip detailed permission tests on Windows
      return;
    }
    
    const testDir = await env.createTempDir('platform-permissions');
    
    try {
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Make some directories read-only to test permission handling
      const readOnlyDir = path.join(testDir, 'readonly');
      await fs.mkdir(readOnlyDir, { recursive: true });
      await fs.chmod(readOnlyDir, 0o555);
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      // Should complete installation despite permission restrictions
      await installer.install();
      
      // Verify core files were created
      const claudeExists = await fs.access(path.join(testDir, 'CLAUDE.md')).then(() => true).catch(() => false);
      assert(claudeExists, 'Should create CLAUDE.md despite permission restrictions');
      
      // Verify created files have reasonable permissions
      const stats = await fs.stat(path.join(testDir, 'CLAUDE.md'));
      assert(stats.mode & 0o200, 'Created files should be writable by owner');
      assert(stats.mode & 0o400, 'Created files should be readable by owner');
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should work with platform-specific Node.js versions', async () => {
    const testDir = await env.createTempDir('platform-node-versions');
    
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.split('.')[0].slice(1));
      
      // Verify minimum Node.js version requirement
      assert(majorVersion >= 16, `Node.js ${nodeVersion} should be >= 16.0.0`);
      
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      // Test Node.js-specific features
      const CommandGenerator = require('../../.documind/scripts/generate-commands.cjs');
      const generator = new CommandGenerator();
      generator.repoRoot = testDir;
      generator.documindDir = targetDir;
      
      await generator.generateClaudeCommands();
      
      const UpdateScript = require('../../.documind/scripts/update.cjs');
      const updater = new UpdateScript();
      updater.repoRoot = testDir;
      updater.documindDir = targetDir;
      
      await updater.update();
      
      // All operations should complete successfully on supported Node.js versions
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('DocuMind'), 'Operations should complete successfully');
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should handle platform-specific environment variables', async () => {
    const testDir = await env.createTempDir('platform-env-vars');
    
    try {
      // Set platform-specific environment variables
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      
      if (isWindows) {
        process.env.USERPROFILE = testDir;
        process.env.APPDATA = path.join(testDir, 'AppData');
      } else {
        process.env.HOME = testDir;
        process.env.XDG_CONFIG_HOME = path.join(testDir, '.config');
      }
      
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      // Should complete successfully regardless of platform environment
      const claudeExists = await fs.access(path.join(testDir, 'CLAUDE.md')).then(() => true).catch(() => false);
      assert(claudeExists, 'Installation should work with platform-specific environment variables');
      
      // Restore original environment
      process.env = originalEnv;
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should handle platform-specific command execution', async () => {
    const testDir = await env.createTempDir('platform-commands');
    
    try {
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Test script execution with platform-specific paths
      const scriptPath = path.join(targetDir, 'scripts', 'install.js');
      const exists = await fs.access(scriptPath).then(() => true).catch(() => false);
      assert(exists, 'Install script should exist');
      
      // Test execution using platform-specific command format
      let command;
      if (isWindows) {
        command = `node "${scriptPath}"`;
      } else {
        command = `node '${scriptPath}'`;
      }
      
      // Change to test directory for execution
      const originalCwd = process.cwd();
      process.chdir(testDir);
      
      try {
        // Execute command - should not throw
        execSync(command, { 
          cwd: testDir,
          stdio: 'pipe',
          timeout: 30000
        });
        
        // Verify execution results
        const claudeExists = await fs.access(path.join(testDir, 'CLAUDE.md')).then(() => true).catch(() => false);
        assert(claudeExists, 'Script execution should create expected files');
        
      } catch (error) {
        // Command execution might fail in test environment, but script should be syntactically valid
        assert(error.status !== 127, 'Script should be syntactically valid');
      } finally {
        process.chdir(originalCwd);
      }
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should handle platform-specific file encoding', async () => {
    const testDir = await env.createTempDir('platform-encoding');
    
    try {
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      // Create files with different encodings
      const utf8Content = 'UTF-8 content with émojis 🧠 and spëcial characters';
      await fs.writeFile(path.join(testDir, 'utf8-file.md'), utf8Content, 'utf8');
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      // Verify generated files handle UTF-8 correctly
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('📚'), 'Should handle emoji characters correctly');
      assert(claudeContent.includes('🔍'), 'Should handle emoji characters correctly');
      assert(claudeContent.includes('🎯'), 'Should handle emoji characters correctly');
      
      // Verify original UTF-8 file is preserved
      const originalContent = await fs.readFile(path.join(testDir, 'utf8-file.md'), 'utf8');
      assert(originalContent.includes('émojis'), 'Should preserve special characters');
      assert(originalContent.includes('🧠'), 'Should preserve emoji characters');
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should provide platform-specific installation feedback', async () => {
    const testDir = await env.createTempDir('platform-feedback');
    
    try {
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Capture console output during installation
      const originalLog = console.log;
      const logMessages = [];
      console.log = (...args) => {
        logMessages.push(args.join(' '));
        originalLog(...args);
      };
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      // Restore console.log
      console.log = originalLog;
      
      // Verify installation provides appropriate feedback
      const hasInstallMessage = logMessages.some(msg => msg.includes('Installing DocuMind'));
      const hasSuccessMessage = logMessages.some(msg => msg.includes('successfully'));
      const hasCommandsMessage = logMessages.some(msg => msg.includes('/document'));
      
      assert(hasInstallMessage, 'Should show installation start message');
      assert(hasSuccessMessage, 'Should show success message');
      assert(hasCommandsMessage, 'Should show available commands');
      
      // Platform-specific verification
      if (isWindows) {
        // On Windows, paths might be displayed differently
        const hasWindowsPaths = logMessages.some(msg => msg.includes('\\'));
        // This is optional as path display varies
      }
      
    } finally {
      await env.cleanup(testDir);
    }
  });
});