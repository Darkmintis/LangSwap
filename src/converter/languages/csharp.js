// C# Language Converter
import { BaseLanguageConverter } from '../BaseLanguageConverter.js';

export class CSharpConverter extends BaseLanguageConverter {
  constructor() {
    super('C#');
  }

  setupLanguageRules() {
    this.patterns = {
      namespace: /^namespace\s+(\w+(?:\.\w+)*)\s*\{?$/,
      class: /^(?:public\s+|private\s+|internal\s+)?(?:static\s+|abstract\s+)?class\s+(\w+)(?:\s*:\s*(.+))?\s*\{?$/,
      method: /^(?:public\s+|private\s+|protected\s+|internal\s+)?(?:static\s+|virtual\s+|override\s+)?(\w+)\s+(\w+)\s*\((.*?)\)\s*\{?$/,
      property: /^(?:public\s+|private\s+|protected\s+)?(\w+)\s+(\w+)\s*\{\s*get;\s*set;\s*\}$/,
      variable: /^(?:var\s+|(\w+)\s+)(\w+)\s*(?:=\s*(.+))?\s*;?$/,
      using: /^using\s+(.+)\s*;$/
    };
  }

  isComment(line) {
    if (!line || typeof line !== 'string') return false;
    return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('///');
  }

  isFunctionDefinition(line) {
    return this.patterns.method.test(line);
  }

  isClassDefinition(line) {
    return this.patterns.class.test(line) || this.patterns.namespace.test(line);
  }

  isVariableAssignment(line) {
    return this.patterns.variable.test(line) || this.patterns.property.test(line);
  }

  isControlFlow(line) {
    return line.includes('if (') || line.includes('for (') || line.includes('foreach (') || 
           line.includes('while (') || line.includes('try {');
  }

  formatComment(value) {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('//')) return value;
    return `// ${value.replace(/^#+\s*/, '')}`;
  }

  formatFunctionDefinition(node) {
    if (node.originalLine) return node.originalLine;
    const params = node.parameters ? node.parameters.join(', ') : '';
    return `public ${node.returnType || 'void'} ${node.name}(${params}) {`;
  }

  formatClassDefinition(node) {
    if (node.originalLine) return node.originalLine;
    if (node.type === 'namespace') {
      return `namespace ${node.name} {`;
    }
    const inheritance = node.inheritance ? ` : ${node.inheritance}` : '';
    return `public class ${node.name}${inheritance} {`;
  }

  formatVariableAssignment(node) {
    if (node.originalLine) return node.originalLine;
    const dataType = node.dataType || 'var';
    const value = node.value ? ` = ${node.value}` : '';
    return `${dataType} ${node.name}${value};`;
  }

  formatExpression(node) {
    if (!node.originalLine) return '';
    let line = node.originalLine.trim();
    if (line && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}')) {
      line += ';';
    }
    return line;
  }

  validateSyntax(code) {
    super.validateSyntax(code);
    const lines = code.split('\n');
    let hasNamespace = false;
    let hasClass = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('namespace ')) hasNamespace = true;
      if (line.includes('class ')) hasClass = true;
    }
    
    if (!hasClass) this.addWarning('C# code should contain at least one class');
  }

  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    // First, handle compressed C# code by adding proper line breaks
    let preprocessed = code;
    
    // Remove any standalone semicolons first
    preprocessed = preprocessed.replace(/;\s*;/g, ';');
    
    // Add line breaks after semicolons (if not already present)
    preprocessed = preprocessed.replace(/;(?!\s*[\r\n])/g, ';\n');
    
    // Add line breaks around braces (if not already present)
    preprocessed = preprocessed.replace(/\{(?!\s*[\r\n])/g, ' {\n');
    preprocessed = preprocessed.replace(/\}(?!\s*[\r\n])/g, '\n}\n');
    
    // Handle C#-specific patterns
    preprocessed = preprocessed.replace(/(public|private|protected|internal|static|readonly|const|virtual|override|abstract)\s+/g, '$1 ');
    preprocessed = preprocessed.replace(/(class|interface|struct|enum|namespace)\s+/g, '$1 ');
    preprocessed = preprocessed.replace(/(if|else|for|foreach|while|do|try|catch|finally|switch)\s*\(/g, '$1 (');
    
    // Add line breaks after method parameters
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
      
      // Increase indent for opening braces and control structures
      if (trimmed.endsWith('{') || 
          trimmed.match(/^(if|else|for|foreach|while|do|try|catch|finally|switch)\b.*\)\s*$/)) {
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
