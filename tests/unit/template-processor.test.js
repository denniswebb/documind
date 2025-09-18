import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import TemplateProcessor from '../../src/core/template-processor.js';

describe('TemplateProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new TemplateProcessor();
  });

  describe('substituteVariables', () => {
    it('should replace template variables with provided values', () => {
      const template = 'Hello {CONCEPT_NAME}, welcome to {SYSTEM_NAME}!';
      const variables = {
        concept_name: 'authentication',
        system_name: 'user-service'
      };

      const result = processor.substituteVariables(template, variables);
      assert.strictEqual(result, 'Hello authentication, welcome to user-service!');
    });

    it('should handle missing variables with defaults', () => {
      const template = 'System: {SYSTEM_NAME}, Module: {MODULE_NAME}';
      const variables = { system_name: 'test-system' };

      const result = processor.substituteVariables(template, variables);
      assert.ok(result.includes('test-system'));
      assert.ok(result.includes('example-module'));
    });

    it('should handle empty variables object', () => {
      const template = '{CONCEPT_NAME} system';
      const result = processor.substituteVariables(template, {});
      assert.strictEqual(result, 'example-concept system');
    });
  });

  describe('processTemplate', () => {
    it('should process template without AI formatting', () => {
      const template = 'Hello {CONCEPT_NAME}!\n\nThis is a test.';
      const variables = { concept_name: 'auth' };

      const result = processor.processTemplate(template, variables);
      assert.strictEqual(result, 'Hello auth!\n\nThis is a test.');
    });

    it('should apply AI formatting when provided', () => {
      const template = `# {CONCEPT_NAME}

## Overview
This is a test concept.
Another line of content.`;

      const aiFormat = {
        sections: {
          overview: 'bullet_points'
        }
      };

      const variables = { concept_name: 'auth' };
      const result = processor.processTemplate(template, variables, aiFormat);

      assert.ok(result.includes('auth'));
      assert.ok(result.includes('- This is a test concept.'));
    });
  });

  describe('convertToBulletPoints', () => {
    it('should convert prose to bullet points', () => {
      const content = `## Overview
This is the first point about the system.
This is the second important point.
This explains how it works.`;

      const result = processor.convertToBulletPoints(content);
      assert.ok(result.includes('- This is the first point about the system.'));
      assert.ok(result.includes('- This is the second important point.'));
      assert.ok(result.includes('- This explains how it works.'));
    });

    it('should preserve existing headers and bullet points', () => {
      const content = `## Header
- Existing bullet
Some prose line.
* Another existing bullet`;

      const result = processor.convertToBulletPoints(content);
      assert.ok(result.includes('## Header'));
      assert.ok(result.includes('- Existing bullet'));
      assert.ok(result.includes('- Some prose line.'));
      assert.ok(result.includes('* Another existing bullet'));
    });
  });

  describe('convertToNumberedSteps', () => {
    it('should convert prose to numbered steps', () => {
      const content = `First step description.
Second step description.
Third step description.`;

      const result = processor.convertToNumberedSteps(content);
      assert.ok(result.includes('1. First step description.'));
      assert.ok(result.includes('2. Second step description.'));
      assert.ok(result.includes('3. Third step description.'));
    });

    it('should skip short lines and existing formatting', () => {
      const content = `## Header
Long step description here.
- List item
Another long step description.`;

      const result = processor.convertToNumberedSteps(content);
      assert.ok(result.includes('## Header'));
      assert.ok(result.includes('1. Long step description here.'));
      assert.ok(result.includes('- List item'));
      assert.ok(result.includes('2. Another long step description.'));
    });
  });

  describe('convertToTable', () => {
    it('should extract key-value pairs and create table', () => {
      const content = `Configuration:
timeout: 30000
retries: 3
endpoint: https://api.example.com`;

      const result = processor.convertToTable(content);
      assert.ok(result.includes('| Key | Value |'));
      assert.ok(result.includes('| timeout | 30000 |'));
      assert.ok(result.includes('| retries | 3 |'));
      assert.ok(result.includes('| endpoint | https://api.example.com |'));
    });

    it('should return original content if no key-value pairs found', () => {
      const content = 'Just some regular text without colons for values';
      const result = processor.convertToTable(content);
      assert.ok(result.includes('Just some regular text'));
    });
  });

  describe('optimizeCodeBlocks', () => {
    it('should truncate long code blocks', () => {
      const longCode = Array.from({ length: 25 }, (_, i) => `line ${i + 1}`).join('\n');
      const content = '```javascript\n' + longCode + '\n```';

      const result = processor.optimizeCodeBlocks(content);
      assert.ok(result.includes('line 1'));
      assert.ok(result.includes('line 10'));
      assert.ok(result.includes('// ... (truncated for brevity)'));
      assert.ok(result.includes('line 25'));
    });

    it('should preserve short code blocks', () => {
      const content = '```javascript\nconst x = 1;\nconsole.log(x);\n```';
      const result = processor.optimizeCodeBlocks(content);
      assert.strictEqual(result, content);
    });
  });

  describe('minimizeContent', () => {
    it('should compress whitespace and formatting', () => {
      const content = `Title   :   Value

Multiple


blank lines.

Spaced  ,  values  here`;

      const result = processor.minimizeContent(content);
      assert.ok(!result.includes('   :   '));
      assert.ok(!result.includes('\n\n\n'));
      assert.ok(result.includes(': '));
      assert.ok(result.includes(', '));
    });
  });

  describe('optimizeForTokens', () => {
    it('should remove examples when specified', () => {
      const content = `## Overview
Main content here.

## Examples
Example 1: This is an example.
Example 2: Another example.

## More Content
Additional content.`;

      const optimizationRules = { remove_examples: true };
      const result = processor.optimizeForTokens(content, optimizationRules);

      assert.ok(result.includes('## Overview'));
      assert.ok(result.includes('Main content here.'));
      assert.ok(!result.includes('## Examples'));
      assert.ok(!result.includes('Example 1:'));
      assert.ok(result.includes('## More Content'));
    });

    it('should compress whitespace when specified', () => {
      const content = 'Line 1\n\n\n\nLine 2\n\n\n\nLine 3';
      const optimizationRules = { compress_whitespace: true };
      const result = processor.optimizeForTokens(content, optimizationRules);

      assert.ok(!result.includes('\n\n\n'));
      assert.strictEqual(result.split('\n\n').length - 1, 2); // Only double newlines
    });

    it('should shorten descriptions when specified', () => {
      const content = 'This is a very long description with many words here';
      const optimizationRules = { shorten_descriptions: true };
      const result = processor.optimizeForTokens(content, optimizationRules);

      assert.ok(result.length < content.length);
    });
  });

  describe('generateDefaultValue', () => {
    it('should provide sensible defaults for common variables', () => {
      assert.strictEqual(processor.generateDefaultValue('CONCEPT_NAME'), 'example-concept');
      assert.strictEqual(processor.generateDefaultValue('SERVICE_NAME'), 'example-service');
      assert.strictEqual(processor.generateDefaultValue('SYSTEM_NAME'), 'example-system');
    });

    it('should provide fallback for unknown variables', () => {
      const result = processor.generateDefaultValue('UNKNOWN_VAR');
      assert.strictEqual(result, '[unknown_var]');
    });
  });
});