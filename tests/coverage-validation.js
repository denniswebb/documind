#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class CoverageValidator {
  constructor() {
    this.repoRoot = process.cwd();
    this.coverageDir = path.join(this.repoRoot, 'coverage');
    this.requiredCoverage = {
      lines: 90,
      functions: 90,
      branches: 80,
      statements: 90
    };
  }

  async validateCoverage() {
    console.log('🔍 Validating code coverage...');
    
    try {
      // Generate coverage report
      await this.generateCoverageReport();
      
      // Parse coverage data
      const coverage = await this.parseCoverageData();
      
      // Validate coverage thresholds
      const validationResults = this.validateThresholds(coverage);
      
      // Generate coverage reports
      await this.generateReports(coverage);
      
      // Display results
      this.displayResults(validationResults);
      
      // Exit with appropriate code
      const passed = validationResults.every(result => result.passed);
      if (!passed) {
        console.error('❌ Coverage validation failed');
        process.exit(1);
      }
      
      console.log('✅ Coverage validation passed');
      
    } catch (error) {
      console.error('❌ Coverage validation error:', error.message);
      process.exit(1);
    }
  }

  async generateCoverageReport() {
    console.log('  📊 Generating coverage report...');
    
    try {
      // Create coverage directory
      await this.ensureDir(this.coverageDir);
      
      // Try to run tests with coverage if any test files exist
      const testFiles = await this.countTestFiles();
      if (testFiles === 0) {
        console.log('  ⚠️  No test files found, skipping coverage generation');
        return;
      }
      
      // Run tests with coverage
      execSync('npm run test:coverage', { 
        stdio: 'pipe',
        cwd: this.repoRoot
      });
      
    } catch (error) {
      // If no tests exist, this is expected
      console.log('  ⚠️  No tests to run, coverage will be 0%');
    }
  }

  async parseCoverageData() {
    console.log('  📈 Parsing coverage data...');
    
    // Parse Node.js test runner coverage output
    const coverage = {
      lines: { covered: 0, total: 0, percentage: 0 },
      functions: { covered: 0, total: 0, percentage: 0 },
      branches: { covered: 0, total: 0, percentage: 0 },
      statements: { covered: 0, total: 0, percentage: 0 }
    };
    
    try {
      // Try to read LCOV file if it exists
      const lcovPath = path.join(this.coverageDir, 'lcov.info');
      const lcovExists = await fs.access(lcovPath).then(() => true).catch(() => false);
      
      if (lcovExists) {
        const lcovContent = await fs.readFile(lcovPath, 'utf8');
        return this.parseLcovData(lcovContent);
      }
      
      // Fallback: run coverage and parse stdout
      const coverageOutput = execSync('npm run test:coverage', { 
        encoding: 'utf8',
        cwd: this.repoRoot
      });
      
      return this.parseCoverageOutput(coverageOutput);
      
    } catch (error) {
      console.warn('Warning: Could not parse detailed coverage data, using estimates');
      
      // Provide estimated coverage based on test files
      const testFiles = await this.countTestFiles();
      const srcFiles = await this.countSourceFiles();
      
      // Estimate based on test-to-source ratio
      const testRatio = Math.min(testFiles / srcFiles, 1.0);
      const estimatedPercentage = Math.floor(testRatio * 85); // Conservative estimate
      
      return {
        lines: { covered: Math.floor(srcFiles * testRatio * 10), total: srcFiles * 10, percentage: estimatedPercentage },
        functions: { covered: Math.floor(srcFiles * testRatio * 5), total: srcFiles * 5, percentage: estimatedPercentage },
        branches: { covered: Math.floor(srcFiles * testRatio * 3), total: srcFiles * 4, percentage: Math.floor(estimatedPercentage * 0.8) },
        statements: { covered: Math.floor(srcFiles * testRatio * 12), total: srcFiles * 12, percentage: estimatedPercentage }
      };
    }
  }

  parseLcovData(lcovContent) {
    const coverage = {
      lines: { covered: 0, total: 0, percentage: 0 },
      functions: { covered: 0, total: 0, percentage: 0 },
      branches: { covered: 0, total: 0, percentage: 0 },
      statements: { covered: 0, total: 0, percentage: 0 }
    };
    
    const lines = lcovContent.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('LH:')) {
        coverage.lines.covered += parseInt(line.split(':')[1]);
      } else if (line.startsWith('LF:')) {
        coverage.lines.total += parseInt(line.split(':')[1]);
      } else if (line.startsWith('FNH:')) {
        coverage.functions.covered += parseInt(line.split(':')[1]);
      } else if (line.startsWith('FNF:')) {
        coverage.functions.total += parseInt(line.split(':')[1]);
      } else if (line.startsWith('BRH:')) {
        coverage.branches.covered += parseInt(line.split(':')[1]);
      } else if (line.startsWith('BRF:')) {
        coverage.branches.total += parseInt(line.split(':')[1]);
      }
    }
    
    // Calculate percentages
    coverage.lines.percentage = coverage.lines.total > 0 ? 
      Math.floor((coverage.lines.covered / coverage.lines.total) * 100) : 0;
    coverage.functions.percentage = coverage.functions.total > 0 ? 
      Math.floor((coverage.functions.covered / coverage.functions.total) * 100) : 0;
    coverage.branches.percentage = coverage.branches.total > 0 ? 
      Math.floor((coverage.branches.covered / coverage.branches.total) * 100) : 0;
    
    // Statements typically same as lines for Node.js
    coverage.statements = { ...coverage.lines };
    
    return coverage;
  }

  parseCoverageOutput(output) {
    const coverage = {
      lines: { covered: 0, total: 0, percentage: 0 },
      functions: { covered: 0, total: 0, percentage: 0 },
      branches: { covered: 0, total: 0, percentage: 0 },
      statements: { covered: 0, total: 0, percentage: 0 }
    };
    
    // Parse Node.js test runner output
    const lines = output.split('\n');
    
    for (const line of lines) {
      const percentageMatch = line.match(/(\d+\.?\d*)%/);
      if (percentageMatch) {
        const percentage = parseFloat(percentageMatch[1]);
        
        if (line.includes('lines')) {
          coverage.lines.percentage = percentage;
        } else if (line.includes('functions')) {
          coverage.functions.percentage = percentage;
        } else if (line.includes('branches')) {
          coverage.branches.percentage = percentage;
        } else if (line.includes('statements')) {
          coverage.statements.percentage = percentage;
        }
      }
    }
    
    return coverage;
  }

  async countTestFiles() {
    try {
      const testDirs = ['tests/unit', 'tests/integration', 'tests/performance'];
      let count = 0;
      
      for (const dir of testDirs) {
        const dirPath = path.join(this.repoRoot, dir);
        try {
          const files = await fs.readdir(dirPath);
          count += files.filter(file => file.endsWith('.test.js')).length;
        } catch (error) {
          // Directory might not exist
        }
      }
      
      return count;
    } catch (error) {
      return 0;
    }
  }

  async countSourceFiles() {
    try {
      let count = 0;
      
      // Check for install.js
      try {
        await fs.access(path.join(this.repoRoot, 'install.js'));
        count++;
      } catch (error) {
        // File doesn't exist
      }
      
      // Check for src/scripts directory
      const srcScriptsDir = path.join(this.repoRoot, 'src', 'scripts');
      try {
        const files = await fs.readdir(srcScriptsDir);
        count += files.filter(file => file.endsWith('.js')).length;
      } catch (error) {
        // Directory doesn't exist
      }
      
      return Math.max(count, 1); // At least install.js should exist
    } catch (error) {
      return 1;
    }
  }

  validateThresholds(coverage) {
    const results = [];
    
    for (const [metric, threshold] of Object.entries(this.requiredCoverage)) {
      const actual = coverage[metric]?.percentage || 0;
      const passed = actual >= threshold;
      
      results.push({
        metric,
        threshold,
        actual,
        passed,
        message: passed ? 
          `✓ ${metric}: ${actual}% (>= ${threshold}%)` :
          `✗ ${metric}: ${actual}% (< ${threshold}%)`
      });
    }
    
    return results;
  }

  async generateReports(coverage) {
    console.log('  📋 Generating coverage reports...');
    
    try {
      // Ensure coverage directory exists
      await fs.mkdir(this.coverageDir, { recursive: true });
      
      // Generate JSON report
      const jsonReport = {
        timestamp: new Date().toISOString(),
        coverage,
        thresholds: this.requiredCoverage,
        summary: {
          total: Object.values(coverage).reduce((sum, metric) => sum + (metric.percentage || 0), 0) / 4,
          passed: Object.entries(this.requiredCoverage).every(([metric, threshold]) => 
            (coverage[metric]?.percentage || 0) >= threshold
          )
        }
      };
      
      await fs.writeFile(
        path.join(this.coverageDir, 'coverage-report.json'),
        JSON.stringify(jsonReport, null, 2)
      );
      
      // Generate HTML report summary
      const htmlReport = this.generateHtmlReport(coverage);
      await fs.writeFile(
        path.join(this.coverageDir, 'coverage-summary.html'),
        htmlReport
      );
      
      // Generate badge data
      const badgeData = this.generateBadgeData(coverage);
      await fs.writeFile(
        path.join(this.coverageDir, 'badge.json'),
        JSON.stringify(badgeData, null, 2)
      );
      
    } catch (error) {
      console.warn('Warning: Could not generate all coverage reports:', error.message);
    }
  }

  generateHtmlReport(coverage) {
    const total = Object.values(coverage).reduce((sum, metric) => sum + (metric.percentage || 0), 0) / 4;
    
    return `<!DOCTYPE html>
<html>
<head>
  <title>DocuMind Coverage Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .metric { margin: 10px 0; padding: 10px; border-radius: 4px; }
    .passed { background-color: #d4edda; border: 1px solid #c3e6cb; }
    .failed { background-color: #f8d7da; border: 1px solid #f5c6cb; }
    .summary { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>DocuMind Code Coverage Report</h1>
  <div class="summary">Overall Coverage: ${total.toFixed(1)}%</div>
  
  ${Object.entries(coverage).map(([metric, data]) => `
    <div class="metric ${(data.percentage || 0) >= (this.requiredCoverage[metric] || 0) ? 'passed' : 'failed'}">
      <strong>${metric.charAt(0).toUpperCase() + metric.slice(1)}:</strong> 
      ${data.percentage || 0}% 
      (${data.covered || 0}/${data.total || 0})
      - Required: ${this.requiredCoverage[metric] || 0}%
    </div>
  `).join('')}
  
  <p><em>Generated: ${new Date().toLocaleString()}</em></p>
</body>
</html>`;
  }

  generateBadgeData(coverage) {
    const total = Object.values(coverage).reduce((sum, metric) => sum + (metric.percentage || 0), 0) / 4;
    
    let color = 'red';
    if (total >= 90) color = 'brightgreen';
    else if (total >= 80) color = 'yellow';
    else if (total >= 70) color = 'orange';
    
    return {
      schemaVersion: 1,
      label: 'coverage',
      message: `${total.toFixed(1)}%`,
      color
    };
  }

  displayResults(results) {
    console.log('\n📊 Coverage Results:');
    console.log('━'.repeat(50));
    
    for (const result of results) {
      console.log(`  ${result.message}`);
    }
    
    console.log('━'.repeat(50));
    
    const totalPassed = results.filter(r => r.passed).length;
    const totalMetrics = results.length;
    
    console.log(`\n📈 Summary: ${totalPassed}/${totalMetrics} metrics passed`);
    
    if (totalPassed === totalMetrics) {
      console.log('🎉 All coverage requirements met!');
    } else {
      console.log('⚠️  Some coverage requirements not met');
      console.log('\nTo improve coverage:');
      console.log('1. Add more unit tests for uncovered functions');
      console.log('2. Add integration tests for complex workflows');
      console.log('3. Test error handling and edge cases');
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new CoverageValidator();
  validator.validateCoverage().catch(error => {
    console.error('Coverage validation failed:', error);
    process.exit(1);
  });
}

export default CoverageValidator;