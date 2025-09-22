#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Generator from '../core/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocuMindCLI {
  constructor() {
    this.generator = new Generator();
    this.commands = {
      bootstrap: this.handleBootstrap.bind(this),
      expand: this.handleExpand.bind(this),
      analyze: this.handleAnalyze.bind(this),
      generate: this.handleGenerate.bind(this),
      all: this.handleGenerateAll.bind(this)
    };
  }

  async run(args = process.argv.slice(2)) {
    try {
      if (args.length === 0 || args[0] === 'help') {
        this.showHelp();
        return;
      }

      const command = args[0];
      const commandArgs = args.slice(1);

      if (this.commands[command]) {
        await this.commands[command](commandArgs);
      } else {
        console.error(`Unknown command: ${command}`);
        this.showHelp();
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  async handleBootstrap(args) {
    console.log('Bootstrapping DocuMind documentation system...');

    const variables = {
      system_name: args[0] || 'project',
      concept_name: 'bootstrap',
      service_name: 'documind'
    };

    const manifestPath = path.join(__dirname, '../templates/ai-optimized/concept-ai.yaml');
    const result = await this.generator.generateFromManifest(manifestPath, variables);

    console.log(`✓ Generated documentation:`);
    console.log(`  Human version: ${result.humanPath}`);
    console.log(`  AI version: ${result.aiPath}`);
    console.log(`  Token count: ${result.tokenCount}`);
  }

  async handleExpand(args) {
    if (args.length < 2) {
      console.error('Usage: documind expand <type> <name> [variables...]');
      return;
    }

    const [type, name] = args;
    const variables = this.parseVariables(args.slice(2));
    variables[`${type}_name`] = name;

    console.log(`Expanding ${type}: ${name}`);

    const manifestPath = path.join(__dirname, `../templates/ai-optimized/${type}-ai.yaml`);
    const result = await this.generator.generateFromManifest(manifestPath, variables);

    console.log(`✓ Generated documentation:`);
    console.log(`  Human version: ${result.humanPath}`);
    console.log(`  AI version: ${result.aiPath}`);
    console.log(`  Token count: ${result.tokenCount}`);
  }

  async handleAnalyze(args) {
    if (args.length < 2) {
      console.error('Usage: documind analyze <type> <name> [variables...]');
      return;
    }

    const [type, name] = args;
    const variables = this.parseVariables(args.slice(2));
    variables[`${type}_name`] = name;

    console.log(`Analyzing ${type}: ${name}`);

    const manifestPath = path.join(__dirname, `../templates/ai-optimized/${type}-ai.yaml`);

    try {
      const result = await this.generator.generateFromManifest(manifestPath, variables);

      console.log(`✓ Analysis complete:`);
      console.log(`  Documentation generated: ${result.aiPath}`);
      console.log(`  Token count: ${result.tokenCount}`);
      console.log(`  Specialist role: ${result.manifest.specialist_role}`);

      if (result.manifest.token_budget) {
        const efficiency = ((result.manifest.token_budget.max_tokens - result.tokenCount) / result.manifest.token_budget.max_tokens * 100).toFixed(1);
        console.log(`  Token efficiency: ${efficiency}% budget remaining`);
      }
    } catch (error) {
      console.error(`Analysis failed: ${error.message}`);
    }
  }

  async handleGenerate(args) {
    if (args.length < 1) {
      console.error('Usage: documind generate <manifest-file> [variables...]');
      return;
    }

    const manifestFile = args[0];
    const variables = this.parseVariables(args.slice(1));

    console.log(`Generating from manifest: ${manifestFile}`);

    const manifestPath = path.resolve(manifestFile);
    const result = await this.generator.generateFromManifest(manifestPath, variables);

    console.log(`✓ Generated documentation:`);
    console.log(`  Human version: ${result.humanPath}`);
    console.log(`  AI version: ${result.aiPath}`);
    console.log(`  Token count: ${result.tokenCount}`);
  }

  async handleGenerateAll(args) {
    console.log('Generating all documentation from available manifests...');

    const results = await this.generator.generateAll();

    console.log(`✓ Generated ${results.length} documentation sets:`);
    results.forEach(result => {
      console.log(`  ${path.basename(result.aiPath)} (${result.tokenCount} tokens)`);
    });

    const totalTokens = results.reduce((sum, r) => sum + r.tokenCount, 0);
    console.log(`\nTotal tokens generated: ${totalTokens}`);
  }

  parseVariables(args) {
    const variables = {};

    for (let i = 0; i < args.length; i += 2) {
      if (i + 1 < args.length) {
        const key = args[i].replace(/^--/, '');
        const value = args[i + 1];
        variables[key] = value;
      }
    }

    return variables;
  }

  showHelp() {
    console.log(`DocuMind CLI - Dual-Purpose Documentation Generator

Usage:
  documind <command> [options]

Commands:
  bootstrap [system-name]              Bootstrap documentation system
  expand <type> <name> [--var value]   Generate specific documentation type
  analyze <type> <name> [--var value]  Analyze and generate with metrics
  generate <manifest> [--var value]    Generate from specific manifest
  all                                  Generate all available documentation

Types:
  concept      - Conceptual documentation
  integration  - Integration guides
  architecture - Architecture documentation

Examples:
  documind bootstrap myproject
  documind expand concept "authentication"
  documind analyze integration "redis" --service_name "redis-cache"
  documind generate ./templates/ai-optimized/concept-ai.yaml --concept_name "auth"
  documind all

Variables:
  Use --key value format to pass template variables
  Common variables: concept_name, service_name, system_name, module_name
`);
  }
}

if (process.argv[1] && import.meta.url.startsWith('file:')) {
  const cli = new DocuMindCLI();
  cli.run().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

export default DocuMindCLI;