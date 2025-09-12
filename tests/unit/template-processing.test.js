#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { TestEnvironment } from '../utils/test-environment.js';

test('Template Processing', async (t) => {
  const env = new TestEnvironment();
  
  await t.test('should load copilot-instructions template with project context', async () => {
    const testDir = await env.createTempDir('template-copilot');
    const { default: DocuMindInstaller } = await import('../../src/scripts/install.js');
    
    // Setup test environment
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    installer.documindDir = path.join(testDir, '.documind');
    
    // Create minimal .documind structure
    await fs.mkdir(installer.documindDir, { recursive: true });
    await fs.mkdir(path.join(installer.documindDir, 'core'), { recursive: true });
    await fs.writeFile(path.join(installer.documindDir, 'core', 'system.md'), 'Test system instructions');
    await fs.writeFile(path.join(installer.documindDir, 'core', 'commands.md'), 'Test commands reference');
    
    // Test template loading
    const template = await installer.loadTemplate('copilot-instructions');
    
    assert(template.includes('DocuMind'), 'Template should contain DocuMind branding');
    assert(template.includes('/document bootstrap'), 'Template should include bootstrap command');
    assert(template.includes('/document expand'), 'Template should include expand command');
    assert(template.includes('Test system instructions'), 'Template should include system.md content');
    assert(template.includes('Test commands reference'), 'Template should include commands.md content');
    
    await env.cleanup(testDir);
  });

  await t.test('should load claude-instructions template with full content', async () => {
    const testDir = await env.createTempDir('template-claude');
    const { default: DocuMindInstaller } = await import('../../src/scripts/install.js');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    installer.documindDir = path.join(testDir, '.documind');
    
    // Create minimal .documind structure
    await fs.mkdir(installer.documindDir, { recursive: true });
    await fs.mkdir(path.join(installer.documindDir, 'core'), { recursive: true });
    await fs.writeFile(path.join(installer.documindDir, 'core', 'system.md'), 'Claude system content');
    await fs.writeFile(path.join(installer.documindDir, 'core', 'commands.md'), 'Claude commands content');
    
    const template = await installer.loadTemplate('claude-instructions');
    
    assert(template.includes('# Claude Instructions'), 'Template should have Claude title');
    assert(template.includes('DocuMind'), 'Template should reference DocuMind system');
    assert(template.includes('📚 Documentation Commands'), 'Template should have commands section');
    assert(template.includes('🔍 Command Recognition'), 'Template should have recognition section');
    assert(template.includes('Claude system content'), 'Template should include system.md');
    assert(template.includes('Claude commands content'), 'Template should include commands.md');
    
    await env.cleanup(testDir);
  });

  await t.test('should load cursor-rules template correctly', async () => {
    const testDir = await env.createTempDir('template-cursor');
    const { default: DocuMindInstaller } = await import('../../src/scripts/install.js');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    installer.documindDir = path.join(testDir, '.documind');
    
    // Create .documind structure
    await fs.mkdir(installer.documindDir, { recursive: true });
    await fs.mkdir(path.join(installer.documindDir, 'core'), { recursive: true });
    await fs.writeFile(path.join(installer.documindDir, 'core', 'system.md'), 'Cursor system rules');
    await fs.writeFile(path.join(installer.documindDir, 'core', 'commands.md'), 'Cursor commands list');
    
    const template = await installer.loadTemplate('cursor-rules');
    
    assert(template.includes('# DocuMind Documentation System'), 'Template should have proper title');
    assert(template.includes('/document bootstrap'), 'Template should include commands');
    assert(template.includes('Natural Language Support'), 'Template should have NL section');
    assert(template.includes('Cursor system rules'), 'Template should include system content');
    assert(template.includes('Cursor commands list'), 'Template should include commands content');
    
    await env.cleanup(testDir);
  });

  await t.test('should load cursorrules template for backward compatibility', async () => {
    const testDir = await env.createTempDir('template-cursorrules');
    const { default: DocuMindInstaller } = await import('../../src/scripts/install.js');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    installer.documindDir = path.join(testDir, '.documind');
    
    // Create .documind structure
    await fs.mkdir(installer.documindDir, { recursive: true });
    await fs.mkdir(path.join(installer.documindDir, 'core'), { recursive: true });
    await fs.writeFile(path.join(installer.documindDir, 'core', 'system.md'), 'Legacy cursor rules');
    
    const template = await installer.loadTemplate('cursorrules');
    
    assert(template.includes('# DocuMind System - Cursor Rules'), 'Template should have legacy title');
    assert(template.includes('Available slash commands'), 'Template should list commands');
    assert(template.includes('Natural Language Recognition'), 'Template should have NL recognition');
    assert(template.includes('Legacy cursor rules'), 'Template should include system content');
    
    await env.cleanup(testDir);
  });

  await t.test('should load gemini-instructions template', async () => {
    const testDir = await env.createTempDir('template-gemini');
    const { default: DocuMindInstaller } = await import('../../src/scripts/install.js');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    installer.documindDir = path.join(testDir, '.documind');
    
    // Create .documind structure
    await fs.mkdir(installer.documindDir, { recursive: true });
    await fs.mkdir(path.join(installer.documindDir, 'core'), { recursive: true });
    await fs.writeFile(path.join(installer.documindDir, 'core', 'system.md'), 'Gemini system instructions');
    await fs.writeFile(path.join(installer.documindDir, 'core', 'commands.md'), 'Gemini commands reference');
    
    const template = await installer.loadTemplate('gemini-instructions');
    
    assert(template.includes('# Gemini CLI Instructions'), 'Template should have Gemini title');
    assert(template.includes('DocuMind'), 'Template should reference DocuMind');
    assert(template.includes('Natural Language Recognition'), 'Template should have NL section');
    assert(template.includes('Gemini system instructions'), 'Template should include system content');
    assert(template.includes('Gemini commands reference'), 'Template should include commands content');
    
    await env.cleanup(testDir);
  });

  await t.test('should load github-documentation template for Copilot', async () => {
    const testDir = await env.createTempDir('template-github-docs');
    const { default: DocuMindInstaller } = await import('../../src/scripts/install.js');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    installer.documindDir = path.join(testDir, '.documind');
    
    // Create .documind structure
    await fs.mkdir(installer.documindDir, { recursive: true });
    await fs.mkdir(path.join(installer.documindDir, 'core'), { recursive: true });
    await fs.writeFile(path.join(installer.documindDir, 'core', 'system.md'), 'GitHub documentation rules');
    
    const template = await installer.loadTemplate('github-documentation');
    
    assert(template.includes('applyTo:'), 'Template should have file scope');
    assert(template.includes('# Documentation Instructions'), 'Template should have docs title');
    assert(template.includes('DocuMind conventions'), 'Template should reference conventions');
    assert(template.includes('GitHub documentation rules'), 'Template should include system content');
    
    await env.cleanup(testDir);
  });

  await t.test('should handle missing template gracefully', async () => {
    const testDir = await env.createTempDir('template-missing');
    const { default: DocuMindInstaller } = await import('../../src/scripts/install.js');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    
    const template = await installer.loadTemplate('nonexistent-template');
    
    assert.strictEqual(template, '', 'Should return empty string for missing template');
    
    await env.cleanup(testDir);
  });

  await t.test('should handle missing .documind files gracefully', async () => {
    const testDir = await env.createTempDir('template-missing-files');
    const { default: DocuMindInstaller } = await import('../../src/scripts/install.js');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    installer.documindDir = path.join(testDir, '.documind');
    
    // Don't create .documind directory
    const template = await installer.loadTemplate('claude-instructions');
    
    assert(template.includes('[system.md not found]'), 'Should indicate missing system.md');
    assert(template.includes('[commands.md not found]'), 'Should indicate missing commands.md');
    
    await env.cleanup(testDir);
  });

  await t.test('should interpolate template variables correctly', async () => {
    const testDir = await env.createTempDir('template-interpolation');
    const { default: DocuMindInstaller } = await import('../../src/scripts/install.js');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    installer.documindDir = path.join(testDir, '.documind');
    
    // Create .documind structure with specific content
    await fs.mkdir(installer.documindDir, { recursive: true });
    await fs.mkdir(path.join(installer.documindDir, 'core'), { recursive: true });
    await fs.writeFile(path.join(installer.documindDir, 'core', 'system.md'), 
      '# System Instructions\n\nThis is the system configuration.');
    await fs.writeFile(path.join(installer.documindDir, 'core', 'commands.md'), 
      '# Commands Reference\n\nAvailable commands listed here.');
    
    const template = await installer.loadTemplate('claude-instructions');
    
    // Verify template interpolation worked
    assert(template.includes('# System Instructions'), 'Should include system.md heading');
    assert(template.includes('This is the system configuration'), 'Should include system.md content');
    assert(template.includes('# Commands Reference'), 'Should include commands.md heading');
    assert(template.includes('Available commands listed here'), 'Should include commands.md content');
    
    // Verify template structure is maintained
    assert(template.includes('# Claude Instructions'), 'Should maintain template structure');
    assert(template.includes('📚 Documentation Commands'), 'Should maintain emoji sections');
    
    await env.cleanup(testDir);
  });

  await t.test('should preserve template formatting and structure', async () => {
    const testDir = await env.createTempDir('template-formatting');
    const { default: DocuMindInstaller } = await import('../../src/scripts/install.js');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    installer.documindDir = path.join(testDir, '.documind');
    
    // Create .documind structure
    await fs.mkdir(installer.documindDir, { recursive: true });
    await fs.mkdir(path.join(installer.documindDir, 'core'), { recursive: true });
    await fs.writeFile(path.join(installer.documindDir, 'core', 'system.md'), 'Test content');
    await fs.writeFile(path.join(installer.documindDir, 'core', 'commands.md'), 'Test commands');
    
    const template = await installer.loadTemplate('copilot-instructions');
    
    // Check markdown formatting is preserved
    assert(template.includes('## Documentation Commands'), 'Should preserve heading levels');
    assert(template.includes('- `/document bootstrap`'), 'Should preserve list formatting');
    assert(template.includes('```'), 'Should handle code block markers if present');
    
    // Check line breaks and structure
    const lines = template.split('\n');
    assert(lines.length > 10, 'Should have multiple lines');
    assert(lines.some(line => line.startsWith('#')), 'Should have headings');
    assert(lines.some(line => line.startsWith('-')), 'Should have list items');
    
    await env.cleanup(testDir);
  });
});