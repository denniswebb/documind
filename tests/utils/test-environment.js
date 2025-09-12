/**
 * Test Environment Helper Utilities
 * Provides utilities for setting up and managing test environments
 * T012: Test environment helper utilities
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Creates a temporary test directory with unique naming
 * @param {string} prefix - Prefix for the temporary directory name
 * @returns {Promise<string>} Path to the created temporary directory
 */
async function createTestDirectory(prefix = 'documind-test-') {
  const testDir = await fs.mkdtemp(path.join(tmpdir(), prefix));
  // Resolve the real path to handle symlinks like /var -> /private/var on macOS
  return await fs.realpath(testDir);
}

/**
 * Cleans up a test directory
 * @param {string} testDir - Path to the directory to clean up
 * @returns {Promise<void>}
 */
async function cleanupTestDirectory(testDir) {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors in tests
    console.warn(`Warning: Failed to cleanup test directory ${testDir}:`, error.message);
  }
}

/**
 * Sets up a test environment with temporary directory and cleanup
 * @param {string} prefix - Prefix for the temporary directory name
 * @returns {Promise<{testDir: string, cleanup: Function}>}
 */
async function setupTestEnvironment(prefix = 'documind-test-') {
  const testDir = await createTestDirectory(prefix);
  const originalCwd = process.cwd();
  
  // Change to test directory
  process.chdir(testDir);
  
  const cleanup = async () => {
    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up test directory
    await cleanupTestDirectory(testDir);
  };
  
  return { testDir, cleanup };
}

/**
 * Creates a basic file structure in the test directory
 * @param {string} testDir - The test directory path
 * @param {Object} structure - Object describing the file structure to create
 * @returns {Promise<void>}
 */
async function createFileStructure(testDir, structure) {
  for (const [filePath, content] of Object.entries(structure)) {
    const fullPath = path.join(testDir, filePath);
    
    // Create directory if it doesn't exist
    const dirPath = path.dirname(fullPath);
    await fs.mkdir(dirPath, { recursive: true });
    
    // Create file with content
    if (typeof content === 'string') {
      await fs.writeFile(fullPath, content, 'utf8');
    } else if (content === null) {
      // Create directory only
      await fs.mkdir(fullPath, { recursive: true });
    }
  }
}

/**
 * Verifies that expected files exist in the test directory
 * @param {string} testDir - The test directory path
 * @param {string[]} expectedFiles - Array of file paths that should exist
 * @returns {Promise<{existing: string[], missing: string[]}>}
 */
async function verifyFilesExist(testDir, expectedFiles) {
  const existing = [];
  const missing = [];
  
  for (const filePath of expectedFiles) {
    const fullPath = path.join(testDir, filePath);
    try {
      await fs.access(fullPath);
      existing.push(filePath);
    } catch {
      missing.push(filePath);
    }
  }
  
  return { existing, missing };
}

/**
 * Captures console output during test execution
 * @returns {Object} Object with capture methods and getOutput function
 */
function captureConsoleOutput() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  let output = {
    log: [],
    error: [],
    warn: []
  };
  
  const capture = {
    start() {
      console.log = (...args) => {
        output.log.push(args.join(' '));
      };
      console.error = (...args) => {
        output.error.push(args.join(' '));
      };
      console.warn = (...args) => {
        output.warn.push(args.join(' '));
      };
    },
    
    stop() {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
    
    getOutput() {
      return { ...output };
    },
    
    reset() {
      output = { log: [], error: [], warn: [] };
    }
  };
  
  return capture;
}

/**
 * Creates environment variables for testing
 * @param {Object} envVars - Object with environment variable key-value pairs
 * @returns {Function} Cleanup function to restore original environment
 */
function mockEnvironmentVariables(envVars) {
  const originalEnv = {};
  
  // Store original values
  for (const key of Object.keys(envVars)) {
    originalEnv[key] = process.env[key];
  }
  
  // Set new values
  Object.assign(process.env, envVars);
  
  // Return cleanup function
  return () => {
    for (const [key, originalValue] of Object.entries(originalEnv)) {
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }
  };
}

/**
 * Waits for a condition to be true with timeout
 * @param {Function} condition - Function that returns true when condition is met
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<boolean>} True if condition was met, false if timeout
 */
async function waitForCondition(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
}

/**
 * Runs a function with a timeout
 * @param {Function} fn - Function to run
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<any>} Result of the function or timeout error
 */
async function runWithTimeout(fn, timeout = 10000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
    )
  ]);
}

/**
 * TestEnvironment class for backwards compatibility with existing tests
 */
class TestEnvironment {
  constructor() {
    this.createdDirs = [];
  }

  async createTempDir(prefix = 'documind-test-') {
    const testDir = await createTestDirectory(prefix);
    this.createdDirs.push(testDir);
    return testDir;
  }

  async cleanup(testDir) {
    await cleanupTestDirectory(testDir);
    // Remove from tracked directories
    const index = this.createdDirs.indexOf(testDir);
    if (index > -1) {
      this.createdDirs.splice(index, 1);
    }
  }

  async cleanupAll() {
    for (const dir of this.createdDirs) {
      await cleanupTestDirectory(dir);
    }
    this.createdDirs = [];
  }

  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// ES module exports
export {
  createTestDirectory,
  cleanupTestDirectory,
  setupTestEnvironment,
  createFileStructure,
  verifyFilesExist,
  captureConsoleOutput,
  mockEnvironmentVariables,
  waitForCondition,
  runWithTimeout,
  TestEnvironment
};

// Export default for backwards compatibility
export default TestEnvironment;