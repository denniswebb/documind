#!/usr/bin/env node

/**
 * YAML Validation Utility for DocuMind AI Manifests
 * 
 * Validates AI-optimized documentation manifests against schema
 * and performs consistency checks.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to import yaml parser
let yaml;
try {
  yaml = await import('yaml');
} catch (error) {
  console.error('YAML parser not found. Install with: npm install yaml');
  process.exit(1);
}

class ManifestValidator {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.schemaPath = options.schemaPath || this.findSchemaPath();
    this.schema = null;
  }

  log(message) {
    if (this.debug) {
      console.error(`[ManifestValidator] ${message}`);
    }
  }

  findSchemaPath() {
    const possiblePaths = [
      path.join(__dirname, '../templates/ai-optimized/ai-manifest-schema.yaml'),
      path.join(process.cwd(), '.documind/templates/ai-optimized/ai-manifest-schema.yaml'),
      path.join(process.cwd(), 'src/templates/ai-optimized/ai-manifest-schema.yaml')
    ];

    for (const schemaPath of possiblePaths) {
      if (fs.existsSync(schemaPath)) {
        this.log(`Found schema at: ${schemaPath}`);
        return schemaPath;
      }
    }

    throw new Error('ai-manifest-schema.yaml not found in expected locations');
  }

  loadSchema() {
    if (this.schema) return this.schema;

    try {
      const schemaContent = fs.readFileSync(this.schemaPath, 'utf8');
      this.schema = yaml.parse(schemaContent);
      this.log('Schema loaded successfully');
      return this.schema;
    } catch (error) {
      throw new Error(`Failed to load schema: ${error.message}`);
    }
  }

  validateManifest(manifestPath) {
    const errors = [];
    const warnings = [];

    try {
      // Load and parse manifest
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = yaml.parse(manifestContent);
      
      // Load schema
      const schema = this.loadSchema();
      
      // Basic structure validation
      this.validateRequiredFields(manifest, schema, errors);
      this.validateFieldTypes(manifest, schema, errors);
      this.validateEnumValues(manifest, schema, errors);
      
      // Business logic validation
      this.validateTokenBudgets(manifest, errors, warnings);
      this.validateSpecialistRoles(manifest, errors);
      this.validateTemplatePath(manifest, manifestPath, errors, warnings);
      this.validateLazyActivationRules(manifest, errors);
      
      // Schema-specific warnings
      this.checkWarningRules(manifest, schema, warnings);

      return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        manifest: manifest,
        file: manifestPath
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to parse manifest: ${error.message}`],
        warnings: [],
        manifest: null,
        file: manifestPath
      };
    }
  }

  validateRequiredFields(manifest, schema, errors) {
    const required = schema.required_fields || [];
    
    for (const field of required) {
      if (!(field in manifest)) {
        errors.push(`Missing required field: '${field}'`);
      }
    }
  }

  validateFieldTypes(manifest, schema, errors) {
    const fieldDefs = schema.field_definitions || {};
    
    for (const [field, definition] of Object.entries(fieldDefs)) {
      if (!(field in manifest)) continue;
      
      const value = manifest[field];
      const expectedType = definition.type;
      
      if (!this.checkType(value, expectedType)) {
        errors.push(`Field '${field}' must be of type ${expectedType}, got ${typeof value}`);
      }
      
      // Additional type-specific validations
      if (expectedType === 'string' && definition.pattern) {
        const regex = new RegExp(definition.pattern);
        if (!regex.test(value)) {
          errors.push(`Field '${field}' does not match pattern: ${definition.pattern}`);
        }
      }
      
      if (expectedType === 'integer') {
        if (definition.minimum !== undefined && value < definition.minimum) {
          errors.push(`Field '${field}' must be >= ${definition.minimum}, got ${value}`);
        }
        if (definition.maximum !== undefined && value > definition.maximum) {
          errors.push(`Field '${field}' must be <= ${definition.maximum}, got ${value}`);
        }
      }
      
      if (expectedType === 'array') {
        if (definition.min_items !== undefined && value.length < definition.min_items) {
          errors.push(`Field '${field}' must have at least ${definition.min_items} items`);
        }
        if (definition.max_items !== undefined && value.length > definition.max_items) {
          errors.push(`Field '${field}' must have at most ${definition.max_items} items`);
        }
      }
    }
  }

  validateEnumValues(manifest, schema, errors) {
    const fieldDefs = schema.field_definitions || {};
    
    for (const [field, definition] of Object.entries(fieldDefs)) {
      if (!(field in manifest) || !definition.enum) continue;
      
      const value = manifest[field];
      const allowedValues = definition.enum;
      
      if (Array.isArray(value)) {
        // For array fields with enum items
        for (const item of value) {
          if (!allowedValues.includes(item)) {
            errors.push(`Field '${field}' contains invalid value '${item}'. Allowed: ${allowedValues.join(', ')}`);
          }
        }
      } else {
        if (!allowedValues.includes(value)) {
          errors.push(`Field '${field}' must be one of: ${allowedValues.join(', ')}, got '${value}'`);
        }
      }
    }
  }

  validateTokenBudgets(manifest, errors, warnings) {
    const budget = manifest.default_token_budget;
    if (!budget) return;
    
    // Check if ai_output_format exists and has sections
    const outputFormat = manifest.ai_output_format;
    if (!outputFormat || !outputFormat.sections) return;
    
    let totalSectionTokens = 0;
    for (const section of outputFormat.sections) {
      if (section.max_tokens) {
        totalSectionTokens += section.max_tokens;
      }
    }
    
    const budgetLimit = budget * 1.5; // Allow 50% overhead
    if (totalSectionTokens > budgetLimit) {
      errors.push(`Total section tokens (${totalSectionTokens}) exceeds budget limit (${budgetLimit})`);
    }
    
    // Warning for high token budgets
    if (budget > 8000) {
      warnings.push(`High token budget (${budget}) may impact performance`);
    }
  }

  validateSpecialistRoles(manifest, errors) {
    const validRoles = ['developer', 'architect', 'security', 'devops', 'user'];
    const manifestRoles = manifest.specialist_roles || [];
    
    for (const role of manifestRoles) {
      if (!validRoles.includes(role)) {
        errors.push(`Invalid specialist role '${role}'. Valid roles: ${validRoles.join(', ')}`);
      }
    }
    
    // Check lazy activation rules reference valid specialists
    const lazyRules = manifest.lazy_activation_rules || [];
    for (const rule of lazyRules) {
      if (rule.specialist && !manifestRoles.includes(rule.specialist)) {
        errors.push(`Lazy activation rule references unknown specialist '${rule.specialist}'`);
      }
    }
  }

  validateTemplatePath(manifest, manifestPath, errors, warnings) {
    const templatePath = manifest.template_path;
    if (!templatePath) return;
    
    // Resolve relative to manifest directory
    const manifestDir = path.dirname(manifestPath);
    const resolvedPath = path.resolve(manifestDir, templatePath);
    
    if (!fs.existsSync(resolvedPath)) {
      errors.push(`Template file not found: ${templatePath} (resolved: ${resolvedPath})`);
    } else {
      this.log(`Template path validated: ${resolvedPath}`);
    }
  }

  validateLazyActivationRules(manifest, errors) {
    const rules = manifest.lazy_activation_rules || [];
    
    for (const rule of rules) {
      if (!rule.trigger) {
        errors.push('Lazy activation rule missing required field: trigger');
      }
      if (!rule.condition) {
        errors.push('Lazy activation rule missing required field: condition');
      }
      if (!rule.specialist) {
        errors.push('Lazy activation rule missing required field: specialist');
      }
    }
  }

  checkWarningRules(manifest, schema, warnings) {
    const warningRules = schema.warning_rules || {};
    
    // Check for many specialists
    const specialistCount = (manifest.specialist_roles || []).length;
    if (specialistCount > 4) {
      warnings.push(`Many specialists (${specialistCount}) may complicate coordination`);
    }
    
    // Check for no lazy activation
    const lazyRulesCount = (manifest.lazy_activation_rules || []).length;
    if (lazyRulesCount === 0) {
      warnings.push('No lazy activation rules defined - all specialists will be loaded');
    }
  }

  checkType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'integer':
        return Number.isInteger(value);
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true; // Unknown type, assume valid
    }
  }

  validateMultiple(manifestPaths) {
    const results = [];
    
    for (const manifestPath of manifestPaths) {
      this.log(`Validating: ${manifestPath}`);
      const result = this.validateManifest(manifestPath);
      results.push(result);
    }
    
    return results;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  const manifestPaths = [];
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--schema':
        options.schemaPath = args[++i];
        break;
      case '--debug':
        options.debug = true;
        break;
      case '--json':
        options.json = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        if (!arg.startsWith('--')) {
          manifestPaths.push(arg);
        }
    }
  }
  
  if (manifestPaths.length === 0) {
    console.error('No manifest files specified');
    printHelp();
    process.exit(1);
  }
  
  const validator = new ManifestValidator(options);
  
  try {
    const results = validator.validateMultiple(manifestPaths);

    if (options.json) {
      // JSON output for single file (matching bash script expectations)
      if (results.length === 1) {
        const result = results[0];
        const jsonOutput = {
          file: result.file,
          status: result.valid ? 'valid' : 'invalid',
          method: 'nodejs',
          errors: result.errors,
          warnings: result.warnings,
          timestamp: Date.now() / 1000
        };
        console.log(JSON.stringify(jsonOutput, null, 2));
      } else {
        // Multiple files - output array
        console.log(JSON.stringify(results.map(result => ({
          file: result.file,
          status: result.valid ? 'valid' : 'invalid',
          method: 'nodejs',
          errors: result.errors,
          warnings: result.warnings,
          timestamp: Date.now() / 1000
        })), null, 2));
      }
    } else {
      // Text output (existing behavior)
      let allValid = true;
      let totalErrors = 0;
      let totalWarnings = 0;

      for (const result of results) {
        const filename = path.basename(result.file);

        if (result.valid) {
          console.log(`✓ ${filename}: Valid`);
        } else {
          console.log(`✗ ${filename}: Invalid`);
          allValid = false;
        }

        // Show errors
        for (const error of result.errors) {
          console.log(`  Error: ${error}`);
          totalErrors++;
        }

        // Show warnings
        for (const warning of result.warnings) {
          console.log(`  Warning: ${warning}`);
          totalWarnings++;
        }

        if (result.errors.length === 0 && result.warnings.length === 0) {
          console.log(`  No issues found`);
        }

        console.log(''); // Empty line between files
      }

      // Summary
      console.log(`Summary: ${results.length} files, ${totalErrors} errors, ${totalWarnings} warnings`);
    }

    const allValid = results.every(result => result.valid);
    if (!allValid) {
      process.exit(2); // Schema validation failed - valid YAML but doesn't meet DocuMind requirements
    }
    
  } catch (error) {
    console.error(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
YAML Manifest Validator for DocuMind

USAGE:
  node validate_yaml.js [OPTIONS] MANIFEST_FILES...

OPTIONS:
  --schema PATH    Path to ai-manifest-schema.yaml
  --debug         Enable debug output
  --help          Show this help

EXAMPLES:
  node validate_yaml.js src/templates/ai-optimized/*.yaml
  node validate_yaml.js --debug concept-ai.yaml
  node validate_yaml.js --schema custom-schema.yaml *.yaml

OUTPUT:
  ✓ filename: Valid
  ✗ filename: Invalid
    Error: description
    Warning: description
`);
}

// Run if called directly
if (process.argv[1] && import.meta.url.startsWith('file:')) {
  main().catch(console.error);
}

export { ManifestValidator };