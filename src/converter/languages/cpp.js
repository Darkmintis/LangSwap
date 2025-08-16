// C++ Language Converter
import { BaseLanguageConverter } from '../BaseLanguageConverter.js';

export class CppConverter extends BaseLanguageConverter {
  constructor() {
    super('C++');
  }

  setupLanguageRules() {
    this.patterns = {
      include: /^#include\s*[<"](.+)[>"]$/,
      namespace: /^(?:using\s+)?namespace\s+(\w+)\s*(?:\{|;)$/,
      class: /^(?:class|struct)\s+(\w+)(?:\s*:\s*(?:public|private|protected)\s+(.+))?\s*\{?$/,
      function: /^(?:inline\s+)?(\w+(?:\s*\*)?)\s+(\w+)\s*\((.*?)\)\s*(?:const)?\s*\{?$/,
      variable: /^(?:const\s+|static\s+)?(\w+(?:\s*\*)?)\s+(\w+)(?:\s*=\s*(.+))?\s*;?$/,
      template: /^template\s*<(.+)>$/
    };
  }

  isComment(line) {
    if (!line || typeof line !== 'string') return false;
    return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
  }

  isFunctionDefinition(line) {
    return this.patterns.function.test(line) && !line.includes('class ') && !line.includes('struct ');
  }

  isClassDefinition(line) {
    return this.patterns.class.test(line) || line.includes('namespace ');
  }

  isVariableAssignment(line) {
    return this.patterns.variable.test(line) && !line.includes('(') && !line.includes('class ');
  }

  isControlFlow(line) {
    return line.includes('if (') || line.includes('for (') || line.includes('while (') || 
           line.includes('try {') || line.includes('switch (');
  }

  formatComment(value) {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('//')) return value;
    return `// ${value.replace(/^#+\s*/, '')}`;
  }

  formatFunctionDefinition(node) {
    if (node.originalLine) return node.originalLine;
    const params = node.parameters ? node.parameters.join(', ') : '';
    return `${node.returnType || 'void'} ${node.name}(${params}) {`;
  }

  formatClassDefinition(node) {
    if (node.originalLine) return node.originalLine;
    if (node.type === 'namespace') {
      return `namespace ${node.name} {`;
    }
    const inheritance = node.inheritance ? ` : public ${node.inheritance}` : '';
    return `class ${node.name}${inheritance} {`;
  }

  formatVariableAssignment(node) {
    if (node.originalLine) return node.originalLine;
    const value = node.value ? ` = ${node.value}` : '';
    return `${node.dataType || 'auto'} ${node.name}${value};`;
  }

  formatExpression(node) {
    if (!node.originalLine) return '';
    let line = node.originalLine.trim();
    if (line && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && 
        !line.startsWith('#') && !line.includes('namespace ')) {
      line += ';';
    }
    return line;
  }

  validateSyntax(code) {
    super.validateSyntax(code);
    const lines = code.split('\n');
    let hasInclude = false;
    let hasMain = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#include')) hasInclude = true;
      if (line.includes('int main') || line.includes('void main')) hasMain = true;
    }
    
    if (!hasInclude) this.addWarning('C++ code typically requires #include directives');
  }

  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    // Handle compressed C++ code
    let preprocessed = code;
    
    // Remove any standalone semicolons first
    preprocessed = preprocessed.replace(/;\s*;/g, ';');
    
    // Add line breaks after semicolons (if not already present)
    preprocessed = preprocessed.replace(/;(?!\s*[\r\n])/g, ';\n');
    
    // Add line breaks around braces (if not already present)
    preprocessed = preprocessed.replace(/\{(?!\s*[\r\n])/g, ' {\n');
    preprocessed = preprocessed.replace(/\}(?!\s*[\r\n])/g, '\n}\n');
    
    // Handle C++-specific patterns
    preprocessed = preprocessed.replace(/(class|struct|namespace|if|else|for|while|do|try|catch|switch)\s+/g, '$1 ');
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
