// PHP Language Converter
import { BaseLanguageConverter } from '../BaseLanguageConverter.js';

export class PhpConverter extends BaseLanguageConverter {
  constructor() {
    super('PHP');
  }

  setupLanguageRules() {
    this.patterns = {
      opening: /^<\?php$/,
      function: /^function\s+(\w+)\s*\((.*?)\)\s*\{?$/,
      class: /^(?:abstract\s+|final\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+(.+))?\s*\{?$/,
      variable: /^(\$\w+)\s*=\s*(.+)\s*;?$/,
      property: /^(?:public|private|protected)\s+(?:static\s+)?(\$\w+)(?:\s*=\s*(.+))?\s*;?$/,
      method: /^(?:public|private|protected)\s+(?:static\s+)?function\s+(\w+)\s*\((.*?)\)\s*\{?$/,
      namespace: /^namespace\s+([\w\\]+)\s*;$/,
      use: /^use\s+([\w\\]+)(?:\s+as\s+(\w+))?\s*;$/
    };
  }

  isComment(line) {
    if (!line || typeof line !== 'string') return false;
    return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('#');
  }

  isFunctionDefinition(line) {
    return this.patterns.function.test(line) || this.patterns.method.test(line);
  }

  isClassDefinition(line) {
    return this.patterns.class.test(line);
  }

  isVariableAssignment(line) {
    return this.patterns.variable.test(line) || this.patterns.property.test(line);
  }

  isControlFlow(line) {
    return line.includes('if (') || line.includes('foreach (') || line.includes('for (') || 
           line.includes('while (') || line.includes('try {');
  }

  formatComment(value) {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('//') || value.startsWith('#')) return value;
    return `// ${value.replace(/^#+\s*/, '')}`;
  }

  formatFunctionDefinition(node) {
    if (node.originalLine) return node.originalLine;
    const params = node.parameters ? node.parameters.join(', ') : '';
    return `function ${node.name}(${params}) {`;
  }

  formatClassDefinition(node) {
    if (node.originalLine) return node.originalLine;
    const extendsClause = node.extends ? ` extends ${node.extends}` : '';
    const implementsClause = node.implements ? ` implements ${node.implements}` : '';
    return `class ${node.name}${extendsClause}${implementsClause} {`;
  }

  formatVariableAssignment(node) {
    if (node.originalLine) return node.originalLine;
    return `${node.name} = ${node.value};`;
  }

  formatExpression(node) {
    if (!node.originalLine) return '';
    let line = node.originalLine.trim();
    if (line && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && 
        !line.startsWith('<?php') && !line.includes('namespace ')) {
      line += ';';
    }
    return line;
  }

  validateSyntax(code) {
    super.validateSyntax(code);
    const lines = code.split('\n');
    let hasPhpTag = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '<?php') hasPhpTag = true;
      if (line.includes('$') && !line.includes('=') && !line.includes('(')) {
        this.addWarning(`Line ${i + 1}: PHP variable may need initialization`);
      }
    }
    
    if (!hasPhpTag) this.addWarning('PHP code should start with <?php tag');
  }

  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    // Handle compressed PHP code
    let preprocessed = code;
    
    // Remove any standalone semicolons first
    preprocessed = preprocessed.replace(/;\s*;/g, ';');
    
    // Add line breaks after semicolons (if not already present)
    preprocessed = preprocessed.replace(/;(?!\s*[\r\n])/g, ';\n');
    
    // Add line breaks around braces (if not already present)
    preprocessed = preprocessed.replace(/\{(?!\s*[\r\n])/g, ' {\n');
    preprocessed = preprocessed.replace(/\}(?!\s*[\r\n])/g, '\n}\n');
    
    // Handle PHP-specific patterns
    preprocessed = preprocessed.replace(/(function|class|if|else|elseif|for|foreach|while|do|try|catch|finally|switch)\s+/g, '$1 ');
    preprocessed = preprocessed.replace(/\)\s*\{/g, ') {');
    
    const lines = preprocessed.split('\n');
    const formatted = [];
    let indentLevel = 0;
    
    for (let line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed) {
        // Only add empty line if the previous line wasn't empty
        if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
          formatted.push('');
        }
        continue;
      }
      
      // Skip lines that are just semicolons
      if (trimmed === ';') {
        continue;
      }
      
      // Adjust indent for closing braces
      if (trimmed === '}' || trimmed.startsWith('} ')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Add indentation
      const indent = '    '.repeat(indentLevel);
      formatted.push(indent + trimmed);
      
      // Increase indent for opening braces
      if (trimmed.endsWith('{')) {
        indentLevel++;
      }
    }
    
    return formatted
      .join('\n')
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive empty lines
      .replace(/^\n+/, '') // Remove leading newlines
      .replace(/\n*$/, '\n'); // Ensure single trailing newline
  }
}
