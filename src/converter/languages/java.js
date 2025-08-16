// Java Language Converter
import { BaseLanguageConverter } from '../BaseLanguageConverter.js';

export class JavaConverter extends BaseLanguageConverter {
  constructor() {
    super('Java');
  }

  setupLanguageRules() {
    this.patterns = {
      class: /^(?:public\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{?$/,
      method: /^(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(\w+)\s+(\w+)\s*\((.*?)\)\s*\{?$/,
      variable: /^(?:public\s+|private\s+|protected\s+)?(?:static\s+|final\s+)*(\w+)\s+(\w+)\s*(?:=\s*(.+))?\s*;?$/,
      if: /^if\s*\((.*?)\)\s*\{?$/,
      else: /^}\s*else\s*\{?$/,
      elseIf: /^}\s*else\s+if\s*\((.*?)\)\s*\{?$/,
      for: /^for\s*\((.*?)\)\s*\{?$/,
      forEach: /^for\s*\((\w+)\s+(\w+)\s*:\s*(\w+)\)\s*\{?$/,
      while: /^while\s*\((.*?)\)\s*\{?$/,
      try: /^try\s*\{?$/,
      catch: /^}\s*catch\s*\((\w+)\s+(\w+)\)\s*\{?$/,
      finally: /^}\s*finally\s*\{?$/
    };
  }

  isComment(line) {
    if (!line || typeof line !== 'string') return false;
    return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
  }

  isFunctionDefinition(line) {
    return this.patterns.method.test(line) && !line.includes('class ');
  }

  isClassDefinition(line) {
    return this.patterns.class.test(line);
  }

  isVariableAssignment(line) {
    return this.patterns.variable.test(line);
  }

  isControlFlow(line) {
    return this.patterns.if.test(line) || this.patterns.for.test(line) || 
           this.patterns.while.test(line) || this.patterns.try.test(line);
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
    const extendsClause = node.extends ? ` extends ${node.extends}` : '';
    return `public class ${node.name}${extendsClause} {`;
  }

  formatVariableAssignment(node) {
    if (node.originalLine) return node.originalLine;
    const assignment = node.value ? ` = ${node.value}` : '';
    return `${node.dataType || 'Object'} ${node.name}${assignment};`;
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
    let hasClass = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('class ')) hasClass = true;
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
    }
    
    if (!hasClass) this.addWarning('Java code should contain at least one class');
    if (braceCount !== 0) this.addWarning('Unmatched braces detected');
  }

  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    // First, handle compressed Java code by adding proper line breaks
    let preprocessed = code;
    
    // Remove any standalone semicolons first
    preprocessed = preprocessed.replace(/;\s*;/g, ';');
    
    // Add line breaks after semicolons (if not already present)
    preprocessed = preprocessed.replace(/;(?!\s*[\r\n])/g, ';\n');
    
    // Add line breaks around braces (if not already present)
    preprocessed = preprocessed.replace(/\{(?!\s*[\r\n])/g, ' {\n');
    preprocessed = preprocessed.replace(/\}(?!\s*[\r\n])/g, '\n}\n');
    
    // Handle Java-specific patterns
    preprocessed = preprocessed.replace(/(public|private|protected|static|final|abstract)\s+/g, '$1 ');
    preprocessed = preprocessed.replace(/(class|interface|enum)\s+/g, '$1 ');
    preprocessed = preprocessed.replace(/(if|else|for|while|do|try|catch|finally|switch)\s*\(/g, '$1 (');
    
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
          trimmed.match(/^(if|else|for|while|do|try|catch|finally|switch)\b.*\)\s*$/)) {
        indentLevel++;
      }
      
      // Handle Java-specific indentation
      if (trimmed.includes('class ') || trimmed.includes('interface ') || 
          trimmed.includes('enum ') || trimmed.match(/^(public|private|protected).*\{$/)) {
        if (!trimmed.endsWith('{')) {
          indentLevel++;
        }
      }
    }
    
    return formatted
      .join('\n')
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive empty lines
      .replace(/^\n+/, '') // Remove leading newlines
      .replace(/\n*$/, '\n'); // Ensure single trailing newline
  }
}
