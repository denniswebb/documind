#!/usr/bin/env node

/**
 * AI Documentation Orchestrator
 *
 * This script coordinates the generation of both human and AI documentation
 * when executed by AI agents. It provides a simple interface for AI agents
 * to generate comprehensive documentation automatically.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Generator from '../core/generator.js';
import AIIndexBuilder from '../core/ai-index-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIOrchestrator {
  constructor() {
    this.generator = new Generator();
    this.aiIndexBuilder = new AIIndexBuilder();
    // Use test directory if running in test context
    this.workingDir = process.env.DOCUMIND_TEST_CWD || process.cwd();
    this.documindDir = path.join(this.workingDir, '.documind');
  }

  async execute(command, options = {}) {
    try {
      const startTime = Date.now();

      // Validate DocuMind installation
      await this.validateInstallation();

      // Parse command and execute appropriate action
      const result = await this.executeCommand(command, options);

      const duration = Date.now() - startTime;

      return {
        success: true,
        command,
        options,
        result,
        duration,
        timestamp: new Date().toISOString(),
        workingDirectory: this.workingDir
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        command,
        options,
        timestamp: new Date().toISOString(),
        workingDirectory: this.workingDir
      };
    }
  }

  async validateInstallation() {
    const requiredDirs = [
      path.join(this.documindDir, 'core'),
      path.join(this.documindDir, 'templates')
    ];

    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
      } catch (error) {
        throw new Error(`DocuMind installation incomplete: ${dir} not found`);
      }
    }
  }

  async executeCommand(command, options) {
    switch (command) {
      case 'bootstrap':
        return await this.bootstrapDocumentation(options);
      case 'expand':
        return await this.expandConcept(options.concept, options);
      case 'analyze':
        return await this.analyzeIntegration(options.integration, options);
      case 'update':
        return await this.updateSection(options.section, options);
      case 'index':
        return await this.rebuildIndex(options);
      case 'search':
        return await this.searchDocumentation(options.query, options);
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  async bootstrapDocumentation(options = {}) {
    const results = {
      humanDocs: [],
      aiDocs: [],
      created: [],
      updated: []
    };

    // Generate all available manifests
    const generationResults = await this.generator.generateAll();

    for (const result of generationResults) {
      results.humanDocs.push({
        path: result.humanPath,
        type: result.manifest.specialist_role,
        tokenCount: result.tokenCount
      });

      results.aiDocs.push({
        path: result.aiPath,
        type: result.manifest.specialist_role,
        tokenCount: result.tokenCount
      });

      results.created.push(result.humanPath, result.aiPath);
    }

    // Update AI index
    const indexResult = await this.aiIndexBuilder.updateMasterIndex();
    results.updated.push(indexResult.indexPath);

    // Generate human documentation structure
    await this.createHumanDocStructure();

    // Generate AI documentation structure
    await this.createAIDocStructure();

    return {
      type: 'bootstrap',
      summary: `Generated ${results.humanDocs.length} human documentation files and ${results.aiDocs.length} AI-optimized files`,
      humanDocsCount: results.humanDocs.length,
      aiDocsCount: results.aiDocs.length,
      totalTokens: results.aiDocs.reduce((sum, doc) => sum + doc.tokenCount, 0),
      ...results
    };
  }

  async expandConcept(conceptName, options = {}) {
    if (!conceptName) {
      throw new Error('Concept name is required for expand command');
    }

    const results = {
      humanDocs: [],
      aiDocs: [],
      created: []
    };

    // Find relevant manifests for the concept
    const manifestsDir = path.join(this.documindDir, 'templates', 'ai-optimized');
    const manifestFiles = await fs.readdir(manifestsDir);
    const relevantManifests = manifestFiles.filter(file =>
      file.endsWith('.yaml') &&
      file !== 'ai-manifest-schema.yaml' &&
      (file.includes('concept') || file.includes('general'))
    );

    for (const manifestFile of relevantManifests) {
      const manifestPath = path.join(manifestsDir, manifestFile);
      const variables = {
        concept_name: conceptName,
        ...options.variables
      };

      try {
        const result = await this.generator.generateFromManifest(manifestPath, variables);

        results.humanDocs.push({
          path: result.humanPath,
          type: result.manifest.specialist_role,
          concept: conceptName
        });

        results.aiDocs.push({
          path: result.aiPath,
          type: result.manifest.specialist_role,
          concept: conceptName,
          tokenCount: result.tokenCount
        });

        results.created.push(result.humanPath, result.aiPath);
      } catch (error) {
        console.warn(`Failed to generate from ${manifestFile}: ${error.message}`);
      }
    }

    // Update AI index
    await this.aiIndexBuilder.updateMasterIndex();

    return {
      type: 'expand',
      concept: conceptName,
      summary: `Expanded documentation for concept: ${conceptName}`,
      humanDocsCount: results.humanDocs.length,
      aiDocsCount: results.aiDocs.length,
      ...results
    };
  }

  async analyzeIntegration(integrationName, options = {}) {
    if (!integrationName) {
      throw new Error('Integration name is required for analyze command');
    }

    const results = {
      humanDocs: [],
      aiDocs: [],
      created: []
    };

    // Find integration manifests
    const manifestsDir = path.join(this.documindDir, 'templates', 'ai-optimized');
    const manifestFiles = await fs.readdir(manifestsDir);
    const integrationManifests = manifestFiles.filter(file =>
      file.endsWith('.yaml') &&
      (file.includes('integration') || file.includes('service'))
    );

    for (const manifestFile of integrationManifests) {
      const manifestPath = path.join(manifestsDir, manifestFile);
      const variables = {
        service_name: integrationName,
        integration_name: integrationName,
        ...options.variables
      };

      try {
        const result = await this.generator.generateFromManifest(manifestPath, variables);

        results.humanDocs.push({
          path: result.humanPath,
          type: result.manifest.specialist_role,
          integration: integrationName
        });

        results.aiDocs.push({
          path: result.aiPath,
          type: result.manifest.specialist_role,
          integration: integrationName,
          tokenCount: result.tokenCount
        });

        results.created.push(result.humanPath, result.aiPath);
      } catch (error) {
        console.warn(`Failed to generate from ${manifestFile}: ${error.message}`);
      }
    }

    // Update AI index
    await this.aiIndexBuilder.updateMasterIndex();

    return {
      type: 'analyze',
      integration: integrationName,
      summary: `Analyzed and documented integration: ${integrationName}`,
      humanDocsCount: results.humanDocs.length,
      aiDocsCount: results.aiDocs.length,
      ...results
    };
  }

  async updateSection(sectionName, options = {}) {
    if (!sectionName) {
      throw new Error('Section name is required for update command');
    }

    // For now, treat update similar to expand but with refresh semantics
    return await this.expandConcept(sectionName, {
      ...options,
      mode: 'update',
      variables: { section_name: sectionName, ...options.variables }
    });
  }

  async rebuildIndex(options = {}) {
    const indexResult = await this.aiIndexBuilder.updateMasterIndex();

    return {
      type: 'index',
      summary: 'Rebuilt documentation index',
      indexPath: indexResult.indexPath,
      totalFiles: indexResult.totalFiles,
      timestamp: indexResult.timestamp
    };
  }

  async searchDocumentation(query, options = {}) {
    if (!query) {
      throw new Error('Search query is required');
    }

    // Basic search implementation - could be enhanced with full-text search
    const docsDir = path.join(this.workingDir, 'docs');
    const searchResults = [];

    try {
      const files = await this.getAllMarkdownFiles(docsDir);

      for (const filePath of files) {
        const content = await fs.readFile(filePath, 'utf8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          const relativePath = path.relative(this.workingDir, filePath);
          searchResults.push({
            path: relativePath,
            type: 'human',
            matches: this.findMatches(content, query)
          });
        }
      }

      // Also search AI docs
      const aiDocsDir = path.join(docsDir, 'ai');
      if (await this.exists(aiDocsDir)) {
        const aiFiles = await this.getAllMarkdownFiles(aiDocsDir);

        for (const filePath of aiFiles) {
          const content = await fs.readFile(filePath, 'utf8');
          if (content.toLowerCase().includes(query.toLowerCase())) {
            const relativePath = path.relative(this.workingDir, filePath);
            searchResults.push({
              path: relativePath,
              type: 'ai',
              matches: this.findMatches(content, query)
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Search error: ${error.message}`);
    }

    return {
      type: 'search',
      query,
      summary: `Found ${searchResults.length} files matching "${query}"`,
      results: searchResults,
      resultsCount: searchResults.length
    };
  }

  async createHumanDocStructure() {
    const docsDir = path.join(this.workingDir, 'docs');
    const directories = [
      '01-getting-oriented',
      '02-core-concepts',
      '03-integrations',
      '04-development'
    ];

    for (const dir of directories) {
      const dirPath = path.join(docsDir, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }

  async createAIDocStructure() {
    const docsDir = path.join(this.workingDir, 'docs');
    const aiDocsDir = path.join(docsDir, 'ai');

    try {
      await fs.mkdir(aiDocsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async getAllMarkdownFiles(dir) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          files.push(...await this.getAllMarkdownFiles(fullPath));
        } else if (entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist
    }

    return files;
  }

  findMatches(content, query) {
    const lines = content.split('\n');
    const matches = [];
    const queryLower = query.toLowerCase();

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(queryLower)) {
        matches.push({
          lineNumber: index + 1,
          line: line.trim(),
          context: lines.slice(Math.max(0, index - 1), index + 2).join('\n')
        });
      }
    });

    return matches.slice(0, 5); // Limit to 5 matches per file
  }

  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// CLI interface when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const orchestrator = new AIOrchestrator();

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error('Usage: ai-orchestrator.js <command> [options]');
    console.error('Commands: bootstrap, expand <concept>, analyze <integration>, update <section>, index, search <query>');
    process.exit(1);
  }

  const options = {};

  // Parse basic options
  if (command === 'expand' && args[1]) {
    options.concept = args[1];
  } else if (command === 'analyze' && args[1]) {
    options.integration = args[1];
  } else if (command === 'update' && args[1]) {
    options.section = args[1];
  } else if (command === 'search' && args[1]) {
    options.query = args[1];
  }

  // Parse additional variables
  for (let i = 2; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (key && value && key.startsWith('--')) {
      if (!options.variables) options.variables = {};
      options.variables[key.slice(2)] = value;
    }
  }

  orchestrator.execute(command, options)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      const errorResult = {
        success: false,
        error: error.message,
        command,
        options,
        timestamp: new Date().toISOString(),
        workingDirectory: process.cwd()
      };
      console.log(JSON.stringify(errorResult, null, 2));
      process.exit(1);
    });
}

export default AIOrchestrator;
export { AIOrchestrator };