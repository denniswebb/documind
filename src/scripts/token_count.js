#!/usr/bin/env node

/**
 * Token Counting Utility for DocuMind AI Documentation
 * 
 * Provides accurate token counting with fallback methods:
 * 1. tiktoken (preferred) - Model-specific tokenization
 * 2. heuristic - JavaScript-based estimation
 * 3. wc fallback - Basic word counting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const DEFAULT_MODEL = 'gpt-4';
const HEURISTIC_MULTIPLIER = 1.33; // words to tokens approximation

class TokenCounter {
  constructor(options = {}) {
    this.model = options.model || DEFAULT_MODEL;
    this.debug = options.debug || false;
    this.tiktoken = null;
    this.encoding = null;
  }

  async initialize() {
    try {
      // Attempt to load tiktoken dynamically
      const tiktoken = await import('tiktoken');
      this.tiktoken = tiktoken;
      this.encoding = tiktoken.encoding_for_model(this.model);
      this.log('✓ tiktoken loaded successfully');
      return 'tiktoken';
    } catch (error) {
      this.log('⚠ tiktoken not available, using heuristic method');
      this.log(`Install tiktoken for accurate counting: npm install tiktoken`);
      return 'heuristic';
    }
  }

  log(message) {
    if (this.debug) {
      console.error(`[TokenCounter] ${message}`);
    }
  }

  /**
   * Count tokens using tiktoken (most accurate)
   */
  countWithTiktoken(text) {
    if (!this.encoding) {
      throw new Error('tiktoken not initialized');
    }
    
    const tokens = this.encoding.encode(text);
    return {
      method: 'tiktoken',
      tokens: tokens.length,
      model: this.model,
      details: {
        characters: text.length,
        words: this.countWords(text),
        lines: text.split('\n').length
      }
    };
  }

  /**
   * Count tokens using heuristic method (good approximation)
   */
  countWithHeuristic(text) {
    const words = this.countWords(text);
    const tokens = Math.ceil(words * HEURISTIC_MULTIPLIER);
    
    // Additional adjustments for markdown and code
    let adjustment = 0;
    
    // Code blocks typically have more tokens per word
    const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
    adjustment += codeBlocks * 50;
    
    // Inline code
    const inlineCode = (text.match(/`[^`]+`/g) || []).length;
    adjustment += inlineCode * 2;
    
    // URLs and technical terms
    const urls = (text.match(/https?:\/\/[^\s]+/g) || []).length;
    adjustment += urls * 10;
    
    return {
      method: 'heuristic',
      tokens: tokens + adjustment,
      model: 'estimated',
      details: {
        characters: text.length,
        words: words,
        lines: text.split('\n').length,
        code_blocks: codeBlocks,
        inline_code: inlineCode,
        urls: urls,
        adjustment: adjustment
      }
    };
  }

  /**
   * Count words (used by heuristic method)
   */
  countWords(text) {
    return text
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  /**
   * Main counting method with fallback chain
   */
  async count(text) {
    const method = await this.initialize();
    
    try {
      if (method === 'tiktoken') {
        return this.countWithTiktoken(text);
      } else {
        return this.countWithHeuristic(text);
      }
    } catch (error) {
      this.log(`Error with ${method}: ${error.message}`);
      
      // Final fallback to heuristic if tiktoken fails
      if (method === 'tiktoken') {
        this.log('Falling back to heuristic method');
        return this.countWithHeuristic(text);
      }
      
      throw error;
    }
  }

  /**
   * Count tokens from file
   */
  async countFile(filePath) {
    try {
      const stats = fs.statSync(filePath);
      
      if (stats.size > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE})`);
      }
      
      if (stats.size === 0) {
        return {
          method: 'file_empty',
          tokens: 0,
          details: { file_path: filePath, file_size: 0 }
        };
      }
      
      // Check if file is likely binary
      const buffer = fs.readFileSync(filePath);
      if (this.isBinary(buffer)) {
        throw new Error('Binary file detected - only text files supported');
      }
      
      const text = buffer.toString('utf8');
      const result = await this.count(text);
      
      return {
        ...result,
        details: {
          ...result.details,
          file_path: filePath,
          file_size: stats.size
        }
      };
      
    } catch (error) {
      throw new Error(`Failed to process file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Simple binary file detection
   */
  isBinary(buffer) {
    const sample = buffer.slice(0, 512);
    for (let i = 0; i < sample.length; i++) {
      const byte = sample[i];
      if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validate token budget against manifest
   */
  async validateBudget(filePath, manifestPath) {
    try {
      const result = await this.countFile(filePath);

      let manifest;
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');

      // Determine if manifest is YAML or JSON based on file extension
      if (manifestPath.endsWith('.yaml') || manifestPath.endsWith('.yml')) {
        const yaml = await import('yaml');
        manifest = yaml.parse(manifestContent);
      } else {
        manifest = JSON.parse(manifestContent);
      }

      const budget = manifest.default_token_budget || manifest.budget || 5000;
      const isWithinBudget = result.tokens <= budget;

      return {
        ...result,
        budget_validation: {
          budget: budget,
          within_budget: isWithinBudget,
          usage_percentage: Math.round((result.tokens / budget) * 100),
          remaining: budget - result.tokens
        }
      };

    } catch (error) {
      throw new Error(`Budget validation failed: ${error.message}`);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  let filePath = null;
  let manifestPath = null;
  let validateBudgets = false;
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--file':
        filePath = args[++i];
        break;
      case '--model':
        options.model = args[++i];
        break;
      case '--debug':
        options.debug = true;
        break;
      case '--manifest':
        manifestPath = args[++i];
        break;
      case '--validate-budgets':
        validateBudgets = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        if (!filePath && !arg.startsWith('--')) {
          filePath = arg;
        }
    }
  }
  
  const counter = new TokenCounter(options);
  
  try {
    if (validateBudgets) {
      await validateAllBudgets(counter);
      return;
    }
    
    let result;
    
    if (filePath) {
      if (manifestPath) {
        result = await counter.validateBudget(filePath, manifestPath);
      } else {
        result = await counter.countFile(filePath);
      }
    } else {
      // Read from stdin
      const text = await readStdin();
      result = await counter.count(text);
    }
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error(JSON.stringify({
      error: true,
      message: error.message,
      timestamp: new Date().toISOString()
    }, null, 2));
    process.exit(1);
  }
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
    
    // Handle case where stdin is not piped
    setTimeout(() => {
      if (data === '') {
        reject(new Error('No input provided. Use --file or pipe text to stdin.'));
      }
    }, 100);
  });
}

async function validateAllBudgets(counter) {
  const manifestDir = path.join(__dirname, '../templates/ai-optimized');

  if (!fs.existsSync(manifestDir)) {
    console.error('Manifest directory not found:', manifestDir);
    process.exit(1);
  }

  const manifests = fs.readdirSync(manifestDir)
    .filter(file => file.endsWith('-ai.yaml'))
    .map(file => path.join(manifestDir, file));

  console.log(`Validating ${manifests.length} manifests...`);

  // Import YAML parser
  const yaml = await import('yaml');

  for (const manifestPath of manifests) {
    try {
      const manifest = yaml.parse(fs.readFileSync(manifestPath, 'utf8'));
      const templatePath = path.resolve(manifestDir, manifest.template_path);

      if (fs.existsSync(templatePath)) {
        const result = await counter.validateBudget(templatePath, manifestPath);
        console.log(`✓ ${path.basename(manifestPath)}: ${result.tokens}/${result.budget_validation.budget} tokens`);
      } else {
        console.log(`⚠ ${path.basename(manifestPath)}: template not found`);
      }
    } catch (error) {
      console.log(`✗ ${path.basename(manifestPath)}: ${error.message}`);
    }
  }
}

function printHelp() {
  console.log(`
Token Counter for DocuMind AI Documentation

USAGE:
  node token_count.js [OPTIONS] [FILE]
  echo "text" | node token_count.js [OPTIONS]

OPTIONS:
  --file PATH          Count tokens in file
  --model MODEL        Specify model for tiktoken (default: gpt-4)
  --manifest PATH      Validate against manifest budget
  --validate-budgets   Check all manifests in ai-optimized/
  --debug             Enable debug output
  --help              Show this help

EXAMPLES:
  node token_count.js README.md
  node token_count.js --file docs/architecture.md --model gpt-3.5-turbo
  echo "Hello world" | node token_count.js
  node token_count.js --validate-budgets

OUTPUT:
  JSON object with token count and method details
  
METHODS:
  tiktoken    - Most accurate (requires: npm install tiktoken)
  heuristic   - Good approximation using word count
  wc          - Basic fallback (use token_count.sh)
`);
}

// Run if called directly
if (process.argv[1] && import.meta.url.startsWith('file:') && import.meta.url.endsWith(process.argv[1])) {
  main().catch(console.error);
}

export { TokenCounter };