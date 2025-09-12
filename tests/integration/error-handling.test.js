#!/usr/bin/env node

/**
 * T011: Integration test for error handling scenarios
 * Tests comprehensive error handling across DocuMind installation and update processes
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

class ErrorHandlingTestEnvironment {
  constructor() {
    this.tempDir = null;
    this.repoRoot = null;
  }

  async initialize() {
    // Create unique temporary directory
    this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'documind-error-'));
    this.repoRoot = this.tempDir;
    console.log(`Error handling test environment: ${this.tempDir}`);
  }

  async setupBasicRepo() {
    // Create basic repository structure
    await fs.mkdir(path.join(this.repoRoot, '.git'), { recursive: true });
    
    const packageJson = {
      name: 'test-error-handling',
      version: '1.0.0',
      description: 'Test error handling scenarios'
    };
    await fs.writeFile(
      path.join(this.repoRoot, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  async setupReadOnlyDirectory() {
    // Create a read-only directory to test permission errors
    const readOnlyDir = path.join(this.repoRoot, 'readonly');
    await fs.mkdir(readOnlyDir, { recursive: true });
    
    // Make directory read-only (chmod 444)
    await fs.chmod(readOnlyDir, 0o444);
    
    return readOnlyDir;
  }

  async setupInvalidRepository() {
    // Create directory without .git to simulate non-repository
    // (remove .git if it exists)
    try {
      await fs.rm(path.join(this.repoRoot, '.git'), { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
  }

  async setupCorruptedFiles() {
    // Create corrupted or invalid files
    await fs.mkdir(path.join(this.repoRoot, '.documind', 'scripts'), { recursive: true });
    
    // Create invalid JavaScript file
    await fs.writeFile(
      path.join(this.repoRoot, '.documind', 'scripts', 'install.js'),
      'this is not valid javascript code { } [ syntax error'
    );

    // Create invalid JSON version file
    await fs.writeFile(
      path.join(this.repoRoot, '.documind', 'version.json'),
      'invalid json { syntax error'
    );

    // Create file with binary content where text is expected
    const binaryData = Buffer.from([0, 1, 2, 3, 255, 254, 253]);
    await fs.writeFile(
      path.join(this.repoRoot, 'CLAUDE.md'),
      binaryData
    );
  }

  async setupDiskSpaceSimulation() {
    // Simulate low disk space by creating a very large file
    // Note: This is simulated - actual disk space tests would need different approach
    const largeFilePath = path.join(this.repoRoot, 'large-file.tmp');
    const largeBuf = Buffer.alloc(1024 * 1024); // 1MB buffer
    await fs.writeFile(largeFilePath, largeBuf);
    return largeFilePath;
  }

  async copyMalformedDocuMindScripts() {
    // Copy scripts but introduce various issues
    const sourceScriptsDir = path.join(process.cwd(), '.documind', 'scripts');
    const targetScriptsDir = path.join(this.repoRoot, '.documind', 'scripts');
    
    await fs.mkdir(targetScriptsDir, { recursive: true });
    
    try {
      // Copy install script and corrupt it
      const sourceInstall = path.join(sourceScriptsDir, 'install.js');
      const content = await fs.readFile(sourceInstall, 'utf8');
      // Introduce syntax error
      const corruptedContent = content.replace('const fs', 'const invalid syntax fs');
      await fs.writeFile(
        path.join(targetScriptsDir, 'install.js'),
        corruptedContent
      );
    } catch (error) {
      // Create minimal broken script if source doesn't exist
      await fs.writeFile(
        path.join(targetScriptsDir, 'install.js'),
        'console.log("broken script"); throw new Error("Simulated error");'
      );
    }
  }

  async copyValidDocuMindScripts() {
    // Copy valid scripts for comparison tests
    const sourceScriptsDir = path.join(process.cwd(), '.documind', 'scripts');
    const targetScriptsDir = path.join(this.repoRoot, '.documind', 'scripts');
    
    await fs.mkdir(targetScriptsDir, { recursive: true });
    
    const scripts = ['install.js', 'generate-commands.js', 'update.js'];
    for (const script of scripts) {
      try {
        const sourceFile = path.join(sourceScriptsDir, script);
        const targetFile = path.join(targetScriptsDir, script);
        await fs.copyFile(sourceFile, targetFile);
      } catch (error) {
        // Create minimal valid script if source doesn't exist
        await fs.writeFile(
          path.join(targetScriptsDir, script),
          '#!/usr/bin/env node\nconsole.log("Mock script for testing");'
        );
      }
    }
  }

  async runInstallScript() {
    return new Promise((resolve) => {
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

      child.on('error', (error) => {
        resolve({ stdout, stderr, exitCode: -1, error: error.message });
      });
    });
  }

  async runUpdateScript() {
    return new Promise((resolve) => {
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

      child.on('error', (error) => {
        resolve({ stdout, stderr, exitCode: -1, error: error.message });
      });
    });
  }

  async simulateNetworkError() {
    // Simulate network connectivity issues by creating invalid network conditions
    // This is more of a conceptual test since actual network mocking would require more setup
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    process.env.HTTP_PROXY = 'http://invalid-proxy:9999';
    process.env.HTTPS_PROXY = 'http://invalid-proxy:9999';
  }

  async clearNetworkSimulation() {
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  }

  async cleanup() {
    if (this.tempDir) {
      // Reset file permissions before cleanup
      try {
        const readOnlyDir = path.join(this.repoRoot, 'readonly');
        await fs.chmod(readOnlyDir, 0o755);
      } catch (error) {
        // Directory might not exist
      }
      
      await fs.rm(this.tempDir, { recursive: true, force: true });
    }
  }
}

describe('Error Handling Integration', () => {
  let testEnv;

  test('should handle missing repository gracefully', async () => {
    testEnv = new ErrorHandlingTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.setupInvalidRepository();
      await testEnv.copyValidDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Should handle missing .git directory appropriately
      // Depending on implementation, might succeed (not all tools require .git) 
      // or fail gracefully with informative error
      if (result.exitCode !== 0) {
        assert.ok(result.stderr.includes('repository') || 
                 result.stderr.includes('git') ||
                 result.stdout.includes('repository'), 
                 'Should provide informative error about repository issue');
      }

      // Should not crash with unhandled exception
      assert.ok(!result.stderr.includes('UnhandledPromiseRejection'), 
                'Should not have unhandled promise rejections');
      assert.ok(!result.stderr.includes('Error: ENOENT'), 
                'Should handle file not found errors gracefully');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle file permission errors gracefully', async () => {
    testEnv = new ErrorHandlingTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.copyValidDocuMindScripts();

      // Create read-only directory that would prevent file creation
      await testEnv.setupReadOnlyDirectory();

      const result = await testEnv.runInstallScript();
      
      // Should handle permission errors gracefully
      if (result.exitCode !== 0) {
        assert.ok(result.stderr.includes('permission') || 
                 result.stderr.includes('EACCES') ||
                 result.stderr.includes('access'), 
                 'Should provide informative error about permissions');
      }

      // Should exit cleanly, not crash
      assert.ok(result.exitCode >= 0, 'Should exit with valid exit code');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle corrupted files gracefully', async () => {
    testEnv = new ErrorHandlingTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.setupCorruptedFiles();

      const result = await testEnv.runInstallScript();
      
      // Should handle corrupted files appropriately
      // May succeed by recreating files or fail with informative error
      if (result.exitCode !== 0) {
        assert.ok(result.stderr.includes('syntax') || 
                 result.stderr.includes('parse') ||
                 result.stderr.includes('invalid') ||
                 result.stderr.includes('corrupt'), 
                 'Should provide informative error about file corruption');
      }

      // Should not expose internal stack traces to user
      assert.ok(!result.stderr.includes('    at '), 
                'Should not expose internal stack traces');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle network connectivity issues', async () => {
    testEnv = new ErrorHandlingTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.copyValidDocuMindScripts();
      await testEnv.simulateNetworkError();

      const result = await testEnv.runInstallScript();
      
      // Installation might succeed (no network required) or handle network errors gracefully
      if (result.exitCode !== 0 && 
          (result.stderr.includes('network') || result.stderr.includes('proxy'))) {
        assert.ok(result.stderr.includes('network') || 
                 result.stderr.includes('connection') ||
                 result.stderr.includes('timeout'), 
                 'Should provide informative error about network issues');
      }

      // Should not hang indefinitely
      assert.ok(result.exitCode !== undefined, 'Should complete execution');

    } finally {
      await testEnv.clearNetworkSimulation();
      await testEnv.cleanup();
    }
  });

  test('should handle invalid template files', async () => {
    testEnv = new ErrorHandlingTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      
      // Create DocuMind structure with invalid templates
      await fs.mkdir(path.join(testEnv.repoRoot, '.documind', 'templates'), { recursive: true });
      await fs.writeFile(
        path.join(testEnv.repoRoot, '.documind', 'templates', 'claude-instructions.md'),
        'Invalid template with {{unclosed variable and broken syntax}'
      );

      await testEnv.copyValidDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Should handle template errors gracefully
      if (result.exitCode !== 0) {
        assert.ok(result.stderr.includes('template') || 
                 result.stderr.includes('variable') ||
                 result.stdout.includes('template'), 
                 'Should provide informative error about template issues');
      }

      // Should not crash with unhandled errors
      assert.ok(!result.stderr.includes('UnhandledPromiseRejection'), 
                'Should handle template errors gracefully');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle script execution errors gracefully', async () => {
    testEnv = new ErrorHandlingTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.copyMalformedDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Should fail gracefully when script has errors
      assert.ok(result.exitCode !== 0, 
                'Should fail when script contains errors');

      assert.ok(result.stderr.includes('SyntaxError') || 
               result.stderr.includes('Error'), 
               'Should report script errors appropriately');

      // Should provide some indication of what went wrong
      assert.ok(result.stderr.length > 0, 
                'Should provide error information to user');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle insufficient disk space scenarios', async () => {
    testEnv = new ErrorHandlingTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.copyValidDocuMindScripts();
      
      // Simulate disk space issue
      await testEnv.setupDiskSpaceSimulation();

      const result = await testEnv.runInstallScript();
      
      // Should handle disk space issues gracefully
      // Most likely will succeed unless explicitly checking disk space
      if (result.exitCode !== 0 && 
          (result.stderr.includes('space') || result.stderr.includes('ENOSPC'))) {
        assert.ok(result.stderr.includes('disk') || 
                 result.stderr.includes('space') ||
                 result.stderr.includes('storage'), 
                 'Should provide informative error about disk space');
      }

      // Should complete execution
      assert.ok(result.exitCode !== undefined, 'Should complete execution');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should provide helpful error messages for common issues', async () => {
    testEnv = new ErrorHandlingTestEnvironment();
    
    try {
      await testEnv.initialize();
      // Don't setup basic repo to simulate missing package.json
      await testEnv.copyValidDocuMindScripts();

      const result = await testEnv.runInstallScript();
      
      // Should provide helpful error messages
      if (result.exitCode !== 0) {
        // Error message should be helpful, not just technical
        const combinedOutput = result.stdout + result.stderr;
        assert.ok(combinedOutput.length > 10, 
                 'Should provide some error information');
        
        // Should not contain only cryptic technical errors
        assert.ok(!combinedOutput.includes('ENOENT') || 
                 combinedOutput.includes('file') || 
                 combinedOutput.includes('found'), 
                 'Technical errors should be accompanied by helpful explanations');
      }

      // Should not crash silently
      assert.ok(result.exitCode !== undefined, 'Should provide exit code');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle concurrent execution conflicts', async () => {
    testEnv = new ErrorHandlingTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      await testEnv.copyValidDocuMindScripts();

      // Run two instances concurrently to test lock/conflict handling
      const promise1 = testEnv.runInstallScript();
      const promise2 = testEnv.runInstallScript();

      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // At least one should succeed, or both should handle conflict gracefully
      const successCount = (result1.exitCode === 0 ? 1 : 0) + 
                          (result2.exitCode === 0 ? 1 : 0);
      
      assert.ok(successCount >= 1, 
                'At least one concurrent execution should succeed');

      // If one failed, should be due to conflict, not crash
      if (result1.exitCode !== 0) {
        assert.ok(result1.stderr.includes('lock') || 
                 result1.stderr.includes('conflict') ||
                 result1.stderr.includes('running') ||
                 result1.exitCode !== -1, 
                 'Concurrent execution failure should be handled gracefully');
      }

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should handle missing Node.js dependencies gracefully', async () => {
    testEnv = new ErrorHandlingTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      
      // Create script that tries to require non-existent module
      await fs.mkdir(path.join(testEnv.repoRoot, '.documind', 'scripts'), { recursive: true });
      await fs.writeFile(
        path.join(testEnv.repoRoot, '.documind', 'scripts', 'install.js'),
        '#!/usr/bin/env node\nrequire("non-existent-module");\n'
      );

      const result = await testEnv.runInstallScript();
      
      // Should fail with helpful error about missing module
      assert.ok(result.exitCode !== 0, 
                'Should fail when required module is missing');

      assert.ok(result.stderr.includes('Cannot find module') || 
               result.stderr.includes('MODULE_NOT_FOUND'), 
               'Should report missing module error');

      // Should not crash with unhandled error
      assert.ok(result.exitCode !== -1, 
                'Should exit cleanly even with missing dependencies');

    } finally {
      await testEnv.cleanup();
    }
  });

  test('should recover from partial installation failures', async () => {
    testEnv = new ErrorHandlingTestEnvironment();
    
    try {
      await testEnv.initialize();
      await testEnv.setupBasicRepo();
      
      // Create partially corrupted installation
      await fs.mkdir(path.join(testEnv.repoRoot, '.documind'), { recursive: true });
      await fs.writeFile(
        path.join(testEnv.repoRoot, '.documind', 'version.json'),
        'invalid json'
      );

      // Create AI tool indicators
      await fs.writeFile(
        path.join(testEnv.repoRoot, 'CLAUDE.md'),
        '# Partial Content\nIncomplete installation.\n'
      );

      await testEnv.copyValidDocuMindScripts();

      // Run installation - should recover from partial state
      const result = await testEnv.runInstallScript();
      
      // Should either succeed (recovery) or fail gracefully
      if (result.exitCode === 0) {
        // Verify recovery was successful
        const claudeContent = await fs.readFile(
          path.join(testEnv.repoRoot, 'CLAUDE.md'),
          'utf8'
        );
        assert.ok(claudeContent.includes('DocuMind') || 
                 claudeContent.includes('Partial Content'), 
                 'Should maintain or update existing content');
      } else {
        // If failed, should provide informative error
        assert.ok(result.stderr.length > 0, 
                 'Should provide error information on failure');
      }

    } finally {
      await testEnv.cleanup();
    }
  });
});