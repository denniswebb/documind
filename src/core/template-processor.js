class TemplateProcessor {
  constructor() {
    this.formatters = {
      bullet_points: this.convertToBulletPoints.bind(this),
      numbered_steps: this.convertToNumberedSteps.bind(this),
      table: this.convertToTable.bind(this),
      code_blocks: this.optimizeCodeBlocks.bind(this),
      minimal: this.minimizeContent.bind(this),
      structured: this.structureContent.bind(this)
    };
  }

  processTemplate(templateContent, variables = {}, aiFormat = null) {
    let processedContent = this.substituteVariables(templateContent, variables);

    if (aiFormat) {
      processedContent = this.applyAIFormatting(processedContent, aiFormat);
    }

    return processedContent;
  }

  substituteVariables(content, variables) {
    let result = content;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{${key.toUpperCase()}\\}`, 'g');
      result = result.replace(placeholder, value);
    });

    result = this.handleMissingVariables(result);
    return result;
  }

  handleMissingVariables(content) {
    const missingVarPattern = /\{([A-Z_]+)\}/g;
    return content.replace(missingVarPattern, (match, varName) => {
      return this.generateDefaultValue(varName);
    });
  }

  generateDefaultValue(varName) {
    const defaults = {
      'CONCEPT_NAME': 'example-concept',
      'SERVICE_NAME': 'example-service',
      'SYSTEM_NAME': 'example-system',
      'MODULE_NAME': 'example-module',
      'COMPONENT_NAME': 'example-component'
    };
    return defaults[varName] || `[${varName.toLowerCase()}]`;
  }

  applyAIFormatting(content, aiFormat) {
    if (!aiFormat.sections) return content;

    let formattedContent = content;

    Object.entries(aiFormat.sections).forEach(([sectionName, formatType]) => {
      if (this.formatters[formatType]) {
        formattedContent = this.applyFormatToSection(formattedContent, sectionName, formatType);
      }
    });

    if (aiFormat.token_optimization) {
      formattedContent = this.optimizeForTokens(formattedContent, aiFormat.token_optimization);
    }

    return formattedContent;
  }

  applyFormatToSection(content, sectionName, formatType) {
    const normalizedSectionName = this.normalizeSectionName(sectionName);
    const escapedSectionName = this.escapeRegExp(normalizedSectionName);
    const sectionPattern = new RegExp(`(#{1,6}\\s*${escapedSectionName}(?:\\s|$)[\\s\\S]*?)(?=#{1,6}\\s|$)`, 'mi');
    const match = content.match(sectionPattern);

    if (match) {
      const sectionContent = match[1];
      const formattedSection = this.formatters[formatType](sectionContent);
      return content.replace(sectionContent, formattedSection);
    }

    // Try to find by AI format markers as fallback
    const markerPattern = new RegExp(`<!-- AI_FORMAT: section=${this.escapeRegExp(sectionName)} -->([\\s\\S]*?)(?=<!--|$)`, 'i');
    const markerMatch = content.match(markerPattern);

    if (markerMatch) {
      const sectionContent = markerMatch[1];
      const formattedSection = this.formatters[formatType](sectionContent);
      return content.replace(sectionContent, formattedSection);
    }

    return content;
  }

  normalizeSectionName(sectionName) {
    return sectionName
      .toLowerCase()
      .replace(/[_-]/g, ' ')
      .trim();
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  convertToBulletPoints(content) {
    const lines = content.split('\n');
    let inFence = false;

    return lines.map(line => {
      // Track code fence state
      if (line.trim().match(/^```/)) {
        inFence = !inFence;
        return line;
      }

      // Skip formatting inside code fences
      if (inFence) {
        return line;
      }

      if (line.trim() && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('*')) {
        const trimmed = line.trim();
        if (trimmed.length > 10) {
          return `- ${trimmed}`;
        }
      }
      return line;
    }).join('\n');
  }

  convertToNumberedSteps(content) {
    const lines = content.split('\n');
    let stepNumber = 1;
    let inFence = false;

    return lines.map(line => {
      // Track code fence state
      if (line.trim().match(/^```/)) {
        inFence = !inFence;
        return line;
      }

      // Skip formatting inside code fences
      if (inFence) {
        return line;
      }

      if (line.trim() && !line.startsWith('#') && !line.startsWith('-') && !line.startsWith('*')) {
        const trimmed = line.trim();
        if (trimmed.length > 10) {
          return `${stepNumber++}. ${trimmed}`;
        }
      }
      return line;
    }).join('\n');
  }

  convertToTable(content) {
    const sections = this.extractKeyValuePairs(content);
    if (sections.length === 0) return content;

    let table = '| Key | Value |\n|-----|-------|\n';
    sections.forEach(([key, value]) => {
      table += `| ${key} | ${value} |\n`;
    });

    return content + '\n\n' + table;
  }

  extractKeyValuePairs(content) {
    const pairs = [];
    const lines = content.split('\n');

    lines.forEach(line => {
      const colonMatch = line.match(/^(.+?):\s*(.+)$/);
      if (colonMatch) {
        pairs.push([colonMatch[1].trim(), colonMatch[2].trim()]);
      }
    });

    return pairs;
  }

  optimizeCodeBlocks(content) {
    return content.replace(/```[\s\S]*?```/g, (match) => {
      const lines = match.split('\n');
      if (lines.length > 20) {
        const firstLines = lines.slice(0, 11);
        const lastLines = lines.slice(-5);
        return [...firstLines, '// ... (truncated for brevity)', ...lastLines].join('\n');
      }
      return match;
    });
  }

  minimizeContent(content) {
    // Split content into segments to preserve code blocks and tables
    const segments = this.segmentContent(content);

    return segments.map(segment => {
      if (segment.type === 'code' || segment.type === 'table') {
        return segment.content;
      }

      // Apply minimization only to prose segments
      return segment.content
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with single space
        .replace(/\s*:\s*/g, ': ')
        .replace(/\s*,\s*/g, ', ')
        .trim();
    }).join('');
  }

  segmentContent(content) {
    const segments = [];
    const lines = content.split('\n');
    let currentSegment = { type: 'prose', content: '' };
    let inCodeFence = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for code fence
      if (line.trim().match(/^```/)) {
        if (inCodeFence) {
          // End of code block
          currentSegment.content += line + '\n';
          segments.push(currentSegment);
          currentSegment = { type: 'prose', content: '' };
          inCodeFence = false;
        } else {
          // Start of code block
          if (currentSegment.content.trim()) {
            segments.push(currentSegment);
          }
          currentSegment = { type: 'code', content: line + '\n' };
          inCodeFence = true;
        }
        continue;
      }

      // Check for table row
      if (!inCodeFence && line.trim().startsWith('|')) {
        if (currentSegment.type !== 'table') {
          if (currentSegment.content.trim()) {
            segments.push(currentSegment);
          }
          currentSegment = { type: 'table', content: '' };
        }
      } else if (currentSegment.type === 'table' && !line.trim().startsWith('|') && line.trim() !== '') {
        // End of table
        segments.push(currentSegment);
        currentSegment = { type: 'prose', content: '' };
      }

      currentSegment.content += line + '\n';
    }

    if (currentSegment.content.trim()) {
      segments.push(currentSegment);
    }

    return segments;
  }

  structureContent(content) {
    const lines = content.split('\n');
    const structured = [];
    let currentSection = '';

    lines.forEach(line => {
      if (line.match(/^#{1,6}\s/)) {
        currentSection = line;
        structured.push(line);
      } else if (line.trim()) {
        if (currentSection.includes('Overview') || currentSection.includes('Summary')) {
          structured.push(`**Key Point:** ${line.trim()}`);
        } else {
          structured.push(line);
        }
      } else {
        structured.push(line);
      }
    });

    return structured.join('\n');
  }

  optimizeForTokens(content, optimizationRules) {
    let optimized = content;

    if (optimizationRules.remove_examples) {
      optimized = optimized.replace(/## Examples?[\s\S]*?(?=##|$)/gi, '');
    }

    if (optimizationRules.compress_whitespace) {
      optimized = optimized.replace(/\n\s*\n\s*\n/g, '\n\n');
    }

    if (optimizationRules.shorten_descriptions) {
      optimized = optimized.replace(/(\w+)\s+(\w+)\s+(\w+)\s+(\w+)\s+/g, '$1 $2 $3 ');
    }

    return optimized;
  }
}

export default TemplateProcessor;