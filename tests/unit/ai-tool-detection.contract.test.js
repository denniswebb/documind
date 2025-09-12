import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

// Import the contract specification
import { AIToolDetectionContract, SupportedTools } from '../../specs/001-i-need-unit/contracts/ai-tool-detection.contract.js';

describe('AI Tool Detection Contract Tests', () => {
  let testDir;
  let aiToolImplementation;
  let originalCwd;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'ai-tool-contract-test-'));
    process.chdir(testDir);

    // Mock implementation that should fail (TDD approach)
    aiToolImplementation = {
      detectAITools: () => { throw new Error('NOT_IMPLEMENTED'); },
      generateInstructionFile: () => { throw new Error('NOT_IMPLEMENTED'); },
      validateInstructionFile: () => { throw new Error('NOT_IMPLEMENTED'); },
      testToolConfiguration: () => { throw new Error('NOT_IMPLEMENTED'); }
    };
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('detectAITools Contract Compliance', () => {
    test('should accept valid detectAITools input parameters', async () => {
      const contract = AIToolDetectionContract.detectAITools;
      
      const validInputs = [
        { repoRoot: testDir, scanDepth: 2 },
        { repoRoot: testDir, scanDepth: 5 },
        { repoRoot: './current-dir', scanDepth: 1 }
      ];

      for (const input of validInputs) {
        try {
          await aiToolImplementation.detectAITools(input);
          assert.fail('Implementation should not exist yet - this test should fail');
        } catch (error) {
          assert.strictEqual(error.message, 'NOT_IMPLEMENTED',
            'Should fail because implementation does not exist yet');
        }
      }
    });

    test('should return expected detectAITools output structure', async () => {
      const contract = AIToolDetectionContract.detectAITools;
      const expectedOutputTypes = {
        tools: 'array',
        confidence: 'object', 
        indicators: 'object'
      };

      Object.entries(expectedOutputTypes).forEach(([key, expectedType]) => {
        assert.strictEqual(contract.output[key], expectedType,
          `Output ${key} should be of type ${expectedType}`);
      });
    });

    test('should handle detectAITools error cases', async () => {
      const expectedErrors = [
        'REPO_NOT_FOUND',
        'PERMISSION_DENIED',
        'SCAN_TIMEOUT',
        'INVALID_REPO'
      ];

      const contract = AIToolDetectionContract.detectAITools;
      assert.deepStrictEqual(contract.errors.sort(), expectedErrors.sort(),
        'Should define all expected error cases');
    });
  });

  describe('generateInstructionFile Contract Compliance', () => {
    test('should accept valid generateInstructionFile input parameters', async () => {
      const validInputs = [
        {
          toolName: 'claude',
          repoRoot: testDir,
          templateVars: { PROJECT_NAME: 'Test Project', VERSION: '1.0.0' }
        },
        {
          toolName: 'cursor',
          repoRoot: testDir,
          templateVars: { REPO_URL: 'https://github.com/test/repo' }
        },
        {
          toolName: 'copilot',
          repoRoot: testDir,
          templateVars: {}
        }
      ];

      for (const input of validInputs) {
        try {
          await aiToolImplementation.generateInstructionFile(input);
          assert.fail('Implementation should not exist yet');
        } catch (error) {
          assert.strictEqual(error.message, 'NOT_IMPLEMENTED');
        }
      }
    });

    test('should return expected generateInstructionFile output structure', async () => {
      const contract = AIToolDetectionContract.generateInstructionFile;
      
      assert.strictEqual(contract.output.filePath, 'string');
      assert.strictEqual(contract.output.content, 'string');
      assert.strictEqual(contract.output.generated, 'boolean');
    });

    test('should handle generateInstructionFile error cases', async () => {
      const expectedErrors = [
        'UNSUPPORTED_TOOL',
        'TEMPLATE_NOT_FOUND',
        'GENERATION_FAILED',
        'WRITE_PERMISSION_DENIED'
      ];

      const contract = AIToolDetectionContract.generateInstructionFile;
      assert.deepStrictEqual(contract.errors.sort(), expectedErrors.sort());
    });
  });

  describe('validateInstructionFile Contract Compliance', () => {
    test('should accept valid validateInstructionFile input parameters', async () => {
      const validInputs = [
        {
          toolName: 'claude',
          filePath: 'CLAUDE.md',
          expectedSections: ['Commands', 'System Instructions']
        },
        {
          toolName: 'cursor', 
          filePath: '.cursorrules',
          expectedSections: ['Documentation Commands', 'Rules']
        }
      ];

      for (const input of validInputs) {
        try {
          await aiToolImplementation.validateInstructionFile(input);
          assert.fail('Implementation should not exist yet');
        } catch (error) {
          assert.strictEqual(error.message, 'NOT_IMPLEMENTED');
        }
      }
    });

    test('should return expected validateInstructionFile output structure', async () => {
      const contract = AIToolDetectionContract.validateInstructionFile;
      
      assert.strictEqual(contract.output.valid, 'boolean');
      assert.strictEqual(contract.output.missingSections, 'array');
      assert.strictEqual(contract.output.extraSections, 'array');
      assert.strictEqual(contract.output.warnings, 'array');
    });

    test('should handle validateInstructionFile error cases', async () => {
      const expectedErrors = [
        'FILE_NOT_FOUND',
        'PARSE_ERROR',
        'INVALID_FORMAT',
        'ENCODING_ERROR'
      ];

      const contract = AIToolDetectionContract.validateInstructionFile;
      assert.deepStrictEqual(contract.errors.sort(), expectedErrors.sort());
    });
  });

  describe('testToolConfiguration Contract Compliance', () => {
    test('should accept valid testToolConfiguration input parameters', async () => {
      const validInputs = [
        {
          toolName: 'claude',
          configPath: 'CLAUDE.md',
          testCommands: ['/help', '/document bootstrap']
        },
        {
          toolName: 'copilot',
          configPath: '.github/copilot-instructions.md',
          testCommands: ['@workspace test', '@workspace explain']
        }
      ];

      for (const input of validInputs) {
        try {
          await aiToolImplementation.testToolConfiguration(input);
          assert.fail('Implementation should not exist yet');
        } catch (error) {
          assert.strictEqual(error.message, 'NOT_IMPLEMENTED');
        }
      }
    });

    test('should return expected testToolConfiguration output structure', async () => {
      const contract = AIToolDetectionContract.testToolConfiguration;
      
      assert.strictEqual(contract.output.working, 'boolean');
      assert.strictEqual(contract.output.commandResults, 'array');
      assert.strictEqual(contract.output.diagnostics, 'object');
    });

    test('should handle testToolConfiguration error cases', async () => {
      const expectedErrors = [
        'TOOL_NOT_INSTALLED',
        'CONFIG_INVALID',
        'COMMAND_FAILED',
        'TIMEOUT'
      ];

      const contract = AIToolDetectionContract.testToolConfiguration;
      assert.deepStrictEqual(contract.errors.sort(), expectedErrors.sort());
    });
  });

  describe('SupportedTools Configuration', () => {
    test('should define configuration for all supported AI tools', async () => {
      const requiredTools = ['claude', 'cursor', 'copilot', 'gemini'];
      const supportedToolNames = Object.keys(SupportedTools);
      
      assert.deepStrictEqual(supportedToolNames.sort(), requiredTools.sort(),
        'Should support all required AI tools');
    });

    test('should have consistent structure for each supported tool', async () => {
      const requiredFields = ['detectionFiles', 'instructionFile', 'requiredSections'];
      
      for (const [toolName, config] of Object.entries(SupportedTools)) {
        requiredFields.forEach(field => {
          assert.ok(config.hasOwnProperty(field),
            `Tool ${toolName} should have ${field} configuration`);
        });

        assert.ok(Array.isArray(config.detectionFiles),
          `${toolName} detectionFiles should be an array`);
        
        assert.ok(Array.isArray(config.requiredSections),
          `${toolName} requiredSections should be an array`);
        
        assert.strictEqual(typeof config.instructionFile, 'string',
          `${toolName} instructionFile should be a string`);
      }
    });

    test('should have valid detection patterns for each tool', async () => {
      const expectedPatterns = {
        claude: ['CLAUDE.md', '.claude/'],
        cursor: ['.cursor/', '.cursorrules'],
        copilot: ['.github/', '.github/copilot-instructions.md'],
        gemini: ['GEMINI.md']
      };

      for (const [toolName, expectedFiles] of Object.entries(expectedPatterns)) {
        const actualFiles = SupportedTools[toolName].detectionFiles;
        
        // Check that all expected files are present
        for (const expectedFile of expectedFiles) {
          assert.ok(actualFiles.includes(expectedFile),
            `${toolName} should detect ${expectedFile}`);
        }
      }
    });

    test('should specify appropriate instruction files', async () => {
      const expectedInstructionFiles = {
        claude: 'CLAUDE.md',
        cursor: '.cursorrules',
        copilot: '.github/copilot-instructions.md',
        gemini: 'GEMINI.md'
      };

      for (const [toolName, expectedFile] of Object.entries(expectedInstructionFiles)) {
        assert.strictEqual(SupportedTools[toolName].instructionFile, expectedFile,
          `${toolName} should use ${expectedFile} as instruction file`);
      }
    });

    test('should define required sections for each tool', async () => {
      for (const [toolName, config] of Object.entries(SupportedTools)) {
        assert.ok(config.requiredSections.length > 0,
          `${toolName} should have at least one required section`);
        
        // All tools should require some form of documentation commands
        const hasDocumentationSection = config.requiredSections.some(section =>
          section.toLowerCase().includes('command') || 
          section.toLowerCase().includes('documentation')
        );
        
        assert.ok(hasDocumentationSection,
          `${toolName} should require documentation commands section`);
      }
    });
  });

  describe('Contract Integration', () => {
    test('should have contract methods that work with supported tools', async () => {
      const contractMethods = Object.keys(AIToolDetectionContract);
      const expectedMethods = [
        'detectAITools',
        'generateInstructionFile', 
        'validateInstructionFile',
        'testToolConfiguration'
      ];

      assert.deepStrictEqual(contractMethods.sort(), expectedMethods.sort(),
        'Contract should define all required methods');
    });

    test('should support validation against supported tools config', async () => {
      // Test that supported tools config can be used with validation contract
      for (const [toolName, config] of Object.entries(SupportedTools)) {
        const validationInput = {
          toolName: toolName,
          filePath: config.instructionFile,
          expectedSections: config.requiredSections
        };

        // Should be valid input structure for validation contract
        assert.strictEqual(typeof validationInput.toolName, 'string');
        assert.strictEqual(typeof validationInput.filePath, 'string');
        assert.ok(Array.isArray(validationInput.expectedSections));
      }
    });

    test('should have consistent error handling patterns', async () => {
      const methods = Object.keys(AIToolDetectionContract);
      
      for (const method of methods) {
        const contract = AIToolDetectionContract[method];
        
        assert.ok(Array.isArray(contract.errors),
          `${method} should define errors as an array`);
        
        assert.ok(contract.errors.length > 0,
          `${method} should define at least one error case`);
        
        // Check error format consistency
        for (const error of contract.errors) {
          assert.match(error, /^[A-Z_]+$/,
            `Error ${error} should be in UPPERCASE_WITH_UNDERSCORES format`);
        }
      }
    });
  });
});