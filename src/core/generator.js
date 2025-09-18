import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import TemplateProcessor from './template-processor.js';
import { TokenCounter } from '../scripts/token_count.js';
import AIIndexBuilder from './ai-index-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Generator {
  constructor() {
    this.templateProcessor = new TemplateProcessor();
    this.tokenCounter = new TokenCounter();
    this.aiIndexBuilder = new AIIndexBuilder();
  }

  async generateFromManifest(manifestPath, variables = {}) {
    try {
      const manifest = await this.loadManifest(manifestPath);
      const templateContent = await this.loadTemplate(manifest.base_template);

      const humanContent = this.templateProcessor.processTemplate(templateContent, variables);
      const aiContent = this.templateProcessor.processTemplate(templateContent, variables, manifest.ai_output_format);

      const result = await this.tokenCounter.count(aiContent);
      const tokenCount = result.tokens;
      this.validateTokenBudget(tokenCount, manifest.token_budget);

      const humanOutputPath = this.resolveOutputPath(manifest.output_path_pattern, variables, false);
      const aiOutputPath = this.resolveOutputPath(manifest.output_path_pattern, variables, true);

      await this.ensureDirectoryExists(path.dirname(humanOutputPath));
      await this.ensureDirectoryExists(path.dirname(aiOutputPath));

      await fs.writeFile(humanOutputPath, humanContent, 'utf8');
      await fs.writeFile(aiOutputPath, aiContent, 'utf8');

      await this.aiIndexBuilder.updateMasterIndex([{
        path: aiOutputPath,
        type: manifest.specialist_role,
        tokenCount: tokenCount,
        variables: variables
      }]);

      return {
        humanPath: humanOutputPath,
        aiPath: aiOutputPath,
        tokenCount: tokenCount,
        manifest: manifest
      };
    } catch (error) {
      throw new Error(`Generation failed: ${error.message}`);
    }
  }

  async generateAll() {
    const manifestsDir = path.join(__dirname, '../templates/ai-optimized');
    const manifestFiles = await fs.readdir(manifestsDir);
    const yamlFiles = manifestFiles.filter(file => file.endsWith('.yaml') && file !== 'ai-manifest-schema.yaml');

    const results = [];
    for (const file of yamlFiles) {
      const manifestPath = path.join(manifestsDir, file);

      try {
        // Check if manifest has a default_slug or other safe identifier
        const manifest = await this.loadManifest(manifestPath);
        let variables;

        if (manifest.default_slug) {
          variables = {
            concept_name: manifest.default_slug,
            service_name: manifest.default_slug,
            system_name: manifest.default_slug
          };
        } else {
          variables = this.extractDefaultVariables(file);
        }

        const result = await this.generateFromManifest(manifestPath, variables);
        results.push(result);
      } catch (error) {
        console.warn(`Skipped ${file}: ${error.message}`);
      }
    }

    return results;
  }

  async loadManifest(manifestPath) {
    const content = await fs.readFile(manifestPath, 'utf8');
    return yaml.parse(content);
  }

  async loadTemplate(templatePath) {
    const fullPath = path.resolve(path.join(__dirname, '../templates', templatePath));
    return await fs.readFile(fullPath, 'utf8');
  }

  resolveOutputPath(pattern, variables, isAI = false) {
    let outputPath = pattern;

    // First pass: replace known variables
    Object.entries(variables).forEach(([key, value]) => {
      // Try both lowercase and uppercase versions
      const lowercasePlaceholder = `{${key}}`;
      const uppercasePlaceholder = `{${key.toUpperCase()}}`;
      outputPath = outputPath.replace(new RegExp(lowercasePlaceholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      outputPath = outputPath.replace(new RegExp(uppercasePlaceholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    // Second pass: find and replace any remaining placeholders with defaults
    const unresolvedPlaceholders = outputPath.match(/\{[A-Za-z_]+\}/g);
    if (unresolvedPlaceholders) {
      unresolvedPlaceholders.forEach(placeholder => {
        const varName = placeholder.slice(1, -1); // Remove { and }
        const defaultValue = this.templateProcessor.generateDefaultValue(varName);
        outputPath = outputPath.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), defaultValue);
      });
    }

    if (isAI) {
      const dir = path.dirname(outputPath);
      const basename = path.basename(outputPath, '.md');
      outputPath = path.join(dir, 'ai', `${basename}-ai.md`);
    }

    return path.resolve(outputPath);
  }

  validateTokenBudget(tokenCount, budget) {
    if (budget && tokenCount > budget.max_tokens) {
      throw new Error(`Token count ${tokenCount} exceeds budget ${budget.max_tokens}`);
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  extractDefaultVariables(filename) {
    const basename = path.basename(filename, '-ai.yaml');
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format

    // Handle known template files that should have unique defaults
    const knownTemplates = ['concept', 'integration', 'architecture'];
    if (knownTemplates.includes(basename)) {
      const timestampedName = `${basename}-${timestamp}`;
      console.warn(`Using timestamped default for ${filename}: ${timestampedName}`);
      console.warn('Consider using --name parameter for better naming');
      return {
        concept_name: timestampedName,
        service_name: timestampedName,
        system_name: timestampedName
      };
    }

    return {
      concept_name: basename,
      service_name: basename,
      system_name: basename
    };
  }
}

export default Generator;