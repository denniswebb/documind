import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Generator from '../../src/core/generator.js';

describe('Generator', () => {
  let generator;
  let tempDir;

  beforeEach(async () => {
    generator = new Generator();
    tempDir = path.join(__dirname, '../temp');
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('generateFromManifest', () => {
    it('should generate documentation from a manifest', async () => {
      const mockManifest = {
        base_template: 'concept.md',
        specialist_role: 'developer',
        token_budget: { max_tokens: 3000 },
        output_path_pattern: `${tempDir}/{concept_name}.md`,
        ai_output_format: {
          sections: {
            overview: 'bullet_points'
          }
        }
      };

      const mockTemplate = `# {CONCEPT_NAME}

## Overview
This is a test concept for {CONCEPT_NAME}.

## Key Components
- Component 1
- Component 2`;

      const manifestPath = path.join(tempDir, 'test-manifest.yaml');
      const templatePath = path.join(tempDir, 'concept.md');

      await fs.writeFile(manifestPath, JSON.stringify(mockManifest));
      await fs.writeFile(templatePath, mockTemplate);

      generator.loadManifest = async () => mockManifest;
      generator.loadTemplate = async () => mockTemplate;

      const variables = { concept_name: 'authentication' };
      const result = await generator.generateFromManifest(manifestPath, variables);

      assert.ok(result.humanPath);
      assert.ok(result.aiPath);
      assert.ok(result.tokenCount > 0);
      assert.strictEqual(result.manifest, mockManifest);

      const humanContent = await fs.readFile(result.humanPath, 'utf8');
      assert.ok(humanContent.includes('authentication'));
      assert.ok(!humanContent.includes('{CONCEPT_NAME}'));
    });

    it('should throw error when token budget is exceeded', async () => {
      const mockManifest = {
        base_template: 'concept.md',
        specialist_role: 'developer',
        token_budget: { max_tokens: 10 },
        output_path_pattern: `${tempDir}/{concept_name}.md`,
        ai_output_format: {}
      };

      const mockTemplate = 'A very long template that will exceed the token budget with lots of content and many words that should push us over the limit';

      generator.loadManifest = async () => mockManifest;
      generator.loadTemplate = async () => mockTemplate;

      const variables = { concept_name: 'test' };

      await assert.rejects(
        async () => await generator.generateFromManifest('dummy-path', variables),
        /Token count .* exceeds budget/
      );
    });
  });

  describe('generateAll', () => {
    it('should generate from all available manifests', async () => {
      const mockManifests = [
        'concept-ai.yaml',
        'integration-ai.yaml'
      ];

      generator.generateFromManifest = async (manifestPath, variables) => ({
        humanPath: `/test/human/${path.basename(manifestPath, '.yaml')}.md`,
        aiPath: `/test/ai/${path.basename(manifestPath, '.yaml')}-ai.md`,
        tokenCount: 500,
        manifest: { specialist_role: 'developer' }
      });

      const originalReaddir = fs.readdir;
      fs.readdir = async () => mockManifests.concat(['ai-manifest-schema.yaml', 'other-file.txt']);

      try {
        const results = await generator.generateAll();

        assert.strictEqual(results.length, 2);
        assert.ok(results.every(r => r.humanPath && r.aiPath && r.tokenCount));
      } finally {
        fs.readdir = originalReaddir;
      }
    });
  });

  describe('resolveOutputPath', () => {
    it('should resolve variables in output path pattern', () => {
      const pattern = 'docs/{concept_name}/{system_name}.md';
      const variables = {
        concept_name: 'auth',
        system_name: 'user-service'
      };

      const result = generator.resolveOutputPath(pattern, variables, false);
      assert.ok(result.includes('auth'));
      assert.ok(result.includes('user-service'));
      assert.ok(!result.includes('{'));
    });

    it('should create AI path with -ai suffix when isAI is true', () => {
      const pattern = 'docs/{concept_name}.md';
      const variables = { concept_name: 'auth' };

      const aiPath = generator.resolveOutputPath(pattern, variables, true);
      assert.ok(aiPath.includes('ai'));
      assert.ok(aiPath.includes('auth-ai.md'));
    });
  });

  describe('validateTokenBudget', () => {
    it('should not throw when within budget', () => {
      const tokenCount = 2500;
      const budget = { max_tokens: 3000 };

      assert.doesNotThrow(() => {
        generator.validateTokenBudget(tokenCount, budget);
      });
    });

    it('should throw when exceeding budget', () => {
      const tokenCount = 3500;
      const budget = { max_tokens: 3000 };

      assert.throws(() => {
        generator.validateTokenBudget(tokenCount, budget);
      }, /Token count 3500 exceeds budget 3000/);
    });

    it('should not throw when no budget is specified', () => {
      const tokenCount = 5000;
      const budget = null;

      assert.doesNotThrow(() => {
        generator.validateTokenBudget(tokenCount, budget);
      });
    });
  });

  describe('extractDefaultVariables', () => {
    it('should extract variables from manifest filename', () => {
      const filename = 'authentication-ai.yaml';
      const variables = generator.extractDefaultVariables(filename);

      assert.strictEqual(variables.concept_name, 'authentication');
      assert.strictEqual(variables.service_name, 'authentication');
      assert.strictEqual(variables.system_name, 'authentication');
    });

    it('should handle complex filenames', () => {
      const filename = 'user-management-ai.yaml';
      const variables = generator.extractDefaultVariables(filename);

      assert.strictEqual(variables.concept_name, 'user-management');
      assert.strictEqual(variables.service_name, 'user-management');
      assert.strictEqual(variables.system_name, 'user-management');
    });
  });
});