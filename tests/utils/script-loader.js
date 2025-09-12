/**
 * Script Loader Utility
 * Handles loading CommonJS scripts from ES module tests
 */

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';

const require = createRequire(import.meta.url);

/**
 * Loads a CommonJS script using createRequire
 * @param {string} scriptPath - Relative path to the script
 * @returns {any} The loaded module
 */
export function loadScript(scriptPath) {
  const fullPath = path.resolve(scriptPath);
  return require(fullPath);
}

/**
 * Runs a CommonJS script in a separate process
 * This avoids ES module compatibility issues
 * @param {string} scriptPath - Path to the script
 * @param {string[]} args - Arguments to pass to the script
 * @param {Object} options - Spawn options
 * @returns {Promise<{exitCode: number, stdout: string, stderr: string}>}
 */
export function runScriptProcess(scriptPath, args = [], options = {}) {
  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'pipe',
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (exitCode) => {
      resolve({ exitCode, stdout, stderr });
    });
  });
}

/**
 * Creates a DocuMindInstaller instance using process isolation
 * This allows testing without ES module conflicts
 */
export class DocuMindInstallerProxy {
  constructor(repoRoot) {
    this.repoRoot = repoRoot;
    this.scriptPath = path.resolve('../../src/scripts/install.js');
  }

  async install() {
    const result = await runScriptProcess(this.scriptPath, [], {
      cwd: this.repoRoot,
      env: { ...process.env, DOCUMIND_REPO_ROOT: this.repoRoot }
    });
    
    if (result.exitCode !== 0) {
      throw new Error(`Installation failed: ${result.stderr}`);
    }
    
    return result;
  }

  // Add other methods as needed for testing
  async loadTemplate(templateName) {
    // For template testing, we'll need to create a separate script or method
    // This is a simplified approach - real implementation would need more work
    const testScript = `
      const { default: DocuMindInstaller } = require('${this.scriptPath}');
      const installer = new DocuMindInstaller();
      installer.repoRoot = '${this.repoRoot}';
      installer.documindDir = require('path').join('${this.repoRoot}', '.documind');
      installer.loadTemplate('${templateName}').then(result => {
        console.log(JSON.stringify(result));
      }).catch(err => {
        console.error(err.message);
        process.exit(1);
      });
    `;
    
    const result = await runScriptProcess('node', ['-e', testScript]);
    if (result.exitCode !== 0) {
      throw new Error(`Template loading failed: ${result.stderr}`);
    }
    
    return result.stdout.trim();
  }
}