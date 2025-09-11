/**
 * DocuMind - IDE-Native Documentation System
 * 
 * Main entry point for programmatic usage
 */

const path = require('path');
const DocuMindInstaller = require('./.documind/scripts/install.js');
const DocuMindUpdater = require('./.documind/scripts/update.js');

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
      const fs = require('fs').promises;
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
      const fs = require('fs').promises;
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
      const fs = require('fs').promises;
      const commandsFile = path.join(this.documindDir, 'commands.md');
      const commands = await fs.readFile(commandsFile, 'utf8');
      return commands;
    } catch {
      return null;
    }
  }
}

module.exports = DocuMind;