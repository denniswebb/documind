/**
 * Mock Repository Generators
 * T013: Mock repository generators
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Creates a basic mock repository structure
 * @param {string} rootPath - Path to create the repository in
 * @returns {Promise<void>}
 */
export async function createMockRepository(rootPath) {
  // Create basic directory structure
  await fs.mkdir(path.join(rootPath, '.git'), { recursive: true });
  await fs.mkdir(path.join(rootPath, 'src'), { recursive: true });
  await fs.mkdir(path.join(rootPath, 'lib'), { recursive: true });
  
  // Create package.json
  const packageJson = {
    name: 'mock-repository',
    version: '1.0.0',
    description: 'A mock repository for testing',
    main: 'src/index.js',
    scripts: {
      start: 'node src/index.js',
      test: 'node --test'
    },
    dependencies: {
      express: '^4.18.0'
    }
  };
  
  await fs.writeFile(
    path.join(rootPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create basic files
  await fs.writeFile(
    path.join(rootPath, 'README.md'),
    '# Mock Repository\n\nThis is a mock repository for testing.'
  );
  
  await fs.writeFile(
    path.join(rootPath, 'src/index.js'),
    'console.log("Hello from mock repository");'
  );
}

/**
 * Creates a mock repository with existing AI tool configurations
 * @param {string} rootPath - Path to create the repository in
 * @param {string[]} aiTools - Array of AI tools to include ('claude', 'cursor', 'copilot', 'gemini')
 * @returns {Promise<void>}
 */
export async function createMockRepositoryWithAITools(rootPath, aiTools = []) {
  await createMockRepository(rootPath);
  
  // Create AI tool configurations based on the tools array
  if (aiTools.includes('claude')) {
    await fs.writeFile(
      path.join(rootPath, 'CLAUDE.md'),
      '# Existing Claude Configuration\n\nOld configuration content.'
    );
  }
  
  if (aiTools.includes('cursor')) {
    await fs.mkdir(path.join(rootPath, '.cursor'), { recursive: true });
    await fs.writeFile(
      path.join(rootPath, '.cursorrules'),
      '# Existing Cursor Rules\n\nOld cursor configuration.'
    );
  }
  
  if (aiTools.includes('copilot')) {
    await fs.mkdir(path.join(rootPath, '.github'), { recursive: true });
    await fs.writeFile(
      path.join(rootPath, '.github/copilot-instructions.md'),
      '# Existing Copilot Instructions\n\nOld copilot configuration.'
    );
  }
  
  if (aiTools.includes('gemini')) {
    // Update package.json to include gemini usage
    const packagePath = path.join(rootPath, 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    packageJson.scripts.gemini = 'gemini-cli generate';
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      'gemini-cli': '^1.0.0'
    };
    
    await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
  }
}

/**
 * Creates a mock repository with complex structure for testing
 * @param {string} rootPath - Path to create the repository in
 * @returns {Promise<void>}
 */
export async function createComplexMockRepository(rootPath) {
  await createMockRepository(rootPath);
  
  // Create more complex directory structure
  const directories = [
    'src/components',
    'src/services',
    'src/utils',
    'lib/core',
    'lib/plugins',
    'config',
    'tests',
    'docs'
  ];
  
  for (const dir of directories) {
    await fs.mkdir(path.join(rootPath, dir), { recursive: true });
    
    // Create a few files in each directory
    await fs.writeFile(
      path.join(rootPath, dir, 'index.js'),
      `// ${dir}/index.js\nmodule.exports = {};`
    );
  }
  
  // Create additional configuration files
  await fs.writeFile(
    path.join(rootPath, '.gitignore'),
    'node_modules/\n*.log\n.env\ndist/\n'
  );
  
  await fs.writeFile(
    path.join(rootPath, 'docker-compose.yml'),
    'version: "3.8"\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"'
  );
}

/**
 * Creates a mock repository with specific dependencies for testing AI detection
 * @param {string} rootPath - Path to create the repository in
 * @param {Object} dependencies - Dependencies to include in package.json
 * @returns {Promise<void>}
 */
export async function createMockRepositoryWithDependencies(rootPath, dependencies = {}) {
  await createMockRepository(rootPath);
  
  const packagePath = path.join(rootPath, 'package.json');
  const packageContent = await fs.readFile(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  packageJson.dependencies = { ...packageJson.dependencies, ...dependencies };
  
  await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
}

/**
 * Creates a mock repository with DocuMind system already installed
 * @param {string} rootPath - Path to create the repository in
 * @param {string} projectType - Type of project ('nodejs', 'python', etc.)
 * @param {boolean} includeVersion - Whether to include VERSION file
 * @returns {Promise<void>}
 */
export async function createMockRepositoryWithDocuMind(rootPath, projectType = 'nodejs', includeVersion = false) {
  await createMockRepository(rootPath);
  
  // Create .documind directory structure
  const documindDir = path.join(rootPath, '.documind');
  await fs.mkdir(documindDir, { recursive: true });
  
  // Create subdirectories
  await fs.mkdir(path.join(documindDir, 'scripts'), { recursive: true });
  await fs.mkdir(path.join(documindDir, 'templates'), { recursive: true });
  
  // Create VERSION file if requested
  if (includeVersion) {
    await fs.writeFile(
      path.join(documindDir, 'VERSION'),
      '1.0.0'
    );
  }
  
  // Create basic script files
  await fs.writeFile(
    path.join(documindDir, 'scripts', 'install.js'),
    '// Mock install script\nmodule.exports = class DocuMindInstaller {};'
  );
  
  await fs.writeFile(
    path.join(documindDir, 'scripts', 'update.js'),
    '// Mock update script\nmodule.exports = class DocuMindUpdater {};'
  );
  
  // Create template files based on project type
  if (projectType === 'nodejs') {
    await fs.writeFile(
      path.join(documindDir, 'templates', 'claude.md'),
      '# Claude Instructions Template\n\nThis is a template for Claude instructions.'
    );
  }
  
  // Create CLAUDE.md instruction file
  await fs.writeFile(
    path.join(rootPath, 'CLAUDE.md'),
    '# Claude Instructions\n\nExisting DocuMind configuration for this project.'
  );
}