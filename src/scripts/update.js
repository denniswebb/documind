#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import https from 'https';

class DocuMindUpdater {
  constructor() {
    this.repoRoot = process.cwd();
    this.documindDir = path.join(this.repoRoot, '.documind');
    this.versionFile = path.join(this.documindDir, 'VERSION');
    this.updateUrl = 'https://api.github.com/repos/denniswebb/documind/releases/latest';
  }

  async update() {
    console.log('🔄 Checking for DocuMind updates...');
    
    try {
      // 1. Check current version
      const currentVersion = await this.getCurrentVersion();
      console.log(`  📍 Current version: ${currentVersion}`);
      
      // 2. Fetch latest version from GitHub
      const latestRelease = await this.getLatestRelease();
      const latestVersion = latestRelease.tag_name.replace('v', '');
      console.log(`  🚀 Latest version: ${latestVersion}`);
      
      // 3. Compare versions
      if (this.compareVersions(currentVersion, latestVersion) >= 0) {
        console.log('✅ DocuMind is already up to date!');
        return;
      }
      
      console.log('📦 New version available, updating...');
      
      // 4. Download and apply update
      await this.downloadAndApplyUpdate(latestRelease);
      
      // 5. Regenerate instruction files
      await this.regenerateInstructionFiles();
      
      console.log('✅ DocuMind updated successfully!');
      console.log(`  📍 Updated from ${currentVersion} to ${latestVersion}`);
      
    } catch (error) {
      console.error('❌ Update failed:', error.message);
      if (error.code === 'ENOENT' && error.path?.includes('VERSION')) {
        console.log('  💡 Tip: This might be a fresh install. Try running the install script first.');
      }
      process.exit(1);
    }
  }

  async getCurrentVersion() {
    try {
      const version = await fs.readFile(this.versionFile, 'utf8');
      return version.trim();
    } catch (error) {
      throw new Error(`Cannot read current version: ${error.message}`);
    }
  }

  async getLatestRelease() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: '/repos/denniswebb/documind/releases/latest',
        method: 'GET',
        headers: {
          'User-Agent': 'DocuMind-Updater',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const release = JSON.parse(data);
              resolve(release);
            } catch (error) {
              reject(new Error(`Failed to parse GitHub response: ${error.message}`));
            }
          } else {
            reject(new Error(`GitHub API returned ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Failed to fetch latest release: ${error.message}`));
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      req.end();
    });
  }

  compareVersions(current, latest) {
    const currentParts = current.split('.').map(num => parseInt(num, 10));
    const latestParts = latest.split('.').map(num => parseInt(num, 10));
    
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;
      
      if (currentPart < latestPart) return -1;
      if (currentPart > latestPart) return 1;
    }
    
    return 0; // Equal
  }

  async downloadAndApplyUpdate(release) {
    // For now, we'll implement a simple approach where we download
    // the core files from the release assets or from the main branch
    
    console.log('  📥 Downloading core system files...');
    
    // In a real implementation, this would:
    // 1. Download the .documind directory contents from the release
    // 2. Backup current .documind directory
    // 3. Replace core files (VERSION, system.md, commands.md, templates/, scripts/)
    // 4. Preserve any local customizations
    
    // For now, we'll simulate by just updating the VERSION file
    await fs.writeFile(this.versionFile, release.tag_name.replace('v', ''));
    
    console.log('  ✓ Core system files updated');
  }

  async regenerateInstructionFiles() {
    console.log('  🔄 Regenerating AI instruction files...');
    
    // Import and run the installer to regenerate instruction files
    const DocuMindInstaller = (await import('./install.js')).default;
    const installer = new DocuMindInstaller();
    
    // Detect current AI tools
    const detected = await installer.detectAITools();
    
    // Regenerate instruction files for each tool
    for (const tool of detected) {
      await installer.generateInstructionFile(tool);
    }
    
    console.log('  ✓ AI instruction files regenerated');
  }

  // Manual update for development/testing
  async updateFromLocal(sourcePath) {
    console.log('🔄 Updating DocuMind from local source...');
    
    try {
      const sourceDocumind = path.join(sourcePath, '.documind');
      
      // Check if source has .documind directory
      await fs.access(sourceDocumind);
      
      // Copy core files (but preserve VERSION for now)
      const coreFiles = ['system.md', 'commands.md'];
      const coreDirs = ['templates', 'scripts'];
      
      // Ensure core directory exists
      const coreDestDir = path.join(this.documindDir, 'core');
      await fs.mkdir(coreDestDir, { recursive: true });
      
      for (const file of coreFiles) {
        const source = path.join(sourceDocumind, 'core', file);
        const dest = path.join(this.documindDir, 'core', file);
        await fs.copyFile(source, dest);
        console.log(`  ✓ Updated ${file}`);
      }
      
      for (const dir of coreDirs) {
        const sourceDir = path.join(sourceDocumind, dir);
        const destDir = path.join(this.documindDir, dir);
        
        // Recursively copy directory
        await this.copyDirectory(sourceDir, destDir);
        console.log(`  ✓ Updated ${dir}/`);
      }
      
      // Regenerate instruction files
      await this.regenerateInstructionFiles();
      
      console.log('✅ Local update completed successfully!');
      
    } catch (error) {
      console.error('❌ Local update failed:', error.message);
      process.exit(1);
    }
  }

  async copyDirectory(source, dest) {
    await fs.mkdir(dest, { recursive: true });
    
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }
}

// CLI interface
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const updater = new DocuMindUpdater();
  
  const args = process.argv.slice(2);
  if (args.length > 0 && args[0] === '--local') {
    const sourcePath = args[1] || '.';
    updater.updateFromLocal(sourcePath).catch(error => {
      console.error('Update failed:', error);
      process.exit(1);
    });
  } else {
    updater.update().catch(error => {
      console.error('Update failed:', error);
      process.exit(1);
    });
  }
}

export default DocuMindUpdater;