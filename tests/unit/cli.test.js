import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execFileAsync = promisify(execFile);

describe('Orchestrator CLI Interface', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(__dirname, '../temp/orchestrator-test');
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('AI Orchestrator', () => {
    it('should execute without ESM-related errors', async () => {
      const orchestratorPath = path.join(__dirname, '../../src/scripts/ai-orchestrator.js');

      try {
        // Execute the orchestrator - it should fail gracefully with proper error message
        const { stdout, stderr } = await execFileAsync('node', [orchestratorPath, 'bootstrap'], {
          cwd: tempDir,
          timeout: 10000 // 10 second timeout
        });

        // Since we don't have DocuMind installed in test dir, it should fail with installation error
        // But it should NOT have ESM-related errors
        assert.ok(!stderr.includes('ReferenceError'),
          'Should not have ReferenceError for __dirname');
        assert.ok(!stderr.includes('__dirname is not defined'),
          'Should not have __dirname undefined error');

      } catch (error) {
        // Expected to fail due to missing DocuMind installation
        // But verify it's not an ESM error
        if (error.stderr) {
          assert.ok(!error.stderr.includes('ReferenceError'),
            'Should not have ReferenceError for __dirname');
          assert.ok(!error.stderr.includes('__dirname is not defined'),
            'Should not have __dirname undefined error');
        }

        // Should get installation error, not ESM error
        if (error.stdout && error.stdout.includes('"error"')) {
          // Parse JSON error response
          try {
            const response = JSON.parse(error.stdout);
            assert.ok(response.error, 'Should have error field in JSON response');
            assert.ok(!response.error.includes('__dirname'), 'Error should not be ESM-related');
          } catch (parseError) {
            // If not valid JSON, that's also fine - just ensure no ESM errors
          }
        }
      }
    });
  });

  describe('Execution Check Compatibility', () => {
    it('should execute when invoked via symlink', async () => {
      const orchestratorPath = path.join(__dirname, '../../src/scripts/ai-orchestrator.js');
      const symlinkPath = path.join(tempDir, 'test-symlink');

      try {
        // Create symlink to orchestrator
        await fs.symlink(orchestratorPath, symlinkPath);

        // Test execution via symlink - should fail gracefully, not with execution check error
        const { stdout } = await execFileAsync('node', [symlinkPath, 'bootstrap'], {
          cwd: tempDir,
          timeout: 5000
        });

        // Should get a proper error response, not silent exit
        assert.ok(stdout.length > 0, 'Should produce output, not silent exit');

      } catch (error) {
        // Expected to fail due to missing installation, but should produce output
        if (error.code === 'EPERM') {
          console.warn('Skipping symlink test due to permissions');
          return;
        }

        // Should get output even on error
        assert.ok(error.stdout && error.stdout.length > 0, 'Should produce output via symlink');
      }
    });

    it('should not use problematic execution check pattern', async () => {
      try {
        const { stdout } = await execFileAsync('grep', [
          '-r',
          'import\\.meta\\.url\\s*===\\s*`file://',
          'src/',
          '--include=*.js'
        ], {
          timeout: 5000
        });

        assert.strictEqual(stdout.trim(), '',
          'Found problematic execution pattern. Use: if (process.argv[1] && import.meta.url.startsWith("file:"))');

      } catch (error) {
        // grep exits with code 1 when no matches found - this is what we want
        if (error.code === 1) {
          assert.ok(true, 'No problematic patterns found');
        } else {
          throw error;
        }
      }
    });
  });

  describe('ESM compatibility', () => {
    it('should import and instantiate orchestrator without errors', async () => {
      // Test that the orchestrator module can be imported
      const orchestratorPath = path.join(__dirname, '../../src/scripts/ai-orchestrator.js');

      const testScript = `
        import('${orchestratorPath}').then(() => {
          console.log('Orchestrator imported successfully');
          process.exit(0);
        }).catch(error => {
          console.error('ESM import failed:', error.message);
          process.exit(1);
        });
      `;

      const { stdout, stderr } = await execFileAsync('node', ['--input-type=module', '-e', testScript], {
        timeout: 5000
      });

      assert.ok(stdout.includes('Orchestrator imported successfully'),
        'Should import orchestrator without ESM errors');
      assert.ok(!stderr.includes('ReferenceError'),
        'Should not have any ReferenceErrors');
    });
  });
});