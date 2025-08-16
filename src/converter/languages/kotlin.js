// Kotlin Language Converter
import { BaseLanguageConverter } from '../BaseLanguageConverter.js';

export class KotlinConverter extends BaseLanguageConverter {
  constructor() {
    super('Kotlin');
  }

  setupLanguageRules() {
    this.patterns = {
      function: /^(?:fun\s+)?(\w+)\s*\((.*?)\)\s*(?::\s*(.+))?\s*\{?$/,
      class: /^(?:open\s+|abstract\s+|final\s+)?class\s+(\w+)(?:\s*\((.*?)\))?(?:\s*:\s*(.+))?\s*\{?$/,
      interface: /^interface\s+(\w+)(?:\s*:\s*(.+))?\s*\{?$/,
      object: /^object\s+(\w+)(?:\s*:\s*(.+))?\s*\{?$/,
      variable: /^(?:val|var)\s+(\w+)(?:\s*:\s*(.+?))?\s*=\s*(.+)$/,
      property: /^(?:val|var)\s+(\w+)\s*:\s*(.+)$/,
      dataClass: /^data\s+class\s+(\w+)\s*\((.*?)\)$/,
      import: /^import\s+(.+)$/,
      package: /^package\s+([\w.]+)$/
    };
  }

  isComment(line) {
    if (!line || typeof line !== 'string') return false;
    return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
  }

  isFunctionDefinition(line) {
    return line.includes('fun ') || (this.patterns.function.test(line) && !line.includes('class '));
  }

  isClassDefinition(line) {
    return this.patterns.class.test(line) || this.patterns.interface.test(line) || 
           this.patterns.object.test(line) || this.patterns.dataClass.test(line);
  }

  isVariableAssignment(line) {
    return this.patterns.variable.test(line) || this.patterns.property.test(line);
  }

  isControlFlow(line) {
    return line.includes('if (') || line.includes('for (') || line.includes('while (') || 
           line.includes('when (') || line.includes('try {');
  }

  formatComment(value) {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('//')) return value;
    return `// ${value.replace(/^#+\s*/, '')}`;
  }

  formatFunctionDefinition(node) {
    if (node.originalLine) return node.originalLine;
    const params = node.parameters ? node.parameters.join(', ') : '';
    const returnType = node.returnType ? `: ${node.returnType}` : '';
    return `fun ${node.name}(${params})${returnType} {`;
  }

  formatClassDefinition(node) {
    if (node.originalLine) return node.originalLine;
    
    switch (node.type) {
      case 'class':
        const constructor = node.constructor ? `(${node.constructor})` : '';
        const inheritance = node.inheritance ? ` : ${node.inheritance}` : '';
        return `class ${node.name}${constructor}${inheritance} {`;
      case 'interface':
        const interfaceInheritance = node.inheritance ? ` : ${node.inheritance}` : '';
        return `interface ${node.name}${interfaceInheritance} {`;
      case 'object':
        const objectInheritance = node.inheritance ? ` : ${node.inheritance}` : '';
        return `object ${node.name}${objectInheritance} {`;
      case 'dataClass':
        return `data class ${node.name}(${node.properties})`;
      default:
        return node.originalLine;
    }
  }

  formatVariableAssignment(node) {
    if (node.originalLine) return node.originalLine;
    
    const declarationType = node.isMutable ? 'var' : 'val';
    const dataType = node.dataType ? `: ${node.dataType}` : '';
    const value = node.value ? ` = ${node.value}` : '';
    return `${declarationType} ${node.name}${dataType}${value}`;
  }

  formatExpression(node) {
    if (!node.originalLine) return '';
    
    // Kotlin expressions typically don't need semicolons
    return node.originalLine.trim();
  }

  validateSyntax(code) {
    super.validateSyntax(code);
    const lines = code.split('\n');
    let hasMain = false;
    let hasPackage = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('fun main(')) hasMain = true;
      if (line.startsWith('package ')) hasPackage = true;
      
      // Check for semicolons (discouraged in Kotlin)
      if (line.endsWith(';') && !line.includes('//')) {
        this.addWarning(`Line ${i + 1}: Semicolons are optional in Kotlin`);
      }
    }
  }

  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    // Handle compressed Kotlin code
    let preprocessed = code;
    
    // Remove any standalone semicolons first
    preprocessed = preprocessed.replace(/;\s*;/g, ';');
    
    // Add line breaks after semicolons (if not already present)
    preprocessed = preprocessed.replace(/;(?!\s*[\r\n])/g, ';\n');
    
    // Add line breaks around braces (if not already present)
    preprocessed = preprocessed.replace(/\{(?!\s*[\r\n])/g, ' {\n');
    preprocessed = preprocessed.replace(/\}(?!\s*[\r\n])/g, '\n}\n');
    
    // Handle Kotlin-specific patterns
    preprocessed = preprocessed.replace(/(fun|class|interface|object|enum|if|else|for|while|when|try|catch|finally)\s+/g, '$1 ');
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
