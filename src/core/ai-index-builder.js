import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TokenCounter } from '../scripts/token_count.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIIndexBuilder {
  constructor() {
    this.indexPath = path.join(__dirname, '../templates/ai-optimized/AI_README.md');
    this.docsDir = path.join(__dirname, '../../docs');
    this.aiDocsDir = path.join(this.docsDir, 'ai');
    this.tokenCounter = new TokenCounter();
  }

  async updateMasterIndex(generatedFiles = []) {
    try {
      const existingAIFiles = await this.scanExistingAIFiles();
      const allFiles = [...existingAIFiles, ...generatedFiles];

      const indexContent = await this.buildIndexContent(allFiles);
      await this.ensureDirectoryExists(this.aiDocsDir);
      await fs.writeFile(path.join(this.aiDocsDir, 'AI_README.md'), indexContent, 'utf8');

      return {
        totalFiles: allFiles.length,
        indexPath: path.join(this.aiDocsDir, 'AI_README.md'),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to update master index: ${error.message}`);
    }
  }

  async scanExistingAIFiles() {
    try {
      const files = [];
      const aiFiles = await fs.readdir(this.aiDocsDir);

      for (const file of aiFiles) {
        if (file.endsWith('-ai.md') && file !== 'AI_README.md') {
          const filePath = path.join(this.aiDocsDir, file);
          const stats = await fs.stat(filePath);

          files.push({
            path: filePath,
            name: file,
            type: this.inferDocumentationType(file),
            tokenCount: await this.getTokenCount(filePath),
            lastModified: stats.mtime
          });
        }
      }

      return files;
    } catch (error) {
      return [];
    }
  }

  async buildIndexContent(files) {
    const template = await this.loadIndexTemplate();
    const groupedFiles = this.groupFilesByType(files);
    const taskRouting = this.buildTaskRouting(groupedFiles);
    const tokenSummary = this.buildTokenSummary(files);
    const manifestList = this.buildManifestList(groupedFiles);

    return template
      .replace('{{GENERATED_TIMESTAMP}}', new Date().toISOString())
      .replace('{{TOTAL_DOCUMENTS}}', files.length.toString())
      .replace('{{TASK_ROUTING_TABLE}}', taskRouting)
      .replace('{{TOKEN_BUDGET_SUMMARY}}', tokenSummary)
      .replace('{{MANIFEST_LISTINGS}}', manifestList)
      .replace('{{VALIDATION_STATUS}}', this.buildValidationStatus(files));
  }

  async loadIndexTemplate() {
    const templatePath = path.join(__dirname, '../templates/ai-optimized/AI_README.md');
    try {
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      return this.getDefaultIndexTemplate();
    }
  }

  getDefaultIndexTemplate() {
    return `# AI Documentation Master Index

## Navigation Quick Reference

**Generated:** {{GENERATED_TIMESTAMP}}
**Total Documents:** {{TOTAL_DOCUMENTS}}

## Task-Based Routing

{{TASK_ROUTING_TABLE}}

## Token Budget Summary

{{TOKEN_BUDGET_SUMMARY}}

## Available Manifests

{{MANIFEST_LISTINGS}}

## Validation Status

{{VALIDATION_STATUS}}

---

*This index is automatically generated and updated by the DocuMind system.*
`;
  }

  groupFilesByType(files) {
    const groups = {
      concept: [],
      integration: [],
      architecture: [],
      other: []
    };

    files.forEach(file => {
      const type = file.type || this.inferDocumentationType(file.name || file.path);
      if (groups[type]) {
        groups[type].push(file);
      } else {
        groups.other.push(file);
      }
    });

    return groups;
  }

  buildTaskRouting(groupedFiles) {
    let routing = `| Task Type | Available Documents | Token Range |\n`;
    routing += `|-----------|-------------------|-------------|\n`;

    Object.entries(groupedFiles).forEach(([type, files]) => {
      if (files.length > 0) {
        const fileNames = files.map(f => this.getDisplayName(f)).join(', ');
        const tokenRange = this.getTokenRange(files);
        routing += `| ${type.charAt(0).toUpperCase() + type.slice(1)} | ${fileNames} | ${tokenRange} |\n`;
      }
    });

    return routing;
  }

  buildTokenSummary(files) {
    const totalTokens = files.reduce((sum, file) => sum + (file.tokenCount || 0), 0);
    const avgTokens = files.length > 0 ? Math.round(totalTokens / files.length) : 0;
    const maxTokens = Math.max(...files.map(f => f.tokenCount || 0));

    return `**Total Tokens:** ${totalTokens}
**Average per Document:** ${avgTokens}
**Largest Document:** ${maxTokens} tokens
**Document Count:** ${files.length}`;
  }

  buildManifestList(groupedFiles) {
    let manifestList = '';

    Object.entries(groupedFiles).forEach(([type, files]) => {
      if (files.length > 0) {
        manifestList += `### ${type.charAt(0).toUpperCase() + type.slice(1)} Documents\n\n`;
        files.forEach(file => {
          const name = this.getDisplayName(file);
          const relativePath = this.getRelativePath(file.path);
          manifestList += `- **${name}** - ${relativePath} (${file.tokenCount || 0} tokens)\n`;
        });
        manifestList += '\n';
      }
    });

    return manifestList;
  }

  buildValidationStatus(files) {
    const now = new Date();
    const recentFiles = files.filter(file => {
      if (file.lastModified) {
        const age = now - new Date(file.lastModified);
        return age < 24 * 60 * 60 * 1000; // Less than 24 hours
      }
      return false;
    });

    return `**Last Validation:** ${now.toISOString()}
**Recently Updated:** ${recentFiles.length} files
**Status:** ${files.length > 0 ? 'Active' : 'No AI documents found'}`;
  }

  inferDocumentationType(filename) {
    const name = filename.toLowerCase();
    if (name.includes('concept')) return 'concept';
    if (name.includes('integration')) return 'integration';
    if (name.includes('architecture') || name.includes('arch')) return 'architecture';
    return 'other';
  }

  getDisplayName(file) {
    const name = path.basename(file.path || file.name, '-ai.md');
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getRelativePath(filePath) {
    return path.relative(this.docsDir, filePath);
  }

  getTokenRange(files) {
    if (files.length === 0) return '0';
    const tokens = files.map(f => f.tokenCount || 0);
    const min = Math.min(...tokens);
    const max = Math.max(...tokens);
    return min === max ? `${min}` : `${min}-${max}`;
  }

  async getTokenCount(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const result = await this.tokenCounter.count(content);
      return result.tokens;
    } catch (error) {
      // Fallback to heuristic estimation
      try {
        const content = await fs.readFile(filePath, 'utf8');
        return this.estimateTokenCount(content);
      } catch (readError) {
        return 0;
      }
    }
  }

  estimateTokenCount(content) {
    if (!content) return 0;
    return Math.ceil(content.split(/\s+/).length * 1.3);
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
}

export default AIIndexBuilder;