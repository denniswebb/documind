#!/usr/bin/env node

import { test } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import TestEnvironment from '../utils/test-environment.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

test('Gitignore Operations', async (t) => {
  const env = new TestEnvironment();
  
  await t.test('should add DocuMind comment to new .gitignore file', async () => {
    const testDir = await env.createTempDir('gitignore-new');
    const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    
    // Test with no existing .gitignore
    await installer.updateGitignore();
    
    const gitignorePath = path.join(testDir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    assert(content.includes('# DocuMind core system (keep tracked)'), 'Should add DocuMind comment');
    assert(content.includes('# .documind/'), 'Should add .documind directory comment');
    assert(content.includes('\n'), 'Should add proper line breaks');
    
    await env.cleanup(testDir);
  });

  await t.test('should add DocuMind comment to existing .gitignore without DocuMind references', async () => {
    const testDir = await env.createTempDir('gitignore-existing');
    const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    
    // Create existing .gitignore with common patterns
    const existingContent = `node_modules/
*.log
.env
dist/
.DS_Store`;
    
    await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
    
    await installer.updateGitignore();
    
    const gitignorePath = path.join(testDir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    // Should contain original content
    assert(content.includes('node_modules/'), 'Should preserve existing patterns');
    assert(content.includes('*.log'), 'Should preserve existing patterns');
    assert(content.includes('.env'), 'Should preserve existing patterns');
    
    // Should add DocuMind content
    assert(content.includes('# DocuMind core system (keep tracked)'), 'Should add DocuMind comment');
    assert(content.includes('# .documind/'), 'Should add .documind directory comment');
    
    await env.cleanup(testDir);
  });

  await t.test('should not modify .gitignore if DocuMind already referenced', async () => {
    const testDir = await env.createTempDir('gitignore-has-documind');
    const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    
    // Create .gitignore that already has DocuMind reference
    const existingContent = `node_modules/
*.log
# DocuMind system files
.documind/config.local`;
    
    await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
    
    await installer.updateGitignore();
    
    const gitignorePath = path.join(testDir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    // Content should remain unchanged
    assert.strictEqual(content, existingContent, 'Should not modify existing DocuMind references');
    
    await env.cleanup(testDir);
  });

  await t.test('should not modify .gitignore if .documind already referenced', async () => {
    const testDir = await env.createTempDir('gitignore-has-dir');
    const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    
    // Create .gitignore that already has .documind reference
    const existingContent = `node_modules/
.documind/temp/
dist/`;
    
    await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
    
    await installer.updateGitignore();
    
    const gitignorePath = path.join(testDir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    // Content should remain unchanged
    assert.strictEqual(content, existingContent, 'Should not modify existing .documind references');
    
    await env.cleanup(testDir);
  });

  await t.test('should handle case-sensitive DocuMind detection', async () => {
    const testDir = await env.createTempDir('gitignore-case-sensitive');
    const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    
    // Create .gitignore with different case
    const existingContent = `node_modules/
# documind system (lowercase)
some-other-stuff`;
    
    await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
    
    await installer.updateGitignore();
    
    const gitignorePath = path.join(testDir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    // Should add DocuMind comment since case doesn't match
    assert(content.includes('# DocuMind core system (keep tracked)'), 'Should add proper case DocuMind comment');
    assert(content.includes('# documind system (lowercase)'), 'Should preserve original lowercase reference');
    
    await env.cleanup(testDir);
  });

  await t.test('should preserve .gitignore file structure and formatting', async () => {
    const testDir = await env.createTempDir('gitignore-formatting');
    const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    
    // Create .gitignore with specific formatting
    const existingContent = `# Dependencies
node_modules/
npm-debug.log*

# Build outputs
dist/
build/

# Environment
.env
.env.local

# OS files
.DS_Store
Thumbs.db`;
    
    await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
    
    await installer.updateGitignore();
    
    const gitignorePath = path.join(testDir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    // Should preserve original structure
    assert(content.includes('# Dependencies'), 'Should preserve section comments');
    assert(content.includes('# Build outputs'), 'Should preserve section comments');
    assert(content.includes('# Environment'), 'Should preserve section comments');
    
    // Should add DocuMind section at the end
    assert(content.includes('# DocuMind core system (keep tracked)'), 'Should add DocuMind section');
    
    // Check that formatting is maintained
    const lines = content.split('\n');
    assert(lines.some(line => line === ''), 'Should preserve empty lines');
    assert(lines.some(line => line.startsWith('#')), 'Should preserve comments');
    
    await env.cleanup(testDir);
  });

  await t.test('should handle empty .gitignore file', async () => {
    const testDir = await env.createTempDir('gitignore-empty');
    const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    
    // Create empty .gitignore
    await fs.writeFile(path.join(testDir, '.gitignore'), '');
    
    await installer.updateGitignore();
    
    const gitignorePath = path.join(testDir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    assert(content.includes('# DocuMind core system (keep tracked)'), 'Should add DocuMind comment');
    assert(content.includes('# .documind/'), 'Should add .documind directory comment');
    
    await env.cleanup(testDir);
  });

  await t.test('should handle .gitignore with only whitespace', async () => {
    const testDir = await env.createTempDir('gitignore-whitespace');
    const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    
    // Create .gitignore with only whitespace
    await fs.writeFile(path.join(testDir, '.gitignore'), '   \n\n  \t  \n');
    
    await installer.updateGitignore();
    
    const gitignorePath = path.join(testDir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    assert(content.includes('# DocuMind core system (keep tracked)'), 'Should add DocuMind comment');
    assert(content.includes('# .documind/'), 'Should add .documind directory comment');
    
    await env.cleanup(testDir);
  });

  await t.test('should maintain proper line endings', async () => {
    const testDir = await env.createTempDir('gitignore-line-endings');
    const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    
    // Create .gitignore with Unix line endings
    const existingContent = 'node_modules/\n*.log\n.env';
    await fs.writeFile(path.join(testDir, '.gitignore'), existingContent);
    
    await installer.updateGitignore();
    
    const gitignorePath = path.join(testDir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    // Check line endings are consistent
    assert(!content.includes('\r\n'), 'Should use Unix line endings');
    assert(content.includes('\n'), 'Should have line breaks');
    
    // Verify structure
    const lines = content.split('\n');
    assert(lines.length > 4, 'Should have multiple lines');
    assert(lines.some(line => line.includes('DocuMind')), 'Should contain DocuMind content');
    
    await env.cleanup(testDir);
  });

  await t.test('should handle very large .gitignore files', async () => {
    const testDir = await env.createTempDir('gitignore-large');
    const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
    
    const installer = new DocuMindInstaller();
    installer.repoRoot = testDir;
    
    // Create large .gitignore with many entries
    const largeContent = Array.from({ length: 1000 }, (_, i) => `file${i}.tmp`).join('\n');
    await fs.writeFile(path.join(testDir, '.gitignore'), largeContent);
    
    await installer.updateGitignore();
    
    const gitignorePath = path.join(testDir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    
    // Should preserve all original content
    assert(content.includes('file0.tmp'), 'Should preserve first entry');
    assert(content.includes('file999.tmp'), 'Should preserve last entry');
    
    // Should add DocuMind content
    assert(content.includes('# DocuMind core system (keep tracked)'), 'Should add DocuMind comment');
    
    await env.cleanup(testDir);
  });
});