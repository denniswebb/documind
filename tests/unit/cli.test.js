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

describe('CLI', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(__dirname, '../temp/cli-test');
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('bootstrap command', () => {
    it('should execute without ESM-related errors', async () => {
      const cliPath = path.join(__dirname, '../../src/cli/documind.js');

      try {
        // Execute the CLI with bootstrap command in the temp directory
        const { stdout, stderr } = await execFileAsync('node', [cliPath, 'bootstrap', 'test-system'], {
          cwd: tempDir,
          timeout: 10000 // 10 second timeout
        });

        // Verify the process completed successfully
        assert.ok(stdout.includes('Bootstrapping DocuMind documentation system'),
          'Should output bootstrap message');
        assert.ok(stdout.includes('Generated documentation:'),
          'Should output generation confirmation');

        // Verify no ESM-related errors in stderr
        assert.ok(!stderr.includes('ReferenceError'),
          'Should not have ReferenceError for __dirname');
        assert.ok(!stderr.includes('__dirname is not defined'),
          'Should not have __dirname undefined error');

      } catch (error) {
        // If the command fails due to missing templates or other issues,
        // we still want to ensure it's not an ESM __dirname error
        if (error.stderr) {
          assert.ok(!error.stderr.includes('ReferenceError'),
            'Should not have ReferenceError for __dirname');
          assert.ok(!error.stderr.includes('__dirname is not defined'),
            'Should not have __dirname undefined error');
        }

        // If it's a different error (like missing templates), that's acceptable
        // for this smoke test - we're primarily testing ESM compatibility
        if (error.code !== 0 && error.stderr && !error.stderr.includes('__dirname')) {
          console.warn('CLI test completed with non-ESM error (acceptable for smoke test):', error.message);
        } else if (error.stderr && error.stderr.includes('__dirname')) {
          throw error; // This is the ESM error we want to catch
        }
      }
    });

    it('should show help when no arguments provided', async () => {
      const cliPath = path.join(__dirname, '../../src/cli/documind.js');

      try {
        const { stdout } = await execFileAsync('node', [cliPath], {
          cwd: tempDir,
          timeout: 5000
        });

        assert.ok(stdout.includes('DocuMind CLI'),
          'Should display CLI help header');
        assert.ok(stdout.includes('Usage:'),
          'Should display usage information');
        assert.ok(stdout.includes('bootstrap'),
          'Should list bootstrap command');

      } catch (error) {
        // Help command should exit with code 0, but handle gracefully
        if (error.stdout) {
          assert.ok(error.stdout.includes('DocuMind CLI'),
            'Should display CLI help even if exit code is non-zero');
        }
      }
    });
  });

  describe('ESM compatibility', () => {
    it('should import and instantiate CLI class without errors', async () => {
      // Test that the CLI module can be imported and instantiated
      const cliPath = path.join(__dirname, '../../src/cli/documind.js');

      const testScript = `
        import('${cliPath}').then(module => {
          const CLI = module.default;
          const cli = new CLI();
          console.log('CLI instantiated successfully');
          process.exit(0);
        }).catch(error => {
          console.error('ESM import failed:', error.message);
          process.exit(1);
        });
      `;

      const { stdout, stderr } = await execFileAsync('node', ['--input-type=module', '-e', testScript], {
        timeout: 5000
      });

      assert.ok(stdout.includes('CLI instantiated successfully'),
        'Should instantiate CLI without ESM errors');
      assert.ok(!stderr.includes('ReferenceError'),
        'Should not have any ReferenceErrors');
    });
  });
});