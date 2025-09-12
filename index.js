/**
 * DocuMind - IDE-Native Documentation System
 * 
 * Main entry point for programmatic usage
 */

import path from 'path';
import { default as DocuMindInstaller } from './src/scripts/install.js';
import { default as DocuMindUpdater } from './src/scripts/update.js';

class DocuMind {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      ...options
    };
    
    this.documindDir = path.join(this.options.rootDir, '.documind');
  }

  /**
   * Install DocuMind in the specified directory
   */
  async install() {
    const installer = new DocuMindInstaller();
    return installer.install();
  }

  /**
   * Update DocuMind to the latest version
   */
  async update() {
    const updater = new DocuMindUpdater();
    return updater.update();
  }

  /**
   * Check if DocuMind is installed
   */
  async isInstalled() {
    try {
      const { promises: fs } = await import('fs');
      await fs.access(this.documindDir);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current DocuMind version
   */
  async getVersion() {
    try {
      const { promises: fs } = await import('fs');
      const versionFile = path.join(this.documindDir, 'VERSION');
      const version = await fs.readFile(versionFile, 'utf8');
      return version.trim();
    } catch {
      return null;
    }
  }

  /**
   * Get available documentation commands
   */
  async getCommands() {
    try {
      const { promises: fs } = await import('fs');
      const commandsFile = path.join(this.documindDir, 'commands.md');
      const commands = await fs.readFile(commandsFile, 'utf8');
      return commands;
    } catch {
      return null;
    }
  }
}

export default DocuMind;