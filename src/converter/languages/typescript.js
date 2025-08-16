// TypeScript Language Converter
import { BaseLanguageConverter } from '../BaseLanguageConverter.js';

export class TypeScriptConverter extends BaseLanguageConverter {
  constructor() {
    super('TypeScript');
  }

  setupLanguageRules() {
    this.patterns = {
      function: /^function\s+(\w+)\s*\((.*?)\)\s*:\s*(\w+)\s*\{?$/,
      arrowFunction: /^(?:const|let|var)\s+(\w+)\s*:\s*\((.*?)\)\s*=>\s*(\w+)\s*=\s*\((.*?)\)\s*=>\s*(.*)$/,
      interface: /^interface\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{?$/,
      type: /^type\s+(\w+)\s*=\s*(.+)$/,
      class: /^(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+(.+))?\s*\{?$/,
      variable: /^(?:const|let|var)\s+(\w+)\s*:\s*(\w+)(?:\s*=\s*(.+))?\s*;?$/,
      import: /^import\s+(?:\{(.+)\}|(\w+))\s+from\s+['"](.+)['"]$/,
      export: /^export\s+(?:default\s+)?(.+)$/
    };
  }

  isComment(line) {
    if (!line || typeof line !== 'string') return false;
    return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
  }

  isFunctionDefinition(line) {
    return this.patterns.function.test(line) || this.patterns.arrowFunction.test(line);
  }

  isClassDefinition(line) {
    return this.patterns.class.test(line) || this.patterns.interface.test(line);
  }

  isVariableAssignment(line) {
    return this.patterns.variable.test(line) || this.patterns.type.test(line);
  }

  isControlFlow(line) {
    return line.includes('if (') || line.includes('for (') || line.includes('while (') || line.includes('try {');
  }

  formatComment(value) {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('//')) return value;
    return `// ${value.replace(/^#+\s*/, '')}`;
  }

  formatFunctionDefinition(node) {
    if (node.originalLine) return node.originalLine;
    const params = node.parameters ? node.parameters.join(', ') : '';
    const returnType = node.returnType || 'void';
    return `function ${node.name}(${params}): ${returnType} {`;
  }

  formatClassDefinition(node) {
    if (node.originalLine) return node.originalLine;
    if (node.type === 'interface') {
      return `interface ${node.name} {`;
    }
    const extendsClause = node.extends ? ` extends ${node.extends}` : '';
    const implementsClause = node.implements ? ` implements ${node.implements}` : '';
    return `class ${node.name}${extendsClause}${implementsClause} {`;
  }

  formatVariableAssignment(node) {
    if (node.originalLine) return node.originalLine;
    const type = node.dataType ? `: ${node.dataType}` : '';
    const value = node.value ? ` = ${node.value}` : '';
    return `const ${node.name}${type}${value};`;
  }

  validateSyntax(code) {
    super.validateSyntax(code);
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('function ') && !line.includes(': ')) {
        this.addWarning(`Line ${i + 1}: TypeScript function should have return type annotation`);
      }
    }
  }

  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    // Handle compressed TypeScript code
    let preprocessed = code;
    
    // Remove any standalone semicolons first
    preprocessed = preprocessed.replace(/;\s*;/g, ';');
    
    // Add line breaks after semicolons (if not already present)
    preprocessed = preprocessed.replace(/;(?!\s*[\r\n])/g, ';\n');
    
    // Add line breaks around braces (if not already present)
    preprocessed = preprocessed.replace(/\{(?!\s*[\r\n])/g, ' {\n');
    preprocessed = preprocessed.replace(/\}(?!\s*[\r\n])/g, '\n}\n');
    
    // Handle TypeScript-specific patterns
    preprocessed = preprocessed.replace(/(function|const|let|var|if|else|for|while|do|try|catch|finally|switch|interface|type|class|enum)\s+/g, '$1 ');
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
      if (trimmed === '}' || trimmed.startsWith('} ') || trimmed === '];' || trimmed === ');') {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Add indentation
      const indent = '  '.repeat(indentLevel); // TypeScript typically uses 2 spaces
      formatted.push(indent + trimmed);
      
      // Increase indent for opening braces/brackets
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
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
