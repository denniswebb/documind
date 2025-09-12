#!/usr/bin/env node

import { test } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import TestEnvironment from '../utils/test-environment.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

test('Full Deployment Validation', async (t) => {
  const env = new TestEnvironment();
  
  await t.test('should perform complete fresh installation workflow', async () => {
    const testDir = await env.createTempDir('full-deployment-fresh');
    
    try {
      // Create a mock repository structure
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          dev: 'node server.js'
        },
        dependencies: {
          express: '^4.18.0'
        }
      }, null, 2));
      
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test Project\n\nA test project for DocuMind installation.');
      
      // Copy DocuMind system to test directory
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Run installation
      const { default: DocuMindInstaller } = require('../../src/scripts/install.js');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      // Verify installation results
      
      // 1. Check AI tool detection and file generation
      const expectedFiles = [
        'CLAUDE.md',
        '.github/copilot-instructions.md',
        '.github/instructions/documentation.md',
        '.cursor/rules/documind.mdc',
        '.cursorrules',
        'GEMINI.md'
      ];
      
      for (const file of expectedFiles) {
        const filePath = path.join(testDir, file);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        assert(exists, `Expected file ${file} should exist after installation`);
        
        // Verify file has content
        const content = await fs.readFile(filePath, 'utf8');
        assert(content.length > 0, `File ${file} should have content`);
        assert(content.includes('DocuMind'), `File ${file} should reference DocuMind system`);
      }
      
      // 2. Check .gitignore was updated
      const gitignoreExists = await fs.access(path.join(testDir, '.gitignore')).then(() => true).catch(() => false);
      assert(gitignoreExists, '.gitignore should exist after installation');
      
      const gitignoreContent = await fs.readFile(path.join(testDir, '.gitignore'), 'utf8');
      assert(gitignoreContent.includes('DocuMind'), '.gitignore should reference DocuMind');
      
      // 3. Verify Claude commands were registered
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('/document bootstrap'), 'Claude instructions should include bootstrap command');
      assert(claudeContent.includes('/document expand'), 'Claude instructions should include expand command');
      assert(claudeContent.includes('System Instructions'), 'Claude instructions should include system content');
      
      // 4. Test command generation
      const { default: CommandGenerator } = require('../../src/scripts/generate-commands.js');
      const generator = new CommandGenerator();
      generator.repoRoot = testDir;
      generator.documindDir = targetDir;
      
      await generator.generateClaudeCommands();
      
      // 5. Test update process
      const UpdateScript = require('../../src/scripts/update.js');
      const updater = new UpdateScript();
      updater.repoRoot = testDir;
      updater.documindDir = targetDir;
      
      await updater.update();
      
      // 6. Verify all files still exist and have valid content after update
      for (const file of expectedFiles) {
        const filePath = path.join(testDir, file);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        assert(exists, `File ${file} should still exist after update`);
        
        const content = await fs.readFile(filePath, 'utf8');
        assert(content.includes('DocuMind'), `File ${file} should still reference DocuMind after update`);
      }
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should handle deployment in existing AI-configured project', async () => {
    const testDir = await env.createTempDir('full-deployment-existing');
    
    try {
      // Create project with existing AI configurations
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
      await fs.mkdir(path.join(testDir, '.cursor'), { recursive: true });
      
      // Pre-existing AI files
      await fs.writeFile(path.join(testDir, 'CLAUDE.md'), '# Existing Claude Config\n\nOld configuration');
      await fs.writeFile(path.join(testDir, '.cursorrules'), '# Old Cursor Rules');
      await fs.writeFile(path.join(testDir, '.github/copilot-instructions.md'), '# Old Copilot Config');
      
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'existing-project',
        version: '2.0.0',
        scripts: {
          gemini: 'gemini-cli generate'
        }
      }, null, 2));
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Run installation
      const { default: DocuMindInstaller } = require('../../src/scripts/install.js');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      // Verify DocuMind configuration replaced existing files
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('DocuMind'), 'Claude config should be updated with DocuMind');
      assert(!claudeContent.includes('Old configuration'), 'Old configuration should be replaced');
      
      const cursorRulesContent = await fs.readFile(path.join(testDir, '.cursorrules'), 'utf8');
      assert(cursorRulesContent.includes('DocuMind'), 'Cursor rules should be updated with DocuMind');
      
      const copilotContent = await fs.readFile(path.join(testDir, '.github/copilot-instructions.md'), 'utf8');
      assert(copilotContent.includes('DocuMind'), 'Copilot config should be updated with DocuMind');
      
      // Verify Gemini was detected and configured
      const geminiExists = await fs.access(path.join(testDir, 'GEMINI.md')).then(() => true).catch(() => false);
      assert(geminiExists, 'GEMINI.md should be created when gemini usage detected');
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should validate complete end-to-end documentation workflow', async () => {
    const testDir = await env.createTempDir('full-deployment-e2e');
    
    try {
      // Create a realistic project structure
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'lib'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'config'), { recursive: true });
      
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'full-project',
        version: '1.0.0',
        description: 'A full-featured project for testing',
        main: 'src/index.js',
        scripts: {
          start: 'node src/index.js',
          test: 'node --test',
          build: 'webpack --mode production'
        },
        dependencies: {
          express: '^4.18.0',
          redis: '^4.0.0',
          mongoose: '^7.0.0'
        },
        devDependencies: {
          webpack: '^5.0.0'
        }
      }, null, 2));
      
      await fs.writeFile(path.join(testDir, 'src/index.js'), `
const express = require('express');
const redis = require('redis');
const mongoose = require('mongoose');

const app = express();
const redisClient = redis.createClient();

// Authentication middleware
function authenticate(req, res, next) {
  // JWT authentication logic
  next();
}

// API routes
app.get('/api/users', authenticate, (req, res) => {
  // User management
});

app.listen(3000);
`);
      
      await fs.writeFile(path.join(testDir, 'lib/database.js'), `
const mongoose = require('mongoose');

class DatabaseManager {
  async connect() {
    await mongoose.connect(process.env.MONGODB_URL);
  }
  
  async disconnect() {
    await mongoose.disconnect();
  }
}

module.exports = DatabaseManager;
`);
      
      await fs.writeFile(path.join(testDir, 'config/redis.js'), `
const redis = require('redis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
};

module.exports = redisConfig;
`);
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Run full installation
      const { default: DocuMindInstaller } = require('../../src/scripts/install.js');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      // Verify AI tools can analyze project structure
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      
      // Should contain comprehensive DocuMind instructions
      assert(claudeContent.includes('# Claude Instructions'), 'Should have proper title');
      assert(claudeContent.includes('/document bootstrap'), 'Should include bootstrap command');
      assert(claudeContent.includes('/document expand authentication'), 'Should include expand examples');
      assert(claudeContent.includes('/document analyze redis'), 'Should include analyze examples');
      assert(claudeContent.includes('System Instructions'), 'Should include system instructions section');
      assert(claudeContent.includes('Command Reference'), 'Should include command reference section');
      
      // Verify all AI tools are configured consistently
      const copilotContent = await fs.readFile(path.join(testDir, '.github/copilot-instructions.md'), 'utf8');
      const cursorContent = await fs.readFile(path.join(testDir, '.cursor/rules/documind.mdc'), 'utf8');
      const geminiContent = await fs.readFile(path.join(testDir, 'GEMINI.md'), 'utf8');
      
      const commonElements = [
        'DocuMind',
        '/document bootstrap',
        '/document expand',
        '/document analyze',
        'Natural Language'
      ];
      
      for (const element of commonElements) {
        assert(claudeContent.includes(element), `Claude config should include ${element}`);
        assert(copilotContent.includes(element), `Copilot config should include ${element}`);
        assert(cursorContent.includes(element), `Cursor config should include ${element}`);
        assert(geminiContent.includes(element), `Gemini config should include ${element}`);
      }
      
      // Test that system can be updated
      const UpdateScript = require('../../src/scripts/update.js');
      const updater = new UpdateScript();
      updater.repoRoot = testDir;
      updater.documindDir = targetDir;
      
      await updater.update();
      
      // Verify configurations are still consistent after update
      const updatedClaudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(updatedClaudeContent.includes('DocuMind'), 'Configuration should remain valid after update');
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should handle deployment errors gracefully', async () => {
    const testDir = await env.createTempDir('full-deployment-errors');
    
    try {
      // Create problematic environment
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      // Create read-only file that should cause permission issues
      await fs.writeFile(path.join(testDir, 'readonly-file.txt'), 'readonly');
      await fs.chmod(path.join(testDir, 'readonly-file.txt'), 0o444);
      
      // Invalid package.json
      await fs.writeFile(path.join(testDir, 'package.json'), 'invalid json {');
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Run installation - should handle errors gracefully
      const { default: DocuMindInstaller } = require('../../src/scripts/install.js');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      let installationCompleted = false;
      let installationError = null;
      
      try {
        await installer.install();
        installationCompleted = true;
      } catch (error) {
        installationError = error;
      }
      
      // Should either complete successfully or fail with meaningful error
      if (!installationCompleted) {
        assert(installationError instanceof Error, 'Should provide meaningful error information');
        assert(installationError.message.length > 0, 'Error message should not be empty');
      } else {
        // If it completed, basic files should still be created
        const claudeExists = await fs.access(path.join(testDir, 'CLAUDE.md')).then(() => true).catch(() => false);
        assert(claudeExists, 'Essential files should be created even with some errors');
      }
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should validate performance requirements', async () => {
    const testDir = await env.createTempDir('full-deployment-performance');
    
    try {
      // Create medium-sized project structure
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      // Create multiple files to simulate real project
      const fileCount = 50;
      for (let i = 0; i < fileCount; i++) {
        await fs.mkdir(path.join(testDir, `dir${i}`), { recursive: true });
        await fs.writeFile(path.join(testDir, `dir${i}`, 'file.js'), `// File ${i}\nmodule.exports = {};`);
      }
      
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'performance-test',
        version: '1.0.0',
        dependencies: Object.fromEntries(
          Array.from({ length: 20 }, (_, i) => [`dep${i}`, '^1.0.0'])
        )
      }, null, 2));
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Measure installation time
      const startTime = Date.now();
      
      const { default: DocuMindInstaller } = require('../../src/scripts/install.js');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      const endTime = Date.now();
      const installTime = endTime - startTime;
      
      // Performance requirement: Installation should complete within 30 seconds
      assert(installTime < 30000, `Installation took ${installTime}ms, should be under 30000ms`);
      
      // Measure update time
      const updateStartTime = Date.now();
      
      const UpdateScript = require('../../src/scripts/update.js');
      const updater = new UpdateScript();
      updater.repoRoot = testDir;
      updater.documindDir = targetDir;
      
      await updater.update();
      
      const updateEndTime = Date.now();
      const updateTime = updateEndTime - updateStartTime;
      
      // Update should be faster than initial installation
      assert(updateTime < installTime, `Update took ${updateTime}ms, should be faster than install ${installTime}ms`);
      
    } finally {
      await env.cleanup(testDir);
    }
  });
});