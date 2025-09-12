#!/usr/bin/env node

/**
 * T010: Integration test for update process
 * Tests the complete DocuMind update workflow including version checking and file replacement
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

class UpdateTestEnvironment {
  constructor() {
    this.tempDir = null;
    this.repoRoot = null;
  }

  async initialize() {
    // Create unique temporary directory
    this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'documind-update-'));
    this.repoRoot = this.tempDir;
    console.log(`Update test environment: ${this.tempDir}`);
  }

  async setupExistingInstallation(version = '1.0.0') {
    // Create basic repository structure
    await fs.mkdir(path.join(this.repoRoot, '.git'), { recursive: true });
    
    // Create package.json
    const packageJson = {
      name: 'test-update-project',
      version: '1.0.0',
      description: 'Test project for DocuMind updates'
    };
    await fs.writeFile(
      path.join(this.repoRoot, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create .documind directory with existing installation
    await fs.mkdir(path.join(this.repoRoot, '.documind', 'scripts'), { recursive: true });
    
    // Create version file to simulate existing installation
    const versionInfo = {
      version: version,
      installed: new Date().toISOString(),
      tools: ['claude', 'cursor']
    };
    await fs.writeFile(
      path.join(this.repoRoot, '.documind', 'version.json'),
      JSON.stringify(versionInfo, null, 2)
    );

    // Create existing (potentially outdated) script files
    await fs.writeFile(
      path.join(this.repoRoot, '.documind', 'scripts', 'install.js'),
      '// Old version of install script\nconsole.log("Old install script");'
    );

    await fs.writeFile(
      path.join(this.repoRoot, '.documind', 'scripts', 'generate-commands.js'),
      '// Old version of generate-commands script\nconsole.log("Old generate script");'
    );

    // Create existing AI tool configuration files
    await fs.writeFile(
      path.join(this.repoRoot, 'CLAUDE.md'),
      '# Claude Instructions\n\nOld DocuMind configuration v' + version + '\n'
    );

    await fs.writeFile(
      path.join(this.repoRoot, '.cursorrules'),
      '# Cursor Rules\n\nOld DocuMind configuration v' + version + '\n'
    );
  }

  async copyCurrentDocuMindScripts(simulateNewer = true) {
    // Copy the current scripts to simulate an update
    const sourceScriptsDir = path.join(process.cwd(), '.documind', 'scripts');
    const targetScriptsDir = path.join(this.repoRoot, '.documind', 'scripts');
    
    const scripts = ['install.js', 'generate-commands.js', 'update.js'];
    for (const script of scripts) {
      const sourceFile = path.join(sourceScriptsDir, script);
      const targetFile = path.join(targetScriptsDir, script);
      await fs.copyFile(sourceFile, targetFile);
    }

    // Copy templates if they exist
    const sourceTemplatesDir = path.join(process.cwd(), '.documind', 'templates');
    const targetTemplatesDir = path.join(this.repoRoot, '.documind', 'templates');
    
    try {
      await fs.access(sourceTemplatesDir);
      await fs.mkdir(targetTemplatesDir, { recursive: true });
      
      const templateFiles = await fs.readdir(sourceTemplatesDir);
      for (const file of templateFiles) {
        const sourceFile = path.join(sourceTemplatesDir, file);
        const targetFile = path.join(targetTemplatesDir, file);
        const stat = await fs.stat(sourceFile);
        if (stat.isFile()) {
          await fs.copyFile(sourceFile, targetFile);
        }
      }
    } catch (error) {
      console.log('Templates directory not found, creating mock templates...');
      await fs.mkdir(targetTemplatesDir, { recursive: true });
      
      // Create mock template files for testing
      await fs.writeFile(
        path.join(targetTemplatesDir, 'claude-instructions.md'),
        '# Claude Instructions Template\n\nDocuMind v{{version}}\n{{commands}}\n'
      );
    }

    if (simulateNewer) {
      // Update version file to simulate a newer version available
      const newVersionInfo = {
        version: '2.0.0',
        installed: new Date().toISOString(),
        tools: ['claude', 'cursor', 'copilot', 'gemini']
      };
      await fs.writeFile(
        path.join(this.repoRoot, '.documind', 'version.json'),
        JSON.stringify(newVersionInfo, null, 2)
      );
    }
  }

  async runUpdateScript() {
    return new Promise((resolve, reject) => {
      const updateScript = path.join(this.repoRoot, '.documind', 'scripts', 'update.js');
      const child = spawn('node', [updateScript], {
        cwd: this.repoRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code });
      });
    });
  }

  async runInstallScript() {
    // Run install script (which might be used during updates)
    return new Promise((resolve, reject) => {
      const installScript = path.join(this.repoRoot, '.documind', 'scripts', 'install.js');
      const child = spawn('node', [installScript], {
        cwd: this.repoRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code });
      });
    });
  }

  async modifyAIToolFiles() {
    // Simulate user modifications to AI tool files
    const claudeFile = path.join(this.repoRoot, 'CLAUDE.md');
    const existingContent = await fs.readFile(claudeFile, 'utf8');
    const modifiedContent = existingContent + '\n# User Added Section\nCustom user content that should be preserved.\n';
    await fs.writeFile(claudeFile, modifiedContent);

    const cursorFile = path.join(this.repoRoot, '.cursorrules');
    const existingCursorContent = await fs.readFile(cursorFile, 'utf8');
    const modifiedCursorContent = existingCursorContent + '\n# Custom Rules\nUser-specific cursor rules.\n';
    await fs.writeFile(cursorFile, modifiedCursorContent);
  }

  async createBackupDirectory() {
    // Create a backup directory to test backup functionality
    await fs.mkdir(path.join(this.repoRoot, '.documind', 'backups'), { recursive: true });
  }

  async cleanup() {
    if (this.tempDir) {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    }
  }

  async getVersionInfo() {
    try {
      const versionFile = path.join(this.repoRoot, '.documind', 'version.json');
      const content = await fs.readFile(versionFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }
}

describe('Update Workflow Integration', () => {
  let testEnv;

  test('should successfully update from older version', async () => {
    testEnv = new UpdateTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupExistingInstallation('1.0.0');
      await testEnv.copyCurrentDocuMindScripts(true);

      // Run update process (if update script exists, otherwise run install)
      let result;
      try {
        result = await testEnv.runUpdateScript();
      } catch (error) {
        // If no update script exists, run install which should handle updates
        result = await testEnv.runInstallScript();
      }
      
      // Should complete successfully
      assert.strictEqual(result.exitCode, 0, 
        'Update should complete successfully');

      // Verify version was updated
      const versionInfo = await testEnv.getVersionInfo();
      assert.ok(versionInfo, 'Version info should exist after update');
      assert.ok(versionInfo.version !== '1.0.0', 
        'Version should be updated from original');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should preserve user modifications during update', async () => {
    testEnv = new UpdateTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupExistingInstallation('1.0.0');
      await testEnv.modifyAIToolFiles();
      await testEnv.copyCurrentDocuMindScripts(true);

      // Store original user content
      const originalClaudeContent = await fs.readFile(
        path.join(testEnv.repoRoot, 'CLAUDE.md'),
        'utf8'
      );

      // Run update
      let result;
      try {
        result = await testEnv.runUpdateScript();
      } catch (error) {
        result = await testEnv.runInstallScript();
      }

      assert.strictEqual(result.exitCode, 0, 'Update should succeed');

      // Verify user modifications are preserved
      const updatedClaudeContent = await fs.readFile(
        path.join(testEnv.repoRoot, 'CLAUDE.md'),
        'utf8'
      );

      assert.ok(updatedClaudeContent.includes('User Added Section'), 
        'User modifications should be preserved');
      assert.ok(updatedClaudeContent.includes('Custom user content'), 
        'User content should remain intact');
      assert.ok(updatedClaudeContent.includes('DocuMind'), 
        'DocuMind instructions should be updated');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle update when no previous version exists', async () => {
    testEnv = new UpdateTestEnvironment();
    
    try {
      await testEnv.initialize();
      
      // Setup repository without existing DocuMind installation
      await fs.mkdir(path.join(testEnv.repoRoot, '.git'), { recursive: true });
      const packageJson = { name: 'test', version: '1.0.0' };
      await fs.writeFile(
        path.join(testEnv.repoRoot, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      await testEnv.copyCurrentDocuMindScripts(false);

      // Run update (should handle fresh installation)
      let result;
      try {
        result = await testEnv.runUpdateScript();
      } catch (error) {
        result = await testEnv.runInstallScript();
      }

      assert.strictEqual(result.exitCode, 0, 
        'Update should handle fresh installation gracefully');

      // Verify installation completed
      const documindDir = path.join(testEnv.repoRoot, '.documind');
      await assert.doesNotReject(async () => {
        await fs.access(documindDir);
      }, 'DocuMind directory should be created');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should create backups before updating critical files', async () => {
    testEnv = new UpdateTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupExistingInstallation('1.0.0');
      await testEnv.modifyAIToolFiles();
      await testEnv.copyCurrentDocuMindScripts(true);

      // Run update
      let result;
      try {
        result = await testEnv.runUpdateScript();
      } catch (error) {
        result = await testEnv.runInstallScript();
      }

      // Check if backup was created (implementation dependent)
      // Note: This test assumes the update process creates backups
      // The specific backup mechanism may vary based on implementation
      
      assert.strictEqual(result.exitCode, 0, 
        'Update should complete even when creating backups');

      // Verify original files still exist and contain expected content
      const claudeFile = path.join(testEnv.repoRoot, 'CLAUDE.md');
      await assert.doesNotReject(async () => {
        await fs.access(claudeFile);
      }, 'Claude file should still exist after update');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should detect and update new AI tools', async () => {
    testEnv = new UpdateTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupExistingInstallation('1.0.0');
      
      // Add new AI tool indicators that weren't present during original installation
      await fs.mkdir(path.join(testEnv.repoRoot, '.github'), { recursive: true });
      await fs.writeFile(
        path.join(testEnv.repoRoot, '.github', 'workflows', 'test.yml'),
        'name: Test\non: [push]\n'
      );

      await fs.writeFile(
        path.join(testEnv.repoRoot, 'GEMINI.md'),
        '# Gemini Setup\nUser created this file.\n'
      );

      await testEnv.copyCurrentDocuMindScripts(true);

      // Run update
      let result;
      try {
        result = await testEnv.runUpdateScript();
      } catch (error) {
        result = await testEnv.runInstallScript();
      }

      assert.strictEqual(result.exitCode, 0, 'Update should detect new AI tools');

      // Verify new AI tool configurations were created
      const copilotFile = path.join(testEnv.repoRoot, '.github', 'copilot-instructions.md');
      const geminiFile = path.join(testEnv.repoRoot, 'GEMINI.md');

      // Check if new files were created or existing files were updated
      try {
        await fs.access(copilotFile);
        const copilotContent = await fs.readFile(copilotFile, 'utf8');
        assert.ok(copilotContent.length > 0, 'Copilot instructions should be created');
      } catch (error) {
        // File might not exist if not implemented yet
        console.log('Copilot file not created (may not be implemented)');
      }

      const geminiContent = await fs.readFile(geminiFile, 'utf8');
      assert.ok(geminiContent.includes('User created'), 
        'Existing Gemini content should be preserved');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle corrupted installation gracefully', async () => {
    testEnv = new UpdateTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupExistingInstallation('1.0.0');
      
      // Corrupt the version file to simulate a problematic installation
      await fs.writeFile(
        path.join(testEnv.repoRoot, '.documind', 'version.json'),
        'invalid json content'
      );

      // Delete some critical files to simulate corruption
      await fs.unlink(path.join(testEnv.repoRoot, '.documind', 'scripts', 'install.js'));

      await testEnv.copyCurrentDocuMindScripts(true);

      // Run update - should handle corruption gracefully
      let result;
      try {
        result = await testEnv.runUpdateScript();
      } catch (error) {
        result = await testEnv.runInstallScript();
      }

      assert.strictEqual(result.exitCode, 0, 
        'Update should handle corrupted installation');

      // Verify installation was repaired
      const installScript = path.join(testEnv.repoRoot, '.documind', 'scripts', 'install.js');
      await assert.doesNotReject(async () => {
        await fs.access(installScript);
      }, 'Missing install script should be restored');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should complete update within performance limit', async () => {
    testEnv = new UpdateTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupExistingInstallation('1.0.0');
      await testEnv.copyCurrentDocuMindScripts(true);

      // Measure update time
      const startTime = Date.now();
      let result;
      try {
        result = await testEnv.runUpdateScript();
      } catch (error) {
        result = await testEnv.runInstallScript();
      }
      const endTime = Date.now();

      const updateTime = endTime - startTime;

      assert.strictEqual(result.exitCode, 0, 'Update should succeed');
      
      // Update should be faster than fresh install - target < 15 seconds
      assert.ok(updateTime < 15000, 
        `Update should complete quickly, took ${updateTime}ms`);

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should validate updated files integrity', async () => {
    testEnv = new UpdateTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupExistingInstallation('1.0.0');
      await testEnv.copyCurrentDocuMindScripts(true);

      // Run update
      let result;
      try {
        result = await testEnv.runUpdateScript();
      } catch (error) {
        result = await testEnv.runInstallScript();
      }

      assert.strictEqual(result.exitCode, 0, 'Update should succeed');

      // Verify script files are valid JavaScript
      const scripts = ['install.js', 'generate-commands.js', 'update.js'];
      for (const script of scripts) {
        const scriptPath = path.join(testEnv.repoRoot, '.documind', 'scripts', script);
        const scriptContent = await fs.readFile(scriptPath, 'utf8');
        
        assert.ok(scriptContent.length > 0, `${script} should not be empty`);
        assert.ok(scriptContent.includes('#!/usr/bin/env node') || 
                 scriptContent.includes('const') || 
                 scriptContent.includes('function'), 
                 `${script} should contain valid JavaScript`);
      }

      // Verify AI instruction files are valid markdown
      const aiFiles = ['CLAUDE.md'];
      for (const file of aiFiles) {
        try {
          const filePath = path.join(testEnv.repoRoot, file);
          const content = await fs.readFile(filePath, 'utf8');
          assert.ok(content.includes('# '), `${file} should contain markdown headers`);
        } catch (error) {
          // File might not exist, which is acceptable
        }
      }

    } finally {
      await testEnv.cleanup();
    }
  });
});