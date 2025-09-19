import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import modules to test
const { AIOrchestrator } = await import('../../src/scripts/ai-orchestrator.js');
const { DocuMindDetector } = await import('../../src/scripts/detect-documind.js');

describe('AI Orchestration Tests', () => {
  let tempDir;
  let documindDir;
  let orchestrator;
  let detector;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'documind-test-'));
    documindDir = path.join(tempDir, '.documind');

    // Create basic .documind structure
    await createBasicDocuMindStructure(documindDir);

    // Change to temp directory for tests
    process.chdir(tempDir);

    // Initialize test instances
    orchestrator = new AIOrchestrator();
    detector = new DocuMindDetector(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Warning: Could not clean up temp dir: ${error.message}`);
    }
  });

  describe('DocuMindDetector', () => {
    it('should detect when DocuMind is properly installed', async () => {
      const result = await detector.detect();

      assert.strictEqual(result.available, true);
      assert.strictEqual(result.installed, true);
      assert.strictEqual(result.components.core, true);
      assert.strictEqual(result.components.templates, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should return false when .documind directory does not exist', async () => {
      // Remove .documind directory
      await fs.rm(documindDir, { recursive: true, force: true });

      const result = await detector.detect();

      assert.strictEqual(result.available, false);
      assert.strictEqual(result.installed, false);
      assert.ok(result.errors.some(error => error.includes('.documind directory not found')));
      assert.ok(result.suggestions.some(suggestion => suggestion.includes('Run DocuMind installation')));
    });

    it('should detect incomplete installations', async () => {
      // Remove core directory
      await fs.rm(path.join(documindDir, 'core'), { recursive: true, force: true });

      const result = await detector.detect();

      assert.strictEqual(result.available, false);
      assert.strictEqual(result.installed, true);
      assert.strictEqual(result.components.core, false);
      assert.ok(result.errors.some(error => error.includes('Core system not found')));
    });

    it('should provide AI-friendly status report', async () => {
      const report = await detector.getAIReport();

      assert.strictEqual(typeof report.available, 'boolean');
      assert.strictEqual(typeof report.status, 'string');
      assert.strictEqual(typeof report.message, 'string');
      assert.strictEqual(typeof report.canUseOrchestrator, 'boolean');
      assert.strictEqual(report.workingDirectory, tempDir);
      assert.ok(report.timestamp);
    });

    it('should detect AI orchestrator availability', async () => {
      // Create AI orchestrator script
      const scriptsDir = path.join(documindDir, 'scripts');
      await fs.mkdir(scriptsDir, { recursive: true });
      await fs.writeFile(
        path.join(scriptsDir, 'ai-orchestrator.js'),
        'export class AIOrchestrator {}'
      );

      const result = await detector.detect();

      assert.strictEqual(result.components.aiOrchestrator, true);
    });
  });

  describe('AIOrchestrator', () => {
    beforeEach(async () => {
      // Create mock generator and AI index builder
      await createMockDependencies(documindDir);
    });

    it('should validate DocuMind installation before execution', async () => {
      // Remove core directory to simulate incomplete installation
      await fs.rm(path.join(documindDir, 'core'), { recursive: true, force: true });

      const result = await orchestrator.execute('bootstrap');

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('DocuMind installation incomplete'));
    });

    it('should handle bootstrap command successfully', async () => {
      const result = await orchestrator.execute('bootstrap');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.command, 'bootstrap');
      assert.strictEqual(result.result.type, 'bootstrap');
      assert.ok(result.result.summary);
      assert.ok(Array.isArray(result.result.humanDocs));
      assert.ok(Array.isArray(result.result.aiDocs));
      assert.ok(typeof result.duration === 'number');
    });

    it('should handle expand command with concept', async () => {
      const result = await orchestrator.execute('expand', { concept: 'authentication' });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.command, 'expand');
      assert.strictEqual(result.result.type, 'expand');
      assert.strictEqual(result.result.concept, 'authentication');
    });

    it('should handle analyze command with integration', async () => {
      const result = await orchestrator.execute('analyze', { integration: 'stripe' });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.command, 'analyze');
      assert.strictEqual(result.result.type, 'analyze');
      assert.strictEqual(result.result.integration, 'stripe');
    });

    it('should handle search command with query', async () => {
      // Create some mock documentation files to search
      const docsDir = path.join(tempDir, 'docs');
      await fs.mkdir(docsDir, { recursive: true });
      await fs.writeFile(
        path.join(docsDir, 'test.md'),
        'This is a test document about authentication and security.'
      );

      const result = await orchestrator.execute('search', { query: 'authentication' });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.command, 'search');
      assert.strictEqual(result.result.type, 'search');
      assert.strictEqual(result.result.query, 'authentication');
      assert.ok(Array.isArray(result.result.results));
    });

    it('should handle index rebuild command', async () => {
      const result = await orchestrator.execute('index');

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.command, 'index');
      assert.strictEqual(result.result.type, 'index');
    });

    it('should return error for unknown commands', async () => {
      const result = await orchestrator.execute('unknown-command');

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Unknown command'));
    });

    it('should require concept name for expand command', async () => {
      const result = await orchestrator.execute('expand', {});

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Concept name is required'));
    });

    it('should require integration name for analyze command', async () => {
      const result = await orchestrator.execute('analyze', {});

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Integration name is required'));
    });

    it('should require query for search command', async () => {
      const result = await orchestrator.execute('search', {});

      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Search query is required'));
    });

    it('should include execution metadata in results', async () => {
      const result = await orchestrator.execute('bootstrap');

      assert.ok(result.timestamp);
      assert.strictEqual(result.workingDirectory, tempDir);
      assert.ok(typeof result.duration === 'number');
      assert.ok(result.duration >= 0);
    });

    it('should handle file search correctly', async () => {
      // Create nested documentation structure
      const docsDir = path.join(tempDir, 'docs');
      const conceptsDir = path.join(docsDir, 'concepts');
      await fs.mkdir(conceptsDir, { recursive: true });

      await fs.writeFile(
        path.join(conceptsDir, 'auth.md'),
        'Authentication system using JWT tokens'
      );
      await fs.writeFile(
        path.join(docsDir, 'api.md'),
        'API documentation with authentication endpoints'
      );

      const result = await orchestrator.execute('search', { query: 'authentication' });

      assert.strictEqual(result.success, true);
      assert.ok(result.result.results.length >= 2);

      // Check that results contain expected information
      const authResult = result.result.results.find(r => r.path.includes('auth.md'));
      assert.ok(authResult);
      assert.ok(Array.isArray(authResult.matches));
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end from detection to execution', async () => {
      // First detect DocuMind
      const detection = await detector.getAIReport();
      assert.strictEqual(detection.available, true);

      // Then execute orchestrator
      const execution = await orchestrator.execute('bootstrap');
      assert.strictEqual(execution.success, true);

      // Verify results structure
      assert.ok(execution.result.humanDocs);
      assert.ok(execution.result.aiDocs);
      assert.ok(execution.result.summary);
    });

    it('should handle workflow with custom variables', async () => {
      const result = await orchestrator.execute('expand', {
        concept: 'authentication',
        variables: {
          framework: 'express',
          database: 'mongodb'
        }
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.result.concept, 'authentication');
    });

    it('should maintain consistent file structure', async () => {
      await orchestrator.execute('bootstrap');

      // Check that expected directories exist
      const docsDir = path.join(tempDir, 'docs');
      const aiDocsDir = path.join(docsDir, 'ai');

      const docsExists = await fs.access(docsDir).then(() => true).catch(() => false);
      const aiDocsExists = await fs.access(aiDocsDir).then(() => true).catch(() => false);

      assert.strictEqual(docsExists, true);
      assert.strictEqual(aiDocsExists, true);
    });
  });
});

// Helper functions

async function createBasicDocuMindStructure(documindDir) {
  // Create core directory structure
  const coreDir = path.join(documindDir, 'core');
  const templatesDir = path.join(documindDir, 'templates');
  const aiOptimizedDir = path.join(templatesDir, 'ai-optimized');

  await fs.mkdir(coreDir, { recursive: true });
  await fs.mkdir(aiOptimizedDir, { recursive: true });

  // Create basic core files
  await fs.writeFile(
    path.join(coreDir, 'generator.js'),
    'export class Generator { async generateAll() { return []; } }'
  );

  await fs.writeFile(
    path.join(coreDir, 'ai-index-builder.js'),
    'export class AIIndexBuilder { async updateMasterIndex() { return { totalFiles: 0, indexPath: "test" }; } }'
  );

  // Create basic template files
  await fs.writeFile(
    path.join(aiOptimizedDir, 'concept-documentation.yaml'),
    'specialist_role: concept_specialist\nbase_template: basic.md\ntoken_budget: 3000'
  );

  await fs.writeFile(
    path.join(templatesDir, 'basic.md'),
    '# {{concept_name}}\n\nThis is basic template content.'
  );
}

async function createMockDependencies(documindDir) {
  const coreDir = path.join(documindDir, 'core');

  // Create mock generator that returns predictable results
  await fs.writeFile(
    path.join(coreDir, 'generator.js'),
    `
export class Generator {
  async generateAll() {
    return [
      {
        humanPath: '/docs/test-human.md',
        aiPath: '/docs/ai/test-ai.md',
        tokenCount: 1500,
        manifest: { specialist_role: 'concept_specialist' }
      }
    ];
  }

  async generateFromManifest(manifestPath, variables) {
    return {
      humanPath: '/docs/concept-human.md',
      aiPath: '/docs/ai/concept-ai.md',
      tokenCount: 2000,
      manifest: { specialist_role: 'concept_specialist' }
    };
  }
}
`
  );

  // Create mock AI index builder
  await fs.writeFile(
    path.join(coreDir, 'ai-index-builder.js'),
    `
export class AIIndexBuilder {
  async updateMasterIndex(files = []) {
    return {
      totalFiles: files.length,
      indexPath: '/docs/ai/AI_README.md',
      timestamp: new Date().toISOString()
    };
  }
}
`
  );
}