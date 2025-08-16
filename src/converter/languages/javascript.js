// JavaScript Language Converter
import { BaseLanguageConverter } from '../BaseLanguageConverter.js';

export class JavaScriptConverter extends BaseLanguageConverter {
  constructor() {
    super('JavaScript');
  }

  setupLanguageRules() {
    // JavaScript-specific conversion rules
    this.patterns = {
      function: /^function\s+(\w+)\s*\((.*?)\)\s*\{?$/,
      arrowFunction: /^(?:const|let|var)\s+(\w+)\s*=\s*(?:\((.*?)\)|(\w+))\s*=>\s*(.*)$/,
      class: /^class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{?$/,
      variable: /^(?:const|let|var)\s+(\w+)\s*=\s*(.+)$/,
      if: /^if\s*\((.*?)\)\s*\{?$/,
      elseIf: /^}\s*else\s+if\s*\((.*?)\)\s*\{?$/,
      else: /^}\s*else\s*\{?$/,
      for: /^for\s*\((.*?)\)\s*\{?$/,
      forEach: /^(\w+)\.forEach\s*\((.*?)\)\s*;?$/,
      while: /^while\s*\((.*?)\)\s*\{?$/,
      try: /^try\s*\{?$/,
      catch: /^}\s*catch\s*\((\w+)\)\s*\{?$/,
      finally: /^}\s*finally\s*\{?$/
    };
  }

  // Comment detection
  isFullLineComment(line) {
    if (!line || typeof line !== 'string') return false;
    return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*/') || 
           line.startsWith('*') || line.trim() === '';
  }

  hasInlineComment(line) {
    if (!line || typeof line !== 'string') return false;
    // Check for inline comments but exclude strings
    const parts = line.split(/(['"])((?:(?!\1)[^\\]|\\.)*)(\1)/);
    for (let i = 0; i < parts.length; i += 4) {
      if (parts[i] && parts[i].includes('//')) {
        return true;
      }
    }
    return false;
  }

  splitInlineComment(line) {
    const commentIndex = line.indexOf('//');
    if (commentIndex === -1) return { code: line, comment: '' };
    
    return {
      code: line.substring(0, commentIndex).trim(),
      comment: line.substring(commentIndex).trim()
    };
  }

  isFunctionDefinition(line) {
    return this.patterns.function.test(line) || this.patterns.arrowFunction.test(line);
  }

  isClassDefinition(line) {
    return this.patterns.class.test(line);
  }

  isVariableAssignment(line) {
    return this.patterns.variable.test(line) || 
           (/^\w+\s*=\s*.+$/.test(line) && !line.includes('function') && !line.includes('class'));
  }

  isControlFlow(line) {
    return this.patterns.if.test(line) || this.patterns.for.test(line) || 
           this.patterns.while.test(line) || this.patterns.try.test(line);
  }

  parseFunctionDefinition(line, lineNumber, indent) {
    const functionMatch = line.match(this.patterns.function);
    const arrowMatch = line.match(this.patterns.arrowFunction);
    
    if (functionMatch) {
      return {
        type: 'FunctionDefinition',
        name: functionMatch[1],
        parameters: functionMatch[2].split(',').map(p => p.trim()).filter(p => p),
        body: [],
        line: lineNumber,
        indent,
        isArrow: false
      };
    } else if (arrowMatch) {
      return {
        type: 'FunctionDefinition',
        name: arrowMatch[1],
        parameters: arrowMatch[2] ? arrowMatch[2].split(',').map(p => p.trim()).filter(p => p) : [arrowMatch[3]],
        body: arrowMatch[4] ? [arrowMatch[4]] : [],
        line: lineNumber,
        indent,
        isArrow: true
      };
    }
    
    return { type: 'FunctionDefinition', originalLine: line, line: lineNumber, indent };
  }

  parseClassDefinition(line, lineNumber, indent) {
    const match = line.match(this.patterns.class);
    if (match) {
      return {
        type: 'ClassDefinition',
        name: match[1],
        extends: match[2] || null,
        methods: [],
        properties: [],
        line: lineNumber,
        indent
      };
    }
    
    return { type: 'ClassDefinition', originalLine: line, line: lineNumber, indent };
  }

  parseVariableAssignment(line, lineNumber, indent) {
    const declMatch = line.match(this.patterns.variable);
    const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
    
    if (declMatch) {
      return {
        type: 'VariableAssignment',
        name: declMatch[1],
        value: declMatch[2],
        declarationType: line.match(/^(const|let|var)/)[1],
        line: lineNumber,
        indent
      };
    } else if (assignMatch) {
      return {
        type: 'VariableAssignment',
        name: assignMatch[1],
        value: assignMatch[2],
        declarationType: null,
        line: lineNumber,
        indent
      };
    }
    
    return { type: 'VariableAssignment', originalLine: line, line: lineNumber, indent };
  }

  parseControlFlow(line, lineNumber, indent) {
    if (this.patterns.if.test(line)) {
      const match = line.match(this.patterns.if);
      return {
        type: 'ControlFlow',
        subtype: 'if',
        condition: match[1],
        line: lineNumber,
        indent
      };
    }
    
    if (this.patterns.for.test(line)) {
      const match = line.match(this.patterns.for);
      return {
        type: 'ControlFlow',
        subtype: 'for',
        condition: match[1],
        line: lineNumber,
        indent
      };
    }
    
    if (this.patterns.while.test(line)) {
      const match = line.match(this.patterns.while);
      return {
        type: 'ControlFlow',
        subtype: 'while',
        condition: match[1],
        line: lineNumber,
        indent
      };
    }
    
    return { type: 'ControlFlow', originalLine: line, line: lineNumber, indent };
  }

  // Format methods for generating target language code
  formatComment(value) {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('//')) return value;
    return `// ${value.replace(/^#+\s*/, '')}`;
  }

  formatFunctionDefinition(node) {
    if (node.originalLine) {
      // If we have originalLine, it means we couldn't parse it properly
      // Let's convert Python function syntax to JavaScript manually
      const line = node.originalLine.trim();
      if (line.startsWith('def ') && line.endsWith(':')) {
        const match = line.match(/^def\s+(\w+)\s*\((.*?)\)\s*:$/);
        if (match) {
          const functionName = match[1];
          const params = match[2].split(',').map(p => p.trim()).filter(p => p);
          return `function ${functionName}(${params.join(', ')}) {`;
        }
      }
      return node.originalLine;
    }
    
    const params = node.parameters ? node.parameters.join(', ') : '';
    let result = `function ${node.name}(${params}) {\n`;
    
    // Add function body if available
    if (node.body && Array.isArray(node.body)) {
      for (const bodyNode of node.body) {
        const bodyCode = this.nodeToCode(bodyNode);
        if (bodyCode) {
          result += `  ${bodyCode}\n`;
        }
      }
    }
    
    result += '}';
    return result;
  }

  formatClassDefinition(node) {
    if (node.originalLine) return node.originalLine;
    
    const extendsClause = node.extends ? ` extends ${node.extends}` : '';
    return `class ${node.name}${extendsClause} {`;
  }

  formatVariableAssignment(node) {
    if (node.originalLine) return node.originalLine;
    
    const declaration = node.declarationType || 'let';
    return `${declaration} ${node.name} = ${node.value};`;
  }

  formatControlFlow(node) {
    if (node.originalLine) return node.originalLine;
    
    switch (node.subtype) {
      case 'if':
        return `if (${node.condition}) {`;
      case 'for':
        return `for (${node.condition}) {`;
      case 'while':
        return `while (${node.condition}) {`;
      default:
        return node.originalLine || '';
    }
  }

  formatExpression(node) {
    if (!node.originalLine) return '';
    
    let line = node.originalLine.trim();
    
    // Add semicolon if missing
    if (line && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}')) {
      line += ';';
    }
    
    return line;
  }

  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    // Handle compressed JavaScript code
    let preprocessed = code;
    
    // Remove any standalone semicolons first
    preprocessed = preprocessed.replace(/;\s*;/g, ';');
    
    // Add line breaks after semicolons (if not already present)
    preprocessed = preprocessed.replace(/;(?!\s*[\r\n])/g, ';\n');
    
    // Add line breaks around braces (if not already present)
    preprocessed = preprocessed.replace(/\{(?!\s*[\r\n])/g, ' {\n');
    preprocessed = preprocessed.replace(/\}(?!\s*[\r\n])/g, '\n}\n');
    
    // Handle JavaScript-specific patterns
    preprocessed = preprocessed.replace(/(function|const|let|var|if|else|for|while|do|try|catch|finally|switch)\s+/g, '$1 ');
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
      if (trimmed === '}' || trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Add indentation
      formatted.push(this.getIndentation(indentLevel) + trimmed);
      
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

  validateSyntax(code) {
    if (!code || typeof code !== 'string') return;
    
    super.validateSyntax(code);
    
    // JavaScript-specific validation
    const lines = code.split('\n');
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || typeof line !== 'string') continue;
      
      const trimmed = line.trim();
      
      if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;
      
      // Count braces
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      // Check for common syntax errors
      if (trimmed.includes('function ') && !trimmed.includes('(')) {
        this.addWarning(`Line ${i + 1}: Function definition may be incomplete`);
      }
      
      if (trimmed.match(/^(const|let|var)\s+\w+\s*[^=]/) && !trimmed.includes('=')) {
        this.addWarning(`Line ${i + 1}: Variable declaration without initialization`);
      }
    }
    
    if (braceCount !== 0) {
      this.addWarning('Unmatched curly braces detected');
    }
  }

  // Professional formatting to reduce unnecessary comments
  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    return code
      .split('\n')
      .map(line => line.trimRight())
      .filter((line, index, array) => {
        // Remove excessive comment blocks
        const trimmed = line.trim();
        const prevLine = index > 0 ? array[index - 1].trim() : '';
        
        // Keep meaningful comments, remove redundant ones
        if (trimmed.startsWith('//')) {
          // Remove very short or redundant comments
          if (trimmed.length < 10 && !trimmed.includes('TODO') && !trimmed.includes('FIXME')) {
            return false;
          }
          // Remove consecutive identical comment patterns
          if (prevLine.startsWith('//') && trimmed === prevLine) {
            return false;
          }
        }
        
        return true;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive empty lines
      .trim();
  }
}
