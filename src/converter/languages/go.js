// Go Language Converter
import { BaseLanguageConverter } from '../BaseLanguageConverter.js';

export class GoConverter extends BaseLanguageConverter {
  constructor() {
    super('Go');
  }

  setupLanguageRules() {
    this.patterns = {
      package: /^package\s+(\w+)$/,
      import: /^import\s+(?:"(.+)"|(\(.+\)))$/,
      function: /^func\s+(?:\((\w+)\s+\*?(\w+)\)\s+)?(\w+)\s*\((.*?)\)\s*(?:\((.+)\)|(\w+))?\s*\{?$/,
      type: /^type\s+(\w+)\s+(?:struct\s*\{|interface\s*\{|(.+))$/,
      variable: /^(?:var\s+)?(\w+)(?:\s+(\w+))?\s*(?::?=\s*(.+))?\s*$/,
      const: /^const\s+(\w+)(?:\s+(\w+))?\s*=\s*(.+)$/,
      method: /^func\s+\((\w+)\s+\*?(\w+)\)\s+(\w+)\s*\((.*?)\)\s*(?:\((.+)\)|(\w+))?\s*\{?$/
    };
  }

  isComment(line) {
    if (!line || typeof line !== 'string') return false;
    return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
  }

  isFunctionDefinition(line) {
    return this.patterns.function.test(line) || this.patterns.method.test(line);
  }

  isClassDefinition(line) {
    return this.patterns.type.test(line) && (line.includes('struct') || line.includes('interface'));
  }

  isVariableAssignment(line) {
    return this.patterns.variable.test(line) || this.patterns.const.test(line);
  }

  isControlFlow(line) {
    return line.includes('if ') || line.includes('for ') || line.includes('switch ') || 
           line.includes('select {') || line.includes('go ');
  }

  formatComment(value) {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('//')) return value;
    return `// ${value.replace(/^#+\s*/, '')}`;
  }

  formatFunctionDefinition(node) {
    if (node.originalLine) return node.originalLine;
    const params = node.parameters ? node.parameters.join(', ') : '';
    const returnType = node.returnType ? ` ${node.returnType}` : '';
    return `func ${node.name}(${params})${returnType} {`;
  }

  formatClassDefinition(node) {
    if (node.originalLine) return node.originalLine;
    if (node.structType === 'struct') {
      return `type ${node.name} struct {`;
    } else if (node.structType === 'interface') {
      return `type ${node.name} interface {`;
    }
    return `type ${node.name} ${node.definition}`;
  }

  formatVariableAssignment(node) {
    if (node.originalLine) return node.originalLine;
    if (node.isConst) {
      return `const ${node.name} = ${node.value}`;
    }
    const dataType = node.dataType ? ` ${node.dataType}` : '';
    const value = node.value ? ` = ${node.value}` : '';
    return `var ${node.name}${dataType}${value}`;
  }

  formatExpression(node) {
    if (!node.originalLine) return '';
    return node.originalLine.trim(); // Go doesn't require semicolons
  }

  validateSyntax(code) {
    super.validateSyntax(code);
    const lines = code.split('\n');
    let hasPackage = false;
    let hasMain = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('package ')) hasPackage = true;
      if (line.includes('func main()')) hasMain = true;
    }
    
    if (!hasPackage) this.addWarning('Go code should start with a package declaration');
  }

  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    // Handle compressed Go code
    let preprocessed = code;
    
    // Remove any standalone semicolons first (Go doesn't require semicolons)
    preprocessed = preprocessed.replace(/;\s*;/g, ';');
    preprocessed = preprocessed.replace(/;(?!\s*[\r\n])/g, '\n');
    
    // Add line breaks around braces (if not already present)
    preprocessed = preprocessed.replace(/\{(?!\s*[\r\n])/g, ' {\n');
    preprocessed = preprocessed.replace(/\}(?!\s*[\r\n])/g, '\n}\n');
    
    // Handle Go-specific patterns
    preprocessed = preprocessed.replace(/(func|if|else|for|switch|select|type|var|const|package|import)\s+/g, '$1 ');
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
      
      // Add indentation using tabs (Go convention)
      const indent = '\t'.repeat(indentLevel);
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
