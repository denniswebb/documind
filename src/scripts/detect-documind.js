#!/usr/bin/env node

/**
 * DocuMind Detection Utility
 *
 * Simple utility for AI agents to check if DocuMind is properly installed
 * and available for use. Returns clear status information for decision-making.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocuMindDetector {
  constructor(workingDir = process.env.DOCUMIND_TEST_CWD || process.cwd()) {
    this.workingDir = workingDir;
    this.documindDir = path.join(workingDir, '.documind');
  }

  async detect() {
    const result = {
      available: false,
      installed: false,
      version: null,
      components: {
        core: false,
        templates: false,
        scripts: false,
        aiOrchestrator: false
      },
      paths: {
        documindDir: this.documindDir,
        coreDir: path.join(this.documindDir, 'core'),
        templatesDir: path.join(this.documindDir, 'templates'),
        scriptsDir: path.join(this.documindDir, 'scripts'),
        aiOrchestrator: path.join(this.documindDir, 'scripts', 'ai-orchestrator.js')
      },
      errors: [],
      suggestions: []
    };

    try {
      // Check if .documind directory exists
      result.installed = await this.exists(this.documindDir);

      if (!result.installed) {
        result.errors.push('.documind directory not found');
        result.suggestions.push('Run DocuMind installation: npx @dennis-webb/documind init');
        return result;
      }

      // Check version
      result.version = await this.getVersion();

      // Check core components
      result.components.core = await this.exists(result.paths.coreDir);
      result.components.templates = await this.exists(result.paths.templatesDir);
      result.components.scripts = await this.exists(result.paths.scriptsDir);
      result.components.aiOrchestrator = await this.exists(result.paths.aiOrchestrator);

      // Validate core files
      if (result.components.core) {
        const coreFiles = ['generator.js', 'ai-index-builder.js'];
        for (const file of coreFiles) {
          const filePath = path.join(result.paths.coreDir, file);
          if (!await this.exists(filePath)) {
            result.errors.push(`Missing core file: ${file}`);
          }
        }
      } else {
        result.errors.push('Core system not found');
      }

      // Validate templates
      if (result.components.templates) {
        const templatesPath = path.join(result.paths.templatesDir, 'ai-optimized');
        if (!await this.exists(templatesPath)) {
          result.errors.push('AI-optimized templates not found');
        }
      } else {
        result.errors.push('Templates directory not found');
      }

      // Check for AI orchestrator
      if (!result.components.aiOrchestrator) {
        result.errors.push('AI orchestrator script not found');
        result.suggestions.push('Update DocuMind installation to get latest AI integration features');
      }

      // Test basic functionality
      if (result.components.aiOrchestrator) {
        try {
          // Try to import the orchestrator (basic syntax check)
          const { AIOrchestrator } = await import(result.paths.aiOrchestrator);
          if (AIOrchestrator) {
            result.available = true;
          }
        } catch (error) {
          result.errors.push(`AI orchestrator import failed: ${error.message}`);
        }
      }

      // Overall availability check
      if (!result.available && result.components.core && result.components.templates) {
        // DocuMind is installed but might be older version without AI orchestrator
        result.available = true;
        result.suggestions.push('Consider updating to latest version for enhanced AI integration');
      }

      return result;

    } catch (error) {
      result.errors.push(`Detection failed: ${error.message}`);
      return result;
    }
  }

  async getVersion() {
    try {
      const versionPath = path.join(this.documindDir, 'VERSION');
      if (await this.exists(versionPath)) {
        const version = await fs.readFile(versionPath, 'utf8');
        return version.trim();
      }
    } catch (error) {
      // Version file might not exist in older installations
    }
    return null;
  }

  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Simple status for quick checks
  async isAvailable() {
    const result = await this.detect();
    return result.available;
  }

  // Get installation status
  async getStatus() {
    const result = await this.detect();

    if (result.available) {
      return {
        status: 'available',
        message: 'DocuMind is installed and ready to use',
        version: result.version
      };
    } else if (result.installed) {
      return {
        status: 'incomplete',
        message: 'DocuMind is partially installed',
        errors: result.errors,
        suggestions: result.suggestions
      };
    } else {
      return {
        status: 'not_installed',
        message: 'DocuMind is not installed',
        suggestions: result.suggestions
      };
    }
  }

  // Format results for AI consumption
  async getAIReport() {
    const result = await this.detect();
    const status = await this.getStatus();

    return {
      available: result.available,
      status: status.status,
      message: status.message,
      canUseOrchestrator: result.components.aiOrchestrator,
      orchestratorPath: result.components.aiOrchestrator ? result.paths.aiOrchestrator : null,
      workingDirectory: this.workingDir,
      timestamp: new Date().toISOString(),
      details: result
    };
  }
}

// CLI interface when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const detector = new DocuMindDetector();

  const command = process.argv[2] || 'detect';

  async function runCLI() {
    try {
      switch (command) {
        case 'detect':
        case 'check':
          const result = await detector.detect();
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.available ? 0 : 1);
          break;

        case 'status':
          const status = await detector.getStatus();
          console.log(JSON.stringify(status, null, 2));
          process.exit(status.status === 'available' ? 0 : 1);
          break;

        case 'available':
          const available = await detector.isAvailable();
          console.log(available);
          process.exit(available ? 0 : 1);
          break;

        case 'ai-report':
          const aiReport = await detector.getAIReport();
          console.log(JSON.stringify(aiReport, null, 2));
          process.exit(aiReport.available ? 0 : 1);
          break;

        case 'help':
          console.log(`
DocuMind Detection Utility

Usage: detect-documind.js [command]

Commands:
  detect      Full detection report (default)
  status      Simple status information
  available   Returns true/false for availability
  ai-report   AI-friendly detection report
  help        Show this help message

Exit codes:
  0    DocuMind is available
  1    DocuMind is not available or error occurred
`);
          process.exit(0);
          break;

        default:
          const errorResult = {
            available: false,
            status: 'error',
            message: `Unknown command: ${command}`,
            error: `Unknown command: ${command}`,
            timestamp: new Date().toISOString(),
            workingDirectory: process.cwd()
          };
          console.log(JSON.stringify(errorResult, null, 2));
          process.exit(1);
      }
    } catch (error) {
      const errorResult = {
        available: false,
        status: 'error',
        message: 'Detection error occurred',
        error: error.message,
        timestamp: new Date().toISOString(),
        workingDirectory: process.cwd()
      };
      console.log(JSON.stringify(errorResult, null, 2));
      process.exit(1);
    }
  }

  runCLI();
}

export default DocuMindDetector;
export { DocuMindDetector };