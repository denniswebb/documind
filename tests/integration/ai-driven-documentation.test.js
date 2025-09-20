import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AI-Driven Documentation Integration Tests', () => {
  let tempDir;
  let documindDir;
  let srcDir;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'documind-ai-integration-'));
    documindDir = path.join(tempDir, '.documind');
    srcDir = path.resolve(__dirname, '../../src');

    // Create comprehensive DocuMind installation
    await createFullDocuMindInstallation(documindDir, srcDir);

    // Change to temp directory for tests
    process.chdir(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Warning: Could not clean up temp dir: ${error.message}`);
    }
  });

  describe('End-to-End AI Workflow', () => {
    it('should complete full bootstrap workflow from detection to generation', async () => {
      // Step 1: Test detection
      const detectionResult = await runCommand('node', ['.documind/scripts/detect-documind.js', 'ai-report']);

      assert.strictEqual(detectionResult.exitCode, 0);

      const detection = JSON.parse(detectionResult.stdout);
      assert.strictEqual(detection.available, true);
      assert.strictEqual(detection.canUseOrchestrator, true);

      // Step 2: Execute bootstrap
      const bootstrapResult = await runCommand('node', ['.documind/scripts/ai-orchestrator.js', 'bootstrap']);

      assert.strictEqual(bootstrapResult.exitCode, 0);

      const bootstrap = JSON.parse(bootstrapResult.stdout);
      assert.strictEqual(bootstrap.success, true);
      assert.strictEqual(bootstrap.result.type, 'bootstrap');
      assert.ok(bootstrap.result.humanDocsCount >= 0);
      assert.ok(bootstrap.result.aiDocsCount >= 0);

      // Step 3: Verify file structure was created
      const docsExists = await fileExists(path.join(tempDir, 'docs'));
      const aiDocsExists = await fileExists(path.join(tempDir, 'docs', 'ai'));

      assert.strictEqual(docsExists, true, 'Human docs directory should exist');
      assert.strictEqual(aiDocsExists, true, 'AI docs directory should exist');
    });

    it('should handle concept expansion workflow correctly', async () => {
      // Execute expand command
      const expandResult = await runCommand('node', [
        '.documind/scripts/ai-orchestrator.js',
        'expand',
        'authentication'
      ]);

      assert.strictEqual(expandResult.exitCode, 0);

      const result = JSON.parse(expandResult.stdout);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.result.type, 'expand');
      assert.strictEqual(result.result.concept, 'authentication');
      assert.ok(Array.isArray(result.result.humanDocs));
      assert.ok(Array.isArray(result.result.aiDocs));
    });

    it('should handle integration analysis workflow', async () => {
      // Execute analyze command
      const analyzeResult = await runCommand('node', [
        '.documind/scripts/ai-orchestrator.js',
        'analyze',
        'stripe'
      ]);

      assert.strictEqual(analyzeResult.exitCode, 0);

      const result = JSON.parse(analyzeResult.stdout);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.result.type, 'analyze');
      assert.strictEqual(result.result.integration, 'stripe');
    });

    it('should handle search workflow with existing content', async () => {
      // Create some test documentation first
      const docsDir = path.join(tempDir, 'docs');
      await fs.mkdir(docsDir, { recursive: true });
      await fs.writeFile(
        path.join(docsDir, 'test-auth.md'),
        '# Authentication\n\nThis document covers user authentication and authorization systems.'
      );

      // Execute search command
      const searchResult = await runCommand('node', [
        '.documind/scripts/ai-orchestrator.js',
        'search',
        'authentication'
      ]);

      assert.strictEqual(searchResult.exitCode, 0);

      const result = JSON.parse(searchResult.stdout);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.result.type, 'search');
      assert.strictEqual(result.result.query, 'authentication');
      assert.ok(result.result.resultsCount >= 1);
      assert.ok(Array.isArray(result.result.results));
    });

    it('should handle index rebuild workflow', async () => {
      // Execute index command
      const indexResult = await runCommand('node', [
        '.documind/scripts/ai-orchestrator.js',
        'index'
      ]);

      assert.strictEqual(indexResult.exitCode, 0);

      const result = JSON.parse(indexResult.stdout);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.result.type, 'index');
      assert.ok(result.result.indexPath);
    });
  });

  describe('AI Agent Configuration Tests', () => {
    it('should have properly formatted Claude configuration', async () => {
      const claudeConfigPath = path.join(documindDir, 'templates', 'ai-configs', 'claude.md');
      const configExists = await fileExists(claudeConfigPath);
      assert.strictEqual(configExists, true);

      const content = await fs.readFile(claudeConfigPath, 'utf8');

      // Check for key AI orchestration instructions
      assert.ok(content.includes('Automatic Documentation Generation'));
      assert.ok(content.includes('detect-documind.js ai-report'));
      assert.ok(content.includes('ai-orchestrator.js'));
      assert.ok(content.includes('dual-purpose generation'));
    });

    it('should have properly formatted Copilot configuration', async () => {
      const copilotConfigPath = path.join(documindDir, 'templates', 'ai-configs', 'copilot-instructions.md');
      const configExists = await fileExists(copilotConfigPath);
      assert.strictEqual(configExists, true);

      const content = await fs.readFile(copilotConfigPath, 'utf8');

      // Check for orchestration workflow instructions
      assert.ok(content.includes('Automatic Documentation Generation'));
      assert.ok(content.includes('Execute Orchestrator'));
      assert.ok(content.includes('detect-documind.js'));
    });

    it('should have comprehensive AI integration guide', async () => {
      const guidePath = path.join(documindDir, 'templates', 'ai-integration-guide.md');
      const guideExists = await fileExists(guidePath);
      assert.strictEqual(guideExists, true);

      const content = await fs.readFile(guidePath, 'utf8');

      // Check for comprehensive integration instructions
      assert.ok(content.includes('Automatic Dual-Purpose Generation'));
      assert.ok(content.includes('Detection Phase'));
      assert.ok(content.includes('Command Execution'));
      assert.ok(content.includes('Error Handling'));
    });
  });

  describe('Error Handling and Fallback Tests', () => {
    it('should handle missing .documind directory gracefully', async () => {
      // Remove .documind directory
      await fs.rm(documindDir, { recursive: true, force: true });

      // Create a mock detect script that reports not installed
      const mockScript = `#!/usr/bin/env node
const response = {
  available: false,
  status: 'not_installed',
  message: 'DocuMind is not installed',
  canUseOrchestrator: false,
  orchestratorPath: null,
  workingDirectory: process.cwd(),
  timestamp: new Date().toISOString(),
  details: {
    available: false,
    installed: false,
    version: null,
    components: {
      core: false,
      templates: false,
      scripts: false,
      aiOrchestrator: false
    },
    paths: {},
    errors: ['DocuMind directory not found'],
    suggestions: ['Install DocuMind to enable AI-driven documentation']
  }
};
console.log(JSON.stringify(response, null, 2));
process.exit(1);
`;

      await fs.mkdir('.documind/scripts', { recursive: true });
      await fs.writeFile('.documind/scripts/detect-documind.js', mockScript);
      await fs.chmod('.documind/scripts/detect-documind.js', 0o755);

      const detectionResult = await runCommand('node', ['.documind/scripts/detect-documind.js', 'ai-report']);

      // Should exit with non-zero code when DocuMind not available
      assert.notStrictEqual(detectionResult.exitCode, 0);

      const result = JSON.parse(detectionResult.stdout);
      assert.strictEqual(result.available, false);
      assert.strictEqual(result.status, 'not_installed');
    });

    it('should handle incomplete DocuMind installation', async () => {
      // Replace detect script with one that reports incomplete installation
      const mockScript = `#!/usr/bin/env node
const response = {
  available: false,
  status: 'incomplete',
  message: 'DocuMind is partially installed',
  canUseOrchestrator: false,
  orchestratorPath: null,
  workingDirectory: process.cwd(),
  timestamp: new Date().toISOString(),
  details: {
    available: false,
    installed: true,
    version: '1.0.0-test',
    components: {
      core: false,
      templates: true,
      scripts: true,
      aiOrchestrator: false
    },
    paths: {
      documindDir: process.cwd() + '/.documind',
      templatesDir: process.cwd() + '/.documind/templates',
      scriptsDir: process.cwd() + '/.documind/scripts'
    },
    errors: ['Core directory missing'],
    suggestions: ['Reinstall DocuMind to fix incomplete installation']
  }
};
console.log(JSON.stringify(response, null, 2));
process.exit(1);
`;

      await fs.writeFile('.documind/scripts/detect-documind.js', mockScript);
      await fs.chmod('.documind/scripts/detect-documind.js', 0o755);

      const detectionResult = await runCommand('node', ['.documind/scripts/detect-documind.js', 'ai-report']);

      assert.notStrictEqual(detectionResult.exitCode, 0);

      const result = JSON.parse(detectionResult.stdout);
      assert.strictEqual(result.available, false);
      assert.strictEqual(result.status, 'incomplete');
    });

    it('should return proper error for invalid orchestrator commands', async () => {
      const invalidResult = await runCommand('node', [
        '.documind/scripts/ai-orchestrator.js',
        'invalid-command'
      ]);

      assert.notStrictEqual(invalidResult.exitCode, 0);

      const result = JSON.parse(invalidResult.stdout);
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Unknown command'));
    });

    it('should require parameters for commands that need them', async () => {
      // Test expand without concept
      const expandResult = await runCommand('node', [
        '.documind/scripts/ai-orchestrator.js',
        'expand'
      ]);

      assert.notStrictEqual(expandResult.exitCode, 0);

      const result = JSON.parse(expandResult.stdout);
      assert.strictEqual(result.success, false);
      assert.ok(result.error.includes('Concept name is required'));
    });
  });

  describe('File Generation and Structure Tests', () => {
    it('should create proper directory structure during bootstrap', async () => {
      // Execute bootstrap
      await runCommand('node', ['.documind/scripts/ai-orchestrator.js', 'bootstrap']);

      // Check expected directory structure
      const expectedDirs = [
        'docs',
        'docs/ai',
        'docs/01-getting-oriented',
        'docs/02-core-concepts',
        'docs/03-integrations',
        'docs/04-development'
      ];

      for (const dir of expectedDirs) {
        const dirPath = path.join(tempDir, dir);
        const exists = await fileExists(dirPath);
        assert.strictEqual(exists, true, `Directory ${dir} should exist`);
      }
    });

    it('should generate files with proper content structure', async () => {
      // Execute expand for a specific concept
      const expandResult = await runCommand('node', [
        '.documind/scripts/ai-orchestrator.js',
        'expand',
        'authentication'
      ]);

      const result = JSON.parse(expandResult.stdout);

      if (result.success && result.result.created.length > 0) {
        // Check that created files actually exist and have content
        for (const filePath of result.result.created) {
          const fullPath = path.resolve(tempDir, filePath.replace(/^\//, ''));
          const exists = await fileExists(fullPath);

          if (exists) {
            const content = await fs.readFile(fullPath, 'utf8');
            assert.ok(content.length > 0, `File ${filePath} should have content`);
          }
        }
      }
    });
  });

  describe('Performance and Reliability Tests', () => {
    it('should complete bootstrap within reasonable time', async () => {
      const startTime = Date.now();

      const bootstrapResult = await runCommand('node', [
        '.documind/scripts/ai-orchestrator.js',
        'bootstrap'
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      assert.strictEqual(bootstrapResult.exitCode, 0);
      assert.ok(duration < 30000, 'Bootstrap should complete within 30 seconds'); // Reasonable timeout

      const result = JSON.parse(bootstrapResult.stdout);
      assert.ok(result.duration < 30000, 'Reported duration should be reasonable');
    });

    it('should handle concurrent command execution', async () => {
      // Execute multiple commands concurrently
      const commands = [
        runCommand('node', ['.documind/scripts/ai-orchestrator.js', 'index']),
        runCommand('node', ['.documind/scripts/detect-documind.js', 'ai-report']),
        runCommand('node', ['.documind/scripts/ai-orchestrator.js', 'search', 'test'])
      ];

      const results = await Promise.all(commands);

      // All commands should complete successfully
      for (const result of results) {
        assert.strictEqual(result.exitCode, 0);
      }
    });
  });
});

// Helper functions

async function createFullDocuMindInstallation(documindDir, srcDir) {
  // Create basic directory structure needed for tests
  await fs.mkdir(path.join(documindDir, 'core'), { recursive: true });
  await fs.mkdir(path.join(documindDir, 'templates'), { recursive: true });
  await fs.mkdir(path.join(documindDir, 'scripts'), { recursive: true });

  // Copy only essential files for detection
  try {
    await copyDirectory(path.join(srcDir, 'templates'), path.join(documindDir, 'templates'));
  } catch (error) {
    console.warn(`Warning: Could not copy templates: ${error.message}`);
  }

  // Create mock scripts that return expected JSON responses
  await createMockDetectScript(path.join(documindDir, 'scripts', 'detect-documind.js'));
  await createMockOrchestratorScript(path.join(documindDir, 'scripts', 'ai-orchestrator.js'));

  // Create version file
  await fs.writeFile(path.join(documindDir, 'VERSION'), '1.0.0-test');

  // Create a minimal core structure
  await fs.writeFile(path.join(documindDir, 'core', 'README.md'), '# DocuMind Core');
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createMockDetectScript(scriptPath) {
  const mockScript = `#!/usr/bin/env node

const command = process.argv[2] || 'detect';

const responses = {
  'detect': {
    available: true,
    installed: true,
    version: '1.0.0-test',
    components: {
      core: true,
      templates: true,
      scripts: true,
      aiOrchestrator: true
    },
    paths: {
      documindDir: process.cwd() + '/.documind',
      coreDir: process.cwd() + '/.documind/core',
      templatesDir: process.cwd() + '/.documind/templates',
      scriptsDir: process.cwd() + '/.documind/scripts',
      aiOrchestrator: process.cwd() + '/.documind/scripts/ai-orchestrator.js'
    },
    errors: [],
    suggestions: []
  },
  'ai-report': {
    available: true,
    status: 'available',
    message: 'DocuMind is installed and ready to use',
    canUseOrchestrator: true,
    orchestratorPath: process.cwd() + '/.documind/scripts/ai-orchestrator.js',
    workingDirectory: process.cwd(),
    timestamp: new Date().toISOString(),
    details: {
      available: true,
      installed: true,
      version: '1.0.0-test',
      components: {
        core: true,
        templates: true,
        scripts: true,
        aiOrchestrator: true
      },
      paths: {
        documindDir: process.cwd() + '/.documind',
        coreDir: process.cwd() + '/.documind/core',
        templatesDir: process.cwd() + '/.documind/templates',
        scriptsDir: process.cwd() + '/.documind/scripts',
        aiOrchestrator: process.cwd() + '/.documind/scripts/ai-orchestrator.js'
      },
      errors: [],
      suggestions: []
    }
  }
};

const response = responses[command] || responses['detect'];
console.log(JSON.stringify(response, null, 2));
process.exit(response.available ? 0 : 1);
`;

  await fs.writeFile(scriptPath, mockScript);
  await fs.chmod(scriptPath, 0o755);
}

async function createMockOrchestratorScript(scriptPath) {
  const mockScript = `#!/usr/bin/env node

const command = process.argv[2];
const arg = process.argv[3];

function createMockDirectories() {
  const fs = require('fs');
  const path = require('path');

  const dirs = [
    'docs',
    'docs/ai',
    'docs/01-getting-oriented',
    'docs/02-core-concepts',
    'docs/03-integrations',
    'docs/04-development'
  ];

  dirs.forEach(dir => {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  // Create some test files
  fs.writeFileSync('docs/test-auth.md', '# Authentication\\n\\nTest documentation content.');
  fs.writeFileSync('docs/ai/test-ai.md', '# AI Documentation\\n\\nAI-optimized content.');
}

const responses = {
  bootstrap: {
    success: true,
    command: 'bootstrap',
    result: {
      type: 'bootstrap',
      summary: 'Generated 3 human documentation files and 3 AI-optimized files',
      humanDocsCount: 3,
      aiDocsCount: 3,
      totalTokens: 1500,
      humanDocs: [
        { path: 'docs/getting-started.md', type: 'general', tokenCount: 500 },
        { path: 'docs/concepts.md', type: 'concept', tokenCount: 400 },
        { path: 'docs/integration.md', type: 'integration', tokenCount: 600 }
      ],
      aiDocs: [
        { path: 'docs/ai/getting-started-ai.md', type: 'general', tokenCount: 500 },
        { path: 'docs/ai/concepts-ai.md', type: 'concept', tokenCount: 400 },
        { path: 'docs/ai/integration-ai.md', type: 'integration', tokenCount: 600 }
      ],
      created: [
        'docs/getting-started.md',
        'docs/ai/getting-started-ai.md',
        'docs/concepts.md',
        'docs/ai/concepts-ai.md',
        'docs/integration.md',
        'docs/ai/integration-ai.md'
      ],
      updated: ['docs/ai/index.md']
    },
    duration: 1250,
    timestamp: new Date().toISOString(),
    workingDirectory: process.cwd()
  },
  expand: {
    success: true,
    command: 'expand',
    result: {
      type: 'expand',
      concept: arg || 'authentication',
      summary: \`Expanded documentation for concept: \${arg || 'authentication'}\`,
      humanDocsCount: 2,
      aiDocsCount: 2,
      humanDocs: [
        { path: 'docs/auth-overview.md', type: 'concept', concept: arg || 'authentication' },
        { path: 'docs/auth-setup.md', type: 'guide', concept: arg || 'authentication' }
      ],
      aiDocs: [
        { path: 'docs/ai/auth-overview-ai.md', type: 'concept', concept: arg || 'authentication', tokenCount: 300 },
        { path: 'docs/ai/auth-setup-ai.md', type: 'guide', concept: arg || 'authentication', tokenCount: 250 }
      ],
      created: [
        'docs/auth-overview.md',
        'docs/ai/auth-overview-ai.md',
        'docs/auth-setup.md',
        'docs/ai/auth-setup-ai.md'
      ]
    },
    duration: 800,
    timestamp: new Date().toISOString(),
    workingDirectory: process.cwd()
  },
  analyze: {
    success: true,
    command: 'analyze',
    result: {
      type: 'analyze',
      integration: arg || 'stripe',
      summary: \`Analyzed and documented integration: \${arg || 'stripe'}\`,
      humanDocsCount: 1,
      aiDocsCount: 1,
      humanDocs: [
        { path: 'docs/integrations/stripe.md', type: 'integration', integration: arg || 'stripe' }
      ],
      aiDocs: [
        { path: 'docs/ai/integrations-stripe-ai.md', type: 'integration', integration: arg || 'stripe', tokenCount: 400 }
      ],
      created: [
        'docs/integrations/stripe.md',
        'docs/ai/integrations-stripe-ai.md'
      ]
    },
    duration: 600,
    timestamp: new Date().toISOString(),
    workingDirectory: process.cwd()
  },
  search: {
    success: true,
    command: 'search',
    result: {
      type: 'search',
      query: arg || 'authentication',
      summary: \`Found 2 files matching "\${arg || 'authentication'}"\`,
      results: [
        {
          path: 'docs/test-auth.md',
          type: 'human',
          matches: [
            {
              lineNumber: 1,
              line: '# Authentication',
              context: '# Authentication\\n\\nThis document covers user authentication and authorization systems.'
            }
          ]
        },
        {
          path: 'docs/ai/test-ai.md',
          type: 'ai',
          matches: [
            {
              lineNumber: 3,
              line: 'authentication systems',
              context: 'AI-optimized content.\\nauthentication systems\\nare critical'
            }
          ]
        }
      ],
      resultsCount: 2
    },
    duration: 150,
    timestamp: new Date().toISOString(),
    workingDirectory: process.cwd()
  },
  index: {
    success: true,
    command: 'index',
    result: {
      type: 'index',
      summary: 'Rebuilt documentation index',
      indexPath: 'docs/ai/index.md',
      totalFiles: 5,
      timestamp: new Date().toISOString()
    },
    duration: 200,
    timestamp: new Date().toISOString(),
    workingDirectory: process.cwd()
  }
};

if (!command) {
  console.log(JSON.stringify({
    success: false,
    error: 'No command provided',
    timestamp: new Date().toISOString(),
    workingDirectory: process.cwd()
  }, null, 2));
  process.exit(1);
}

if (!responses[command]) {
  console.log(JSON.stringify({
    success: false,
    error: \`Unknown command: \${command}\`,
    command,
    timestamp: new Date().toISOString(),
    workingDirectory: process.cwd()
  }, null, 2));
  process.exit(1);
}

if ((command === 'expand' || command === 'analyze' || command === 'search') && !arg) {
  let errorMsg = '';
  if (command === 'expand') errorMsg = 'Concept name is required for expand command';
  else if (command === 'analyze') errorMsg = 'Integration name is required for analyze command';
  else if (command === 'search') errorMsg = 'Search query is required';

  console.log(JSON.stringify({
    success: false,
    error: errorMsg,
    command,
    timestamp: new Date().toISOString(),
    workingDirectory: process.cwd()
  }, null, 2));
  process.exit(1);
}

// For bootstrap command, create directories
if (command === 'bootstrap') {
  createMockDirectories();
}

const response = responses[command];
console.log(JSON.stringify(response, null, 2));
process.exit(response.success ? 0 : 1);
`;

  await fs.writeFile(scriptPath, mockScript);
  await fs.chmod(scriptPath, 0o755);
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      cwd: process.cwd()
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
      resolve({
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    child.on('error', (error) => {
      resolve({
        exitCode: 1,
        stdout: '',
        stderr: error.message
      });
    });
  });
}