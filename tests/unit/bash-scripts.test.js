#!/usr/bin/env node

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { spawn, exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
// Use source scripts for testing during development
const scriptsDir = path.join(projectRoot, 'src', 'scripts');
// For installed projects, scripts would be in .documind/scripts
const installedScriptsDir = path.join(projectRoot, '.documind', 'scripts');

// Test fixtures directory
const fixturesDir = path.join(__dirname, '../fixtures/bash-scripts');

describe('Bash Scripts', () => {
    before(async () => {
        // Ensure test fixtures directory exists
        await fs.mkdir(fixturesDir, { recursive: true });

        // Create test files
        await createTestFixtures();

        // Ensure scripts are executable
        await makeScriptsExecutable();
    });

    after(async () => {
        // Clean up test fixtures
        await cleanupTestFixtures();
    });

    describe('utils.sh', () => {
        test('should export utility functions', async () => {
            const script = `
                source "${path.join(scriptsDir, 'utils.sh')}"
                echo "DOCUMIND_UTILS_VERSION: $DOCUMIND_UTILS_VERSION"
                echo "Functions available: $(type -t log_info log_error die command_exists | xargs echo)"
            `;

            const { stdout } = await execAsync(`bash -c '${script}'`);

            assert(stdout.includes('DOCUMIND_UTILS_VERSION'));
            assert(stdout.includes('function function function function'));
        });

        test('should initialize DocuMind paths correctly', async () => {
            const script = `
                cd "${projectRoot}"
                source "${path.join(scriptsDir, 'utils.sh')}"
                echo "ROOT: $DOCUMIND_ROOT_DIR"
                echo "SCRIPTS: $DOCUMIND_SCRIPTS_DIR"
            `;

            const { stdout } = await execAsync(`bash -c '${script}'`);

            assert(stdout.includes(`ROOT: ${projectRoot}`));
            assert(stdout.includes(`SCRIPTS: ${scriptsDir}`));
        });

        test('should handle logging functions', async () => {
            const script = `
                source "${path.join(scriptsDir, 'utils.sh')}"
                DOCUMIND_QUIET=false
                log_info "Test info message"
                log_success "Test success message"
                log_warning "Test warning message"
            `;

            const { stdout, stderr } = await execAsync(`bash -c '${script}'`);

            assert(stdout.includes('Test info message'));
            assert(stdout.includes('Test success message'));
            assert(stderr.includes('Test warning message'));
        });
    });

    describe('token-count', () => {
        const tokenCountScript = path.join(scriptsDir, 'token-count');

        test('should display help information', async () => {
            const { stdout } = await execAsync(`"${tokenCountScript}" --help`);

            assert(stdout.includes('Count tokens in text files'));
            assert(stdout.includes('USAGE:'));
            assert(stdout.includes('EXAMPLES:'));
        });

        test('should count tokens in a file', async () => {
            const testFile = path.join(fixturesDir, 'sample.md');
            const { stdout } = await execAsync(`"${tokenCountScript}" "${testFile}"`);

            assert(stdout.includes('tokens'));
            assert(/\d+/.test(stdout)); // Should contain numbers
        });

        test('should count tokens from stdin', async () => {
            const { stdout } = await execAsync(`echo "Hello world test content" | "${tokenCountScript}"`);

            assert(stdout.includes('(stdin)') || /\d+/.test(stdout));
        });

        test('should output JSON format', async () => {
            const testFile = path.join(fixturesDir, 'sample.md');
            const { stdout } = await execAsync(`"${tokenCountScript}" --json "${testFile}"`);

            const result = JSON.parse(stdout);
            assert(typeof result.tokens === 'number');
            assert(typeof result.details === 'object');
            assert(typeof result.details.file_path === 'string');
        });

        test('should validate against budget', async () => {
            const testFile = path.join(fixturesDir, 'sample.md');
            const { stdout } = await execAsync(`"${tokenCountScript}" --budget=10 "${testFile}"`);

            // Should indicate budget status
            assert(stdout.includes('budget') && (stdout.includes('within') || stdout.includes('exceeds')));
        });

        test('should handle multiple files', async () => {
            const testFile1 = path.join(fixturesDir, 'sample.md');
            const testFile2 = path.join(fixturesDir, 'another.md');
            const { stdout } = await execAsync(`"${tokenCountScript}" "${testFile1}" "${testFile2}"`);

            assert(stdout.includes('Summary:'));
            assert(stdout.includes('files'));
        });
    });

    describe('validate-yaml', () => {
        const validateYamlScript = path.join(scriptsDir, 'validate-yaml');

        test('should display help information', async () => {
            const { stdout } = await execAsync(`"${validateYamlScript}" --help`);

            assert(stdout.includes('Validate YAML files'));
            assert(stdout.includes('VALIDATION MODES:'));
            assert(stdout.includes('EXIT CODES:'));
        });

        test('should validate a valid YAML file', async () => {
            const testFile = path.join(fixturesDir, 'valid.yaml');
            const { stdout, stderr } = await execAsync(`"${validateYamlScript}" --syntax-only "${testFile}"`);

            assert(stdout.includes('Valid') || !stderr.includes('Invalid'));
        });

        test('should detect invalid YAML', async () => {
            const testFile = path.join(fixturesDir, 'invalid.yaml');

            try {
                await execAsync(`"${validateYamlScript}" "${testFile}"`);
                assert.fail('Should have failed for invalid YAML');
            } catch (error) {
                // Expected to fail
                assert(error.code !== 0);
            }
        });

        test('should output JSON format', async () => {
            const testFile = path.join(fixturesDir, 'valid.yaml');
            const { stdout } = await execAsync(`"${validateYamlScript}" --syntax-only --json "${testFile}"`);

            const result = JSON.parse(stdout);
            assert(typeof result.file === 'string');
            assert(typeof result.status === 'string');
        });

        test('should validate multiple files', async () => {
            const testFile1 = path.join(fixturesDir, 'valid.yaml');
            const testFile2 = path.join(fixturesDir, 'manifest.yaml');
            const { stdout } = await execAsync(`"${validateYamlScript}" --syntax-only "${testFile1}" "${testFile2}"`);

            assert(stdout.includes('YAML files are valid') || stdout.includes('Valid'));
        });
    });

    describe('split-markdown', () => {
        const splitMarkdownScript = path.join(scriptsDir, 'split-markdown');

        test('should display help information', async () => {
            const { stdout } = await execAsync(`"${splitMarkdownScript}" --help`);

            assert(stdout.includes('Split markdown files'));
            assert(stdout.includes('SPLITTING STRATEGIES:'));
            assert(stdout.includes('HEADING LEVELS:'));
        });

        test('should split markdown by headings', async () => {
            const testFile = path.join(fixturesDir, 'large-doc.md');
            const outputDir = path.join(fixturesDir, 'split-output');

            const { stdout } = await execAsync(`"${splitMarkdownScript}" --output="${outputDir}" "${testFile}"`);

            // Check if output directory was created
            const stats = await fs.stat(outputDir);
            assert(stats.isDirectory());

            // Check for split files
            const files = await fs.readdir(outputDir);
            assert(files.length > 0);

            // Cleanup
            await fs.rm(outputDir, { recursive: true, force: true });
        });

        test('should merge split files', async () => {
            const testFile = path.join(fixturesDir, 'large-doc.md');
            const outputDir = path.join(fixturesDir, 'split-output');

            // First split
            await execAsync(`"${splitMarkdownScript}" --output="${outputDir}" "${testFile}"`);

            // Then merge
            const { stdout } = await execAsync(`"${splitMarkdownScript}" --merge "${outputDir}"`);

            assert(stdout.length > 0); // Should output merged content

            // Cleanup
            await fs.rm(outputDir, { recursive: true, force: true });
        });

        test('should validate chunks', async () => {
            const testFile = path.join(fixturesDir, 'large-doc.md');
            const outputDir = path.join(fixturesDir, 'split-output');

            // First split
            await execAsync(`"${splitMarkdownScript}" --output="${outputDir}" "${testFile}"`);

            // Then validate
            const { stdout } = await execAsync(`"${splitMarkdownScript}" --validate "${outputDir}"`);

            assert(stdout.includes('valid') || stdout.includes('passed'));

            // Cleanup
            await fs.rm(outputDir, { recursive: true, force: true });
        });
    });

    describe('check-dependencies', () => {
        const checkDepsScript = path.join(scriptsDir, 'check-dependencies');

        test('should display help information', async () => {
            const { stdout } = await execAsync(`"${checkDepsScript}" --help`);

            assert(stdout.includes('Check and install dependencies'));
            assert(stdout.includes('COMMANDS:'));
            assert(stdout.includes('OUTPUT FORMATS:'));
        });

        test('should check system dependencies', async () => {
            const { stdout } = await execAsync(`"${checkDepsScript}" --system-only`);

            assert(stdout.includes('System Dependencies') || stdout.includes('available') || stdout.includes('missing'));
        });

        test('should output JSON format', async () => {
            const { stdout } = await execAsync(`"${checkDepsScript}" --json`);

            const result = JSON.parse(stdout);
            assert(Array.isArray(result.system_dependencies));
            assert(typeof result.summary === 'object');
        });

        test('should list dependencies', async () => {
            const { stdout } = await execAsync(`"${checkDepsScript}" list`);

            assert(stdout.includes('System Dependencies:'));
            assert(stdout.includes('Node.js Dependencies:'));
        });
    });

    describe('generate-docs', () => {
        const generateDocsScript = path.join(scriptsDir, 'generate-docs');

        test('should display help information', async () => {
            const { stdout } = await execAsync(`"${generateDocsScript}" --help`);

            assert(stdout.includes('Orchestrate complete documentation'));
            assert(stdout.includes('GENERATION MODES:'));
            assert(stdout.includes('PIPELINE OPTIONS:'));
        });

        test('should handle dry-run mode', async () => {
            const outputDir = path.join(fixturesDir, 'docs-output');
            const { stdout } = await execAsync(`"${generateDocsScript}" --dry-run --output="${outputDir}" bootstrap`);

            assert(stdout.includes('Dry run mode'));
            assert(stdout.includes('Would generate') || stdout.includes('bootstrap'));
        });

        test('should bootstrap documentation', async () => {
            const outputDir = path.join(fixturesDir, 'docs-output');

            const { stdout } = await execAsync(`"${generateDocsScript}" --output="${outputDir}" bootstrap`);

            assert(stdout.includes('bootstrap') || stdout.includes('completed'));

            // Cleanup
            await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {});
        });
    });

    describe('budget-monitor', () => {
        const budgetMonitorScript = path.join(scriptsDir, 'budget-monitor');

        test('should display help information', async () => {
            const { stdout } = await execAsync(`"${budgetMonitorScript}" --help`);

            assert(stdout.includes('Monitor token budgets'));
            assert(stdout.includes('MONITORING MODES:'));
            assert(stdout.includes('BUDGET SOURCES:'));
        });

        test('should monitor directory', async () => {
            const { stdout } = await execAsync(`"${budgetMonitorScript}" "${fixturesDir}"`);

            assert(stdout.includes('Budget Monitor Report') || stdout.includes('files') || stdout.includes('tokens'));
        });

        test('should output JSON format', async () => {
            const { stdout } = await execAsync(`"${budgetMonitorScript}" --json "${fixturesDir}"`);

            const result = JSON.parse(stdout);
            assert(Array.isArray(result.results));
            assert(typeof result.summary === 'object');
        });

        test('should handle alert mode', async () => {
            try {
                const { stdout } = await execAsync(`"${budgetMonitorScript}" --alert --budget=1 "${fixturesDir}"`);
                // Should pass or fail based on actual token counts
                assert(typeof stdout === 'string');
            } catch (error) {
                // Alert mode may exit with non-zero code if files are over budget
                assert(error.code === 1 || error.code === 0);
            }
        });
    });

    describe('Package-Based Resolution', () => {
        // Test that scripts work correctly when installed as a package
        // and local Node scripts don't exist

        test.skip('should use package-based resolution for token counting when local files missing', async () => {
            // Create a temporary directory structure simulating an installed project
            // without local src/scripts/*.js files
            const tempDir = path.join(fixturesDir, 'package-test');
            const tempScriptsDir = path.join(tempDir, '.documind', 'scripts');

            await fs.mkdir(tempScriptsDir, { recursive: true });

            // Copy bash scripts but NOT the Node.js scripts
            const bashScripts = ['token-count', 'validate-yaml', 'split-markdown', 'utils.sh'];
            for (const script of bashScripts) {
                const srcPath = path.join(scriptsDir, script);
                const destPath = path.join(tempScriptsDir, script);
                try {
                    await fs.copyFile(srcPath, destPath);
                    await fs.chmod(destPath, 0o755);
                } catch (error) {
                    console.warn(`Warning: Could not copy ${script}:`, error.message);
                }
            }

            // Copy Node.js bridge scripts that should be resolved via package
            const nodeScripts = ['token_count.js', 'validate_yaml.js', 'mdsplit_bridge.js'];
            for (const script of nodeScripts) {
                const srcPath = path.join(scriptsDir, script);
                const destPath = path.join(tempScriptsDir, script);
                try {
                    await fs.copyFile(srcPath, destPath);
                    await fs.chmod(destPath, 0o755);
                } catch (error) {
                    console.warn(`Warning: Could not copy ${script}:`, error.message);
                }
            }

            // Create test file
            const testFile = path.join(tempDir, 'test.md');
            await fs.writeFile(testFile, `
# Test Document

This is a test document for package-based resolution testing.
It contains some content that should be counted via tiktoken when available.

## Features

- Package-based Node.js script resolution
- Fallback handling when local scripts are missing
- Integration with installed npm packages
            `);

            // Test token counting with package resolution
            const tokenCountScript = path.join(tempScriptsDir, 'token-count');

            try {
                const { stdout } = await execAsync(`cd "${tempDir}" && "${tokenCountScript}" --json "${testFile}"`, {
                    env: { ...process.env, NODE_PATH: path.join(projectRoot, 'node_modules') }
                });

                const result = JSON.parse(stdout);

                // Verify we got a valid token count result
                assert(typeof result.tokens === 'number');
                assert(result.tokens > 0);
                assert(result.details && result.details.file_path);

                // Check if tiktoken method was used (most accurate)
                // If tiktoken package is available, it should be used instead of heuristic fallback
                if (result.method) {
                    console.log(`Token counting method used: ${result.method}`);
                    // If tiktoken is available, it should be preferred over heuristic
                    if (result.method === 'tiktoken') {
                        assert(result.confidence === undefined || result.confidence === 'high');
                    }
                }

            } catch (error) {
                // If Node.js tiktoken isn't available, should fallback gracefully
                assert(error.stdout && error.stdout.includes('tokens'),
                    `Token counting should work with fallback methods: ${error.message}`);
            }

            // Cleanup
            await fs.rm(tempDir, { recursive: true, force: true });
        });

        test.skip('should use package-based resolution for YAML validation when local files missing', async () => {
            const tempDir = path.join(fixturesDir, 'yaml-package-test');
            const tempScriptsDir = path.join(tempDir, '.documind', 'scripts');

            await fs.mkdir(tempScriptsDir, { recursive: true });

            // Copy scripts without local Node files
            const bashScripts = ['validate-yaml', 'utils.sh'];
            for (const script of bashScripts) {
                const srcPath = path.join(scriptsDir, script);
                const destPath = path.join(tempScriptsDir, script);
                try {
                    await fs.copyFile(srcPath, destPath);
                    await fs.chmod(destPath, 0o755);
                } catch (error) {
                    console.warn(`Warning: Could not copy ${script}:`, error.message);
                }
            }

            // Copy Node.js validation script
            const validateYamlJs = path.join(scriptsDir, 'validate_yaml.js');
            const destValidateYamlJs = path.join(tempScriptsDir, 'validate_yaml.js');
            try {
                await fs.copyFile(validateYamlJs, destValidateYamlJs);
                await fs.chmod(destValidateYamlJs, 0o755);
            } catch (error) {
                console.warn('Warning: Could not copy validate_yaml.js:', error.message);
            }

            // Create test YAML file
            const testFile = path.join(tempDir, 'test.yaml');
            await fs.writeFile(testFile, `
name: package-resolution-test
description: Test YAML file for package-based resolution
version: "1.0.0"
features:
  - package_resolution
  - schema_validation
  - error_handling
metadata:
  created: 2024-01-01
  updated: 2024-01-15
            `);

            // Test YAML validation with package resolution
            const validateYamlScript = path.join(tempScriptsDir, 'validate-yaml');

            try {
                const { stdout } = await execAsync(`cd "${tempDir}" && "${validateYamlScript}" --json "${testFile}"`, {
                    env: { ...process.env, NODE_PATH: path.join(projectRoot, 'node_modules') }
                });

                const result = JSON.parse(stdout);

                // Verify we got a valid validation result
                assert(typeof result.status === 'string');
                assert(result.file === testFile);

                // Should be valid YAML
                assert(result.status === 'valid');

                // Check method used - should prefer Node.js validation over basic fallback
                if (result.method) {
                    console.log(`YAML validation method used: ${result.method}`);
                    // Node.js validation is more accurate than basic fallback
                    assert(result.method !== 'basic' || result.method === 'nodejs');
                }

            } catch (error) {
                // Should fallback to basic validation gracefully
                assert(error.stdout && (error.stdout.includes('Valid') || error.stdout.includes('valid')),
                    `YAML validation should work with fallback: ${error.message}`);
            }

            // Cleanup
            await fs.rm(tempDir, { recursive: true, force: true });
        });

        test('should use mdsplit bridge for markdown splitting via package resolution', async () => {
            const tempDir = path.join(fixturesDir, 'mdsplit-package-test');
            const tempScriptsDir = path.join(tempDir, '.documind', 'scripts');

            await fs.mkdir(tempScriptsDir, { recursive: true });

            // Copy required scripts
            const requiredScripts = ['split-markdown', 'utils.sh', 'mdsplit_bridge.js'];
            for (const script of requiredScripts) {
                const srcPath = path.join(scriptsDir, script);
                const destPath = path.join(tempScriptsDir, script);
                try {
                    await fs.copyFile(srcPath, destPath);
                    await fs.chmod(destPath, 0o755);
                } catch (error) {
                    console.warn(`Warning: Could not copy ${script}:`, error.message);
                }
            }

            // Create test markdown file with multiple sections
            const testFile = path.join(tempDir, 'test-doc.md');
            await fs.writeFile(testFile, `
# Test Document for Splitting

This document tests the mdsplit bridge functionality.

## Section 1: Introduction

This is the first section with some content that should be split properly.
The mdsplit bridge should handle this via package resolution.

## Section 2: Features

This section describes features:
- Package-based resolution
- Markdown splitting
- Chunk generation

## Section 3: Implementation

Implementation details go here with technical information.

## Section 4: Conclusion

Final thoughts and summary of the splitting process.
            `);

            // Test markdown splitting with mdsplit bridge
            const splitScript = path.join(tempScriptsDir, 'split-markdown');
            const outputDir = path.join(tempDir, 'split-output');

            try {
                const { stdout } = await execAsync(`cd "${tempDir}" && "${splitScript}" --strategy=heading --level=2 --output="${outputDir}" "${testFile}"`, {
                    env: { ...process.env, NODE_PATH: path.join(projectRoot, 'node_modules') }
                });

                // Parse JSON output if available
                try {
                    const result = JSON.parse(stdout);

                    // Verify successful splitting
                    assert(result.success === true);
                    assert(typeof result.chunks === 'number');
                    assert(result.chunks > 0);
                    assert(Array.isArray(result.files));
                    assert(result.files.length === result.chunks);

                    // Check if mdsplit package was used (preferred over fallback)
                    if (result.method === 'mdsplit') {
                        console.log('mdsplit package was successfully used via bridge');
                        assert(result.method === 'mdsplit');
                    } else if (result.method === 'fallback') {
                        console.log('Fallback method was used (mdsplit package not available)');
                        assert(result.method === 'fallback');
                    }

                    // Verify output directory and files were created
                    const stats = await fs.stat(outputDir);
                    assert(stats.isDirectory());

                    const files = await fs.readdir(outputDir);
                    assert(files.length > 0);

                } catch (parseError) {
                    // If not JSON, should still indicate success
                    assert(stdout.includes('success') || stdout.includes('completed'));
                }

            } catch (error) {
                // Should fallback to heading-based splitting gracefully
                console.log('Fallback splitting used:', error.message);

                // Check if fallback still created output
                try {
                    const stats = await fs.stat(outputDir);
                    assert(stats.isDirectory(), 'Output directory should be created even with fallback');
                } catch (statError) {
                    // If no output directory, the fallback might have failed too
                    assert(error.stdout && error.stdout.includes('split'),
                        `Markdown splitting should work with fallback methods: ${error.message}`);
                }
            }

            // Cleanup
            await fs.rm(tempDir, { recursive: true, force: true });
        });

        test.skip('should handle missing packages gracefully with appropriate fallbacks', async () => {
            // Test behavior when packages are completely unavailable
            const tempDir = path.join(fixturesDir, 'fallback-test');
            const tempScriptsDir = path.join(tempDir, '.documind', 'scripts');

            await fs.mkdir(tempScriptsDir, { recursive: true });

            // Copy only bash scripts, no Node.js scripts
            const bashScripts = ['token-count', 'utils.sh'];
            for (const script of bashScripts) {
                const srcPath = path.join(scriptsDir, script);
                const destPath = path.join(tempScriptsDir, script);
                try {
                    await fs.copyFile(srcPath, destPath);
                    await fs.chmod(destPath, 0o755);
                } catch (error) {
                    console.warn(`Warning: Could not copy ${script}:`, error.message);
                }
            }

            // Create test file
            const testFile = path.join(tempDir, 'fallback-test.md');
            await fs.writeFile(testFile, 'Simple test content for fallback testing.');

            // Test token counting falls back to heuristic method
            const tokenCountScript = path.join(tempScriptsDir, 'token-count');

            try {
                const { stdout } = await execAsync(`cd "${tempDir}" && "${tokenCountScript}" --json "${testFile}"`, {
                    env: {
                        ...process.env,
                        NODE_PATH: '/nonexistent/path',  // Force package resolution to fail
                        PATH: process.env.PATH  // Keep system PATH for basic commands
                    }
                });

                const result = JSON.parse(stdout);

                // Should still get a token count via fallback
                assert(typeof result.tokens === 'number');
                assert(result.tokens > 0);

                // Should use heuristic or basic method, not tiktoken
                assert(result.method === 'heuristic' || result.method === 'basic');

            } catch (error) {
                // Even if JSON parsing fails, should get some token count output
                assert(error.stdout && error.stdout.includes('tokens'),
                    `Should fallback to heuristic token counting: ${error.message}`);
            }

            // Cleanup
            await fs.rm(tempDir, { recursive: true, force: true });
        });
    });

    describe('Integration Tests', () => {
        test('should work together in pipeline', async () => {
            const testFile = path.join(fixturesDir, 'sample.md');
            const outputDir = path.join(fixturesDir, 'integration-output');

            // Count tokens
            const { stdout: tokenOutput } = await execAsync(`"${path.join(scriptsDir, 'token-count')}" "${testFile}"`);
            assert(tokenOutput.includes('tokens'));

            // Check dependencies
            const { stdout: depsOutput } = await execAsync(`"${path.join(scriptsDir, 'check-dependencies')}" --summary`);
            assert(typeof depsOutput === 'string');

            // Monitor budget
            const { stdout: budgetOutput } = await execAsync(`"${path.join(scriptsDir, 'budget-monitor')}" "${fixturesDir}"`);
            assert(budgetOutput.includes('Report') || budgetOutput.includes('files'));

            // Cleanup
            await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {});
        });
    });
});

// Helper functions

async function createTestFixtures() {
    // Create sample markdown file
    await fs.writeFile(path.join(fixturesDir, 'sample.md'), `
# Sample Document

This is a sample markdown document for testing the bash utilities.

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Features

- Token counting
- YAML validation
- Markdown splitting
- Budget monitoring

## Conclusion

This document helps test the various bash utilities in the DocuMind system.
`);

    // Create another markdown file
    await fs.writeFile(path.join(fixturesDir, 'another.md'), `
# Another Document

This is another test document.

## Content

Some content here for testing multiple file operations.
`);

    // Create large document for splitting tests
    await fs.writeFile(path.join(fixturesDir, 'large-doc.md'), `
# Large Document

This is a large document for testing splitting functionality.

## Section 1

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Section 2

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Section 3

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

## Section 4

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
`);

    // Create valid YAML file
    await fs.writeFile(path.join(fixturesDir, 'valid.yaml'), `
name: test-document
description: A test YAML file
version: "1.0.0"
tags:
  - test
  - validation
metadata:
  author: Test Author
  created: 2024-01-01
`);

    // Create manifest YAML file
    await fs.writeFile(path.join(fixturesDir, 'manifest.yaml'), `
name: test-manifest
description: Test manifest for documentation
version: "1.0.0"
budget: 4000
files:
  - path: "sample.md"
    budget: 2000
  - path: "another.md"
    budget: 1500
`);

    // Create invalid YAML file
    await fs.writeFile(path.join(fixturesDir, 'invalid.yaml'), `
name: test-document
description: A test YAML file with invalid syntax
version: "1.0.0"
tags: [
  - test
  - validation
  # Missing closing bracket
metadata:
  author: Test Author
  created: 2024-01-01
    invalid_indentation: value
`);
}

async function makeScriptsExecutable() {
    const scripts = [
        'token-count',
        'validate-yaml',
        'split-markdown',
        'check-dependencies',
        'generate-docs',
        'budget-monitor'
    ];

    for (const script of scripts) {
        const scriptPath = path.join(scriptsDir, script);
        try {
            await fs.chmod(scriptPath, 0o755);
        } catch (error) {
            console.warn(`Warning: Could not make ${script} executable:`, error.message);
        }
    }
}

async function cleanupTestFixtures() {
    try {
        await fs.rm(fixturesDir, { recursive: true, force: true });
    } catch (error) {
        console.warn('Warning: Could not clean up test fixtures:', error.message);
    }
}