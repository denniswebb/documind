/**
 * Test Assertion Helpers
 * T014: Test assertion helpers
 */

import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Asserts that a file exists at the given path
 * @param {string} filePath - Path to the file
 * @param {string} message - Optional message for assertion failure
 * @returns {Promise<void>}
 */
export async function assertFileExists(filePath, message) {
  try {
    await fs.access(filePath);
  } catch (error) {
    assert.fail(message || `Expected file to exist: ${filePath}`);
  }
}

/**
 * Asserts that a file does not exist at the given path
 * @param {string} filePath - Path to the file
 * @param {string} message - Optional message for assertion failure
 * @returns {Promise<void>}
 */
export async function assertFileDoesNotExist(filePath, message) {
  try {
    await fs.access(filePath);
    assert.fail(message || `Expected file to not exist: ${filePath}`);
  } catch (error) {
    // File doesn't exist, which is what we want
  }
}

/**
 * Asserts that a directory exists at the given path
 * @param {string} dirPath - Path to the directory
 * @param {string} message - Optional message for assertion failure
 * @returns {Promise<void>}
 */
export async function assertDirectoryExists(dirPath, message) {
  try {
    const stats = await fs.stat(dirPath);
    assert(stats.isDirectory(), message || `Expected path to be a directory: ${dirPath}`);
  } catch (error) {
    assert.fail(message || `Expected directory to exist: ${dirPath}`);
  }
}

/**
 * Asserts that a file contains the specified text
 * @param {string} filePath - Path to the file
 * @param {string} expectedText - Text that should be in the file
 * @param {string} message - Optional message for assertion failure
 * @returns {Promise<void>}
 */
export async function assertFileContains(filePath, expectedText, message) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    assert(
      content.includes(expectedText),
      message || `Expected file ${filePath} to contain: ${expectedText}`
    );
  } catch (error) {
    assert.fail(message || `Could not read file or file does not contain expected text: ${filePath}`);
  }
}

/**
 * Asserts that a file does not contain the specified text
 * @param {string} filePath - Path to the file
 * @param {string} unexpectedText - Text that should not be in the file
 * @param {string} message - Optional message for assertion failure
 * @returns {Promise<void>}
 */
export async function assertFileDoesNotContain(filePath, unexpectedText, message) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    assert(
      !content.includes(unexpectedText),
      message || `Expected file ${filePath} to not contain: ${unexpectedText}`
    );
  } catch (error) {
    assert.fail(message || `Could not read file: ${filePath}`);
  }
}

/**
 * Asserts that a file matches the expected content exactly
 * @param {string} filePath - Path to the file
 * @param {string} expectedContent - Expected file content
 * @param {string} message - Optional message for assertion failure
 * @returns {Promise<void>}
 */
export async function assertFileContent(filePath, expectedContent, message) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    assert.strictEqual(
      content.trim(),
      expectedContent.trim(),
      message || `File content does not match expected: ${filePath}`
    );
  } catch (error) {
    assert.fail(message || `Could not read file: ${filePath}`);
  }
}

/**
 * Asserts that an array contains all expected items
 * @param {any[]} actual - Actual array
 * @param {any[]} expected - Expected items that should be in the array
 * @param {string} message - Optional message for assertion failure
 */
export function assertArrayIncludes(actual, expected, message) {
  for (const item of expected) {
    assert(
      actual.includes(item),
      message || `Expected array to include: ${item}`
    );
  }
}

/**
 * Asserts that an array does not contain any of the specified items
 * @param {any[]} actual - Actual array
 * @param {any[]} unexpected - Items that should not be in the array
 * @param {string} message - Optional message for assertion failure
 */
export function assertArrayExcludes(actual, unexpected, message) {
  for (const item of unexpected) {
    assert(
      !actual.includes(item),
      message || `Expected array to not include: ${item}`
    );
  }
}

/**
 * Asserts that an object has all the expected properties
 * @param {Object} actual - Actual object
 * @param {string[]} expectedProps - Property names that should exist
 * @param {string} message - Optional message for assertion failure
 */
export function assertObjectHasProperties(actual, expectedProps, message) {
  for (const prop of expectedProps) {
    assert(
      actual.hasOwnProperty(prop),
      message || `Expected object to have property: ${prop}`
    );
  }
}

/**
 * Asserts that a JSON file contains the expected structure
 * @param {string} filePath - Path to the JSON file
 * @param {Object} expectedStructure - Expected JSON structure
 * @param {string} message - Optional message for assertion failure
 * @returns {Promise<void>}
 */
export async function assertJsonFileStructure(filePath, expectedStructure, message) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(content);
    
    for (const [key, expectedValue] of Object.entries(expectedStructure)) {
      if (typeof expectedValue === 'object' && expectedValue !== null) {
        assert(
          typeof json[key] === 'object',
          message || `Expected ${filePath} to have object property: ${key}`
        );
        assertObjectHasProperties(json[key], Object.keys(expectedValue));
      } else {
        assert(
          json.hasOwnProperty(key),
          message || `Expected ${filePath} to have property: ${key}`
        );
      }
    }
  } catch (error) {
    assert.fail(message || `Could not read or parse JSON file: ${filePath}`);
  }
}

/**
 * Asserts that a command execution was successful
 * @param {Object} result - Result object from command execution
 * @param {string} message - Optional message for assertion failure
 */
export function assertCommandSuccess(result, message) {
  assert.strictEqual(
    result.exitCode,
    0,
    message || `Expected command to succeed but got exit code ${result.exitCode}: ${result.stderr}`
  );
}

/**
 * Asserts that a command execution failed with expected exit code
 * @param {Object} result - Result object from command execution
 * @param {number} expectedExitCode - Expected exit code
 * @param {string} message - Optional message for assertion failure
 */
export function assertCommandFailure(result, expectedExitCode, message) {
  assert.strictEqual(
    result.exitCode,
    expectedExitCode,
    message || `Expected command to fail with exit code ${expectedExitCode} but got ${result.exitCode}`
  );
}

/**
 * Asserts that a path is within a specific directory
 * @param {string} filePath - File path to check
 * @param {string} containerDir - Directory that should contain the file
 * @param {string} message - Optional message for assertion failure
 */
export function assertPathWithinDirectory(filePath, containerDir, message) {
  const resolvedFile = path.resolve(filePath);
  const resolvedContainer = path.resolve(containerDir);
  
  assert(
    resolvedFile.startsWith(resolvedContainer),
    message || `Expected ${filePath} to be within ${containerDir}`
  );
}

/**
 * Asserts that a file has specific permissions (Unix-like systems only)
 * @param {string} filePath - Path to the file
 * @param {number} expectedMode - Expected file mode (e.g., 0o644)
 * @param {string} message - Optional message for assertion failure
 * @returns {Promise<void>}
 */
export async function assertFileMode(filePath, expectedMode, message) {
  try {
    const stats = await fs.stat(filePath);
    const actualMode = stats.mode & parseInt('777', 8);
    assert.strictEqual(
      actualMode,
      expectedMode,
      message || `Expected file ${filePath} to have mode ${expectedMode.toString(8)} but got ${actualMode.toString(8)}`
    );
  } catch (error) {
    assert.fail(message || `Could not check file permissions: ${filePath}`);
  }
}

/**
 * Asserts that an async function throws an error with a specific message
 * @param {Function} fn - Async function that should throw
 * @param {string|RegExp} expectedMessage - Expected error message or regex pattern
 * @param {string} message - Optional message for assertion failure
 * @returns {Promise<void>}
 */
export async function assertThrowsWithMessage(fn, expectedMessage, message) {
  try {
    await fn();
    assert.fail(message || `Expected function to throw an error with message: ${expectedMessage}`);
  } catch (error) {
    if (expectedMessage instanceof RegExp) {
      assert(
        expectedMessage.test(error.message),
        message || `Expected error message to match pattern ${expectedMessage}, but got: ${error.message}`
      );
    } else {
      assert(
        error.message.includes(expectedMessage),
        message || `Expected error message to contain "${expectedMessage}", but got: ${error.message}`
      );
    }
  }
}