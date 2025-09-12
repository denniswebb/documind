#!/usr/bin/env node

import { test } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import TestEnvironment from '../utils/test-environment.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

test('Installation Speed Performance', async (t) => {
  const env = new TestEnvironment();
  
  await t.test('should install within performance requirements for small projects', async () => {
    const testDir = await env.createTempDir('perf-small-project');
    
    try {
      // Create small project structure
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'small-project',
        version: '1.0.0',
        dependencies: {
          express: '^4.18.0'
        }
      }, null, 2));
      
      await fs.writeFile(path.join(testDir, 'index.js'), 'console.log("Hello World");');
      await fs.writeFile(path.join(testDir, 'README.md'), '# Small Project');
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Measure installation performance
      const startTime = performance.now();
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      const endTime = performance.now();
      const installTime = endTime - startTime;
      
      // Performance requirement: Small projects should install in under 5 seconds
      assert(installTime < 5000, `Installation took ${installTime.toFixed(2)}ms, should be under 5000ms for small projects`);
      
      // Verify installation completed successfully
      const claudeExists = await fs.access(path.join(testDir, 'CLAUDE.md')).then(() => true).catch(() => false);
      assert(claudeExists, 'Installation should complete successfully within time limit');
      
      console.log(`✓ Small project installation: ${installTime.toFixed(2)}ms`);
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should install within performance requirements for medium projects', async () => {
    const testDir = await env.createTempDir('perf-medium-project');
    
    try {
      // Create medium project structure (50 files, 10 directories)
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      const directories = ['src', 'lib', 'config', 'tests', 'docs', 'public', 'assets', 'utils', 'components', 'services'];
      for (const dir of directories) {
        await fs.mkdir(path.join(testDir, dir), { recursive: true });
        
        // Create 5 files per directory
        for (let i = 0; i < 5; i++) {
          await fs.writeFile(
            path.join(testDir, dir, `file${i}.js`),
            `// ${dir}/file${i}.js\nmodule.exports = { name: '${dir}_file${i}' };`
          );
        }
      }
      
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'medium-project',
        version: '2.0.0',
        scripts: {
          start: 'node src/index.js',
          test: 'npm test',
          build: 'webpack --mode production'
        },
        dependencies: {
          express: '^4.18.0',
          lodash: '^4.17.21',
          moment: '^2.29.4',
          axios: '^1.6.0',
          react: '^18.2.0'
        },
        devDependencies: {
          webpack: '^5.89.0',
          jest: '^29.7.0',
          eslint: '^8.54.0'
        }
      }, null, 2));
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Measure installation performance
      const startTime = performance.now();
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      const endTime = performance.now();
      const installTime = endTime - startTime;
      
      // Performance requirement: Medium projects should install in under 15 seconds
      assert(installTime < 15000, `Installation took ${installTime.toFixed(2)}ms, should be under 15000ms for medium projects`);
      
      // Verify all AI tools were configured
      const expectedFiles = ['CLAUDE.md', 'GEMINI.md', '.cursorrules'];
      for (const file of expectedFiles) {
        const exists = await fs.access(path.join(testDir, file)).then(() => true).catch(() => false);
        assert(exists, `${file} should be created within performance requirements`);
      }
      
      console.log(`✓ Medium project installation: ${installTime.toFixed(2)}ms`);
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should install within performance requirements for large projects', async () => {
    const testDir = await env.createTempDir('perf-large-project');
    
    try {
      // Create large project structure (200+ files, 20+ directories)
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      const baseDirectories = [
        'src/components', 'src/services', 'src/utils', 'src/hooks', 'src/contexts',
        'lib/core', 'lib/plugins', 'lib/helpers', 'lib/validators',
        'config/environments', 'config/database', 'config/cache',
        'tests/unit', 'tests/integration', 'tests/e2e',
        'docs/api', 'docs/guides', 'docs/examples',
        'public/assets', 'public/images'
      ];
      
      for (const dir of baseDirectories) {
        await fs.mkdir(path.join(testDir, dir), { recursive: true });
        
        // Create 10 files per directory for large project
        for (let i = 0; i < 10; i++) {
          const fileContent = `// ${dir}/module${i}.js
export class Module${i} {
  constructor() {
    this.name = '${dir.replace('/', '_')}_module${i}';
    this.version = '1.0.0';
  }
  
  async initialize() {
    return Promise.resolve(this.name);
  }
  
  async process(data) {
    return { ...data, processedBy: this.name };
  }
}

export default Module${i};`;
          
          await fs.writeFile(path.join(testDir, dir, `module${i}.js`), fileContent);
        }
      }
      
      // Create comprehensive package.json for large project
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'large-project',
        version: '3.0.0',
        description: 'A large-scale application for performance testing',
        scripts: {
          start: 'node src/server.js',
          dev: 'nodemon src/server.js',
          build: 'webpack --mode production',
          test: 'jest',
          'test:coverage': 'jest --coverage',
          lint: 'eslint src/',
          'lint:fix': 'eslint src/ --fix',
          deploy: 'npm run build && npm run test && docker build .'
        },
        dependencies: {
          express: '^4.18.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          lodash: '^4.17.21',
          moment: '^2.29.4',
          axios: '^1.6.0',
          mongoose: '^7.6.0',
          redis: '^4.6.0',
          jsonwebtoken: '^9.0.2',
          bcryptjs: '^2.4.3',
          cors: '^2.8.5',
          helmet: '^7.1.0',
          dotenv: '^16.3.0'
        },
        devDependencies: {
          webpack: '^5.89.0',
          'webpack-cli': '^5.1.4',
          jest: '^29.7.0',
          eslint: '^8.54.0',
          nodemon: '^3.0.2',
          '@babel/core': '^7.23.0',
          '@babel/preset-env': '^7.23.0',
          '@babel/preset-react': '^7.22.0',
          'babel-loader': '^9.1.3'
        }
      }, null, 2));
      
      // Copy DocuMind system
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Measure installation performance
      const startTime = performance.now();
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      const endTime = performance.now();
      const installTime = endTime - startTime;
      
      // Performance requirement: Large projects should install in under 30 seconds
      assert(installTime < 30000, `Installation took ${installTime.toFixed(2)}ms, should be under 30000ms for large projects`);
      
      // Verify installation handled large project correctly
      const claudeContent = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf8');
      assert(claudeContent.includes('DocuMind'), 'Should configure Claude properly for large projects');
      
      console.log(`✓ Large project installation: ${installTime.toFixed(2)}ms`);
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should have consistent performance across multiple installations', async () => {
    const iterations = 5;
    const installTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const testDir = await env.createTempDir(`perf-consistency-${i}`);
      
      try {
        // Create consistent project structure
        await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
        await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
          name: 'consistency-test',
          version: '1.0.0',
          dependencies: { express: '^4.18.0' }
        }, null, 2));
        
        // Copy DocuMind system
        const sourceDir = path.join(__dirname, '../../.documind');
        const targetDir = path.join(testDir, '.documind');
        await env.copyDirectory(sourceDir, targetDir);
        
        // Measure installation time
        const startTime = performance.now();
        
        const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
        const installer = new DocuMindInstaller();
        installer.repoRoot = testDir;
        installer.documindDir = targetDir;
        
        await installer.install();
        
        const endTime = performance.now();
        installTimes.push(endTime - startTime);
        
      } finally {
        await env.cleanup(testDir);
      }
    }
    
    // Calculate statistics
    const avgTime = installTimes.reduce((a, b) => a + b) / installTimes.length;
    const maxTime = Math.max(...installTimes);
    const minTime = Math.min(...installTimes);
    const variance = installTimes.reduce((acc, time) => acc + Math.pow(time - avgTime, 2), 0) / installTimes.length;
    const stdDev = Math.sqrt(variance);
    
    console.log(`✓ Performance consistency over ${iterations} runs:`);
    console.log(`  Average: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
    console.log(`  Standard deviation: ${stdDev.toFixed(2)}ms`);
    
    // Performance should be reasonably consistent
    assert(stdDev < avgTime * 0.5, `Standard deviation ${stdDev.toFixed(2)}ms should be less than 50% of average ${avgTime.toFixed(2)}ms`);
    assert(maxTime < avgTime * 2, `Max time ${maxTime.toFixed(2)}ms should be less than 2x average ${avgTime.toFixed(2)}ms`);
  });

  await t.test('should measure update performance', async () => {
    const testDir = await env.createTempDir('perf-update');
    
    try {
      // Setup project and install DocuMind
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
        name: 'update-perf-test',
        version: '1.0.0'
      }, null, 2));
      
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      const DocuMindInstaller = require('../../.documind/scripts/install.cjs');
      const installer = new DocuMindInstaller();
      installer.repoRoot = testDir;
      installer.documindDir = targetDir;
      
      await installer.install();
      
      // Measure update performance
      const startTime = performance.now();
      
      const UpdateScript = require('../../.documind/scripts/update.cjs');
      const updater = new UpdateScript();
      updater.repoRoot = testDir;
      updater.documindDir = targetDir;
      
      await updater.update();
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      // Update should be faster than initial installation
      assert(updateTime < 5000, `Update took ${updateTime.toFixed(2)}ms, should be under 5000ms`);
      
      console.log(`✓ Update performance: ${updateTime.toFixed(2)}ms`);
      
    } finally {
      await env.cleanup(testDir);
    }
  });

  await t.test('should measure command generation performance', async () => {
    const testDir = await env.createTempDir('perf-commands');
    
    try {
      await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
      
      const sourceDir = path.join(__dirname, '../../.documind');
      const targetDir = path.join(testDir, '.documind');
      await env.copyDirectory(sourceDir, targetDir);
      
      // Measure command generation performance
      const startTime = performance.now();
      
      const CommandGenerator = require('../../.documind/scripts/generate-commands.cjs');
      const generator = new CommandGenerator();
      generator.repoRoot = testDir;
      generator.documindDir = targetDir;
      
      await generator.generateClaudeCommands();
      
      const endTime = performance.now();
      const genTime = endTime - startTime;
      
      // Command generation should be very fast
      assert(genTime < 1000, `Command generation took ${genTime.toFixed(2)}ms, should be under 1000ms`);
      
      console.log(`✓ Command generation performance: ${genTime.toFixed(2)}ms`);
      
    } finally {
      await env.cleanup(testDir);
    }
  });
});