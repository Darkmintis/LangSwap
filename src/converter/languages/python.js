// Python Language Converter with proper block parsing
import { BaseLanguageConverter } from '../BaseLanguageConverter.js';

export class PythonConverter extends BaseLanguageConverter {
  constructor() {
    super('Python');
  }

  setupLanguageRules() {
    this.patterns = {
      function: /^def\s+(\w+)\s*\((.*?)\)\s*:$/,
      class: /^class\s+(\w+)(?:\s*\(\s*(\w+)\s*\))?\s*:$/,
      variable: /^(\w+)\s*=\s*(.+)$/,
      if: /^if\s+(.*?)\s*:$/,
      elif: /^elif\s+(.*?)\s*:$/,
      else: /^else\s*:$/,
      for: /^for\s+(\w+)\s+in\s+(.*?)\s*:$/,
      forRange: /^for\s+(\w+)\s+in\s+range\s*\((.*?)\)\s*:$/,
      while: /^while\s+(.*?)\s*:$/,
      try: /^try\s*:$/,
      except: /^except(?:\s+(\w+))?(?:\s+as\s+(\w+))?\s*:$/,
      finally: /^finally\s*:$/,
      import: /^(?:import\s+(.+)|from\s+(.+)\s+import\s+(.+))$/,
      lambda: /lambda\s+([^:]+):\s*(.+)/
    };
  }

  // Override parseToAST to return a JavaScript-compatible AST structure
  parseToAST(sourceCode) {
    this.sourceCode = sourceCode;
    
    // Convert Python code directly to JavaScript and create a simple AST
    const jsCode = this.convertPythonToJS(sourceCode);
    
    // Return a simple AST that the JavaScript converter can understand
    return {
      type: 'Program',
      body: [{
        type: 'Expression',
        originalLine: jsCode,
        line: 1
      }],
      sourceLanguage: 'JavaScript', // Tell the target converter this is already JS
      originalCode: jsCode
    };
  }

  // Check if line starts a block
  isBlockStart(line) {
    return line.endsWith(':') && (
      this.patterns.function.test(line) ||
      this.patterns.class.test(line) ||
      this.patterns.if.test(line) ||
      this.patterns.for.test(line) ||
      this.patterns.forRange.test(line) ||
      this.patterns.while.test(line) ||
      this.patterns.try.test(line)
    );
  }

  // Parse a Python block with proper indentation
  parseBlock(lines, startIndex) {
    const line = lines[startIndex];
    const trimmed = line.trim();
    const baseIndent = this.getIndentLevel(line);
    const body = [];
    
    let i = startIndex + 1;
    
    // Parse block content
    while (i < lines.length) {
      const currentLine = lines[i];
      const currentTrimmed = currentLine.trim();
      const currentIndent = this.getIndentLevel(currentLine);
      
      // End of block
      if (currentTrimmed && currentIndent <= baseIndent) {
        break;
      }
      
      if (!currentTrimmed) {
        body.push({
          type: 'EmptyLine',
          originalLine: currentLine,
          line: i + 1
        });
      } else if (currentTrimmed.startsWith('#')) {
        body.push({
          type: 'Comment',
          originalLine: currentLine,
          line: i + 1
        });
      } else if (this.isBlockStart(currentTrimmed)) {
        const nestedResult = this.parseBlock(lines, i);
        body.push(nestedResult.node);
        i = nestedResult.nextIndex - 1;
      } else {
        body.push({
          type: 'Expression',
          originalLine: currentLine,
          line: i + 1
        });
      }
      
      i++;
    }

    // Create appropriate node type
    let node;
    if (this.patterns.function.test(trimmed)) {
      const match = trimmed.match(this.patterns.function);
      node = {
        type: 'FunctionDefinition',
        name: match[1],
        parameters: match[2].split(',').map(p => p.trim()).filter(p => p),
        body: body,
        originalLine: line,
        line: startIndex + 1
      };
    } else if (this.patterns.if.test(trimmed)) {
      const condition = trimmed.slice(3, -1).trim();
      node = {
        type: 'ControlFlow',
        subtype: 'if',
        condition: condition,
        body: body,
        originalLine: line,
        line: startIndex + 1
      };
    } else if (this.patterns.for.test(trimmed) || this.patterns.forRange.test(trimmed)) {
      node = {
        type: 'ControlFlow',
        subtype: 'for',
        condition: trimmed.slice(4, -1).trim(),
        body: body,
        originalLine: line,
        line: startIndex + 1
      };
    } else {
      node = {
        type: 'Block',
        body: body,
        originalLine: line,
        line: startIndex + 1
      };
    }

    return { node, nextIndex: i };
  }

  // Override the entire generation process to bypass the AST complexity
  generateFromAST(ast) {
    // For Python to JavaScript conversion, use direct conversion
    return this.convertPythonToJS(ast.originalCode);
  }

  // Direct Python to JavaScript conversion (similar to our SimplePythonToJSConverter)
  convertPythonToJS(pythonCode) {
    const lines = pythonCode.split('\n');
    const jsLines = [];
    let blockStack = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const currentIndent = this.getIndentLevel(line);
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        jsLines.push(line);
        continue;
      }
      
      // Check if we need to close any blocks
      this.closeBlocksIfNeeded(jsLines, blockStack, currentIndent);
      
      let jsLine = this.convertPythonLineToJS(trimmed);
      
      // Track blocks that need closing
      if (trimmed.endsWith(':')) {
        const blockType = this.getBlockType(trimmed);
        if (blockType) {
          blockStack.push({ type: blockType, indent: currentIndent });
        }
      }
      
      jsLines.push(this.addIndent(jsLine, currentIndent));
    }
    
    // Close any remaining open blocks
    while (blockStack.length > 0) {
      const block = blockStack.pop();
      jsLines.push(this.addIndent('}', block.indent));
    }

    const result = jsLines.join('\n');
    return this.formatCode(result);
  }

  getBlockType(line) {
    if (line.startsWith('def ')) return 'function';
    if (line.startsWith('class ')) return 'class';
    if (line.startsWith('if ')) return 'if';
    if (line.startsWith('for ')) return 'for';
    if (line.startsWith('while ')) return 'while';
    if (line.startsWith('try')) return 'try';
    return null;
  }
  
  closeBlocksIfNeeded(jsLines, blockStack, currentIndent) {
    while (blockStack.length > 0) {
      const topBlock = blockStack[blockStack.length - 1];
      if (currentIndent <= topBlock.indent) {
        blockStack.pop();
        jsLines.push(this.addIndent('}', topBlock.indent));
      } else {
        break;
      }
    }
  }
  
  addIndent(line, level) {
    if (!line.trim()) return line;
    return ' '.repeat(level) + line;
  }

  getIndentLevel(line) {
    if (!line) return 0;
    return line.length - line.trimStart().length;
  }

  // Comment handling
  isFullLineComment(line) {
    if (!line || typeof line !== 'string') return false;
    return line.trim().startsWith('#');
  }

  hasInlineComment(line) {
    if (!line || typeof line !== 'string') return false;
    return line.includes('#');
  }

  splitInlineComment(line) {
    const commentIndex = line.indexOf('#');
    if (commentIndex === -1) return { code: line, comment: '' };
    
    return {
      code: line.substring(0, commentIndex).trim(),
      comment: line.substring(commentIndex).trim()
    };
  }

  // Formatting methods for JavaScript output
  formatComment(value) {
    if (!value || typeof value !== 'string') return '';
    return value;
  }

  formatFunctionDefinition(node) {
    if (node.originalLine) {
      const line = node.originalLine.trim();
      if (line.startsWith('def ') && line.endsWith(':')) {
        const match = line.match(/^def\s+(\w+)\s*\((.*?)\)\s*:$/);
        if (match) {
          const funcName = match[1];
          const params = match[2];
          let result = `function ${funcName}(${params}) {\n`;
          
          if (node.body && Array.isArray(node.body)) {
            for (const bodyNode of node.body) {
              const convertedBodyNode = this.convertBodyNode(bodyNode, '  ');
              if (convertedBodyNode) {
                result += convertedBodyNode;
              }
            }
          }
          
          result += '}';
          return result;
        }
      }
      return node.originalLine;
    }
    
    const params = node.parameters ? node.parameters.join(', ') : '';
    return `function ${node.name}(${params}) {}`;
  }

  formatControlFlow(node) {
    if (node.originalLine) {
      const line = node.originalLine.trim();
      
      if (line.startsWith('if ') && line.endsWith(':')) {
        const condition = line.slice(3, -1).trim();
        const jsCondition = this.convertPythonCondition(condition);
        let result = `if (${jsCondition}) {\n`;
        
        if (node.body && Array.isArray(node.body)) {
          for (const bodyNode of node.body) {
            const convertedBodyNode = this.convertBodyNode(bodyNode, '  ');
            if (convertedBodyNode) {
              result += convertedBodyNode;
            }
          }
        }
        
        result += '}';
        return result;
      }
      
      if (line.startsWith('for ') && line.endsWith(':')) {
        const match = line.match(/^for\s+(\w+)\s+in\s+range\s*\((.*?)\)\s*:$/);
        if (match) {
          const variable = match[1];
          const rangeParam = match[2];
          let result = `for (let ${variable} = 0; ${variable} < ${rangeParam}; ${variable}++) {\n`;
          
          if (node.body && Array.isArray(node.body)) {
            for (const bodyNode of node.body) {
              const convertedBodyNode = this.convertBodyNode(bodyNode, '  ');
              if (convertedBodyNode) {
                result += convertedBodyNode;
              }
            }
          }
          
          result += '}';
          return result;
        }
      }
      
      return node.originalLine;
    }
    
    return '';
  }

  // Helper method to convert body nodes recursively
  convertBodyNode(node, indent = '') {
    if (node.type === 'EmptyLine') {
      return '\n';
    } else if (node.type === 'Comment') {
      return indent + node.originalLine + '\n';
    } else if (node.type === 'Expression') {
      if (node.originalLine) {
        const bodyLine = node.originalLine.trim();
        if (bodyLine && !bodyLine.startsWith('#')) {
          const convertedLine = this.convertPythonLineToJS(bodyLine);
          if (convertedLine) {
            return indent + convertedLine + '\n';
          }
        }
      }
    } else if (node.type === 'ControlFlow') {
      // Handle nested control flow
      const converted = this.formatControlFlow(node);
      if (converted) {
        // Add indentation to each line
        return converted.split('\n').map(line => line ? indent + line : line).join('\n') + '\n';
      }
    } else if (node.type === 'FunctionDefinition') {
      // Handle nested functions
      const converted = this.formatFunctionDefinition(node);
      if (converted) {
        return converted.split('\n').map(line => line ? indent + line : line).join('\n') + '\n';
      }
    }
    
    return '';
  }

  formatExpression(node) {
    if (!node.originalLine) return '';
    
    const line = node.originalLine.trim();
    
    // Skip empty lines and comments in function bodies
    if (!line || line.startsWith('#')) return '';
    
    return this.convertPythonLineToJS(line);
  }

  convertPythonLineToJS(line) {
    if (!line) return '';
    
    // Function definition
    if (line.startsWith('def ') && line.endsWith(':')) {
      const match = line.match(/^def\s+(\w+)\s*\((.*?)\)\s*:$/);
      if (match) {
        const funcName = match[1];
        const params = match[2];
        return `function ${funcName}(${params}) {`;
      }
    }
    
    // If statement
    if (line.startsWith('if ') && line.endsWith(':')) {
      const condition = line.slice(3, -1).trim();
      const jsCondition = this.convertPythonCondition(condition);
      return `if (${jsCondition}) {`;
    }
    
    // For loop with range
    if (line.startsWith('for ') && line.includes(' in range(') && line.endsWith(':')) {
      const match = line.match(/^for\s+(\w+)\s+in\s+range\s*\((.*?)\)\s*:$/);
      if (match) {
        const variable = match[1];
        const rangeParam = match[2];
        return `for (let ${variable} = 0; ${variable} < ${rangeParam}; ${variable}++) {`;
      }
    }
    
    // Return statement
    if (line.startsWith('return ')) {
      const returnValue = line.substring(7);
      const jsReturn = this.convertPythonExpression(returnValue);
      return `return ${jsReturn};`;
    }
    
    // Print statement
    if (line.startsWith('print(')) {
      const content = line.match(/print\s*\((.*?)\)$/);
      if (content) {
        const printContent = this.convertPythonPrint(content[1]);
        return `console.log(${printContent});`;
      }
    }
    
    // Default: convert as expression
    const converted = this.convertPythonExpression(line);
    return converted.endsWith(';') ? converted : converted + ';';
  }

  convertPythonCondition(condition) {
    return condition
      .replace(/\band\b/g, '&&')
      .replace(/\bor\b/g, '||')
      .replace(/\bnot\b/g, '!')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null');
  }

  convertPythonExpression(expr) {
    return expr
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      .trim();
  }

  convertPythonPrint(content) {
    // Handle f-strings
    if (content.startsWith('f"') || content.startsWith("f'")) {
      return content
        .substring(2, content.length - 1)
        .replace(/\{([^}]+)\}/g, '${$1}')
        .replace(/^/, '`')
        .replace(/$/, '`');
    }
    return content;
  }

  // Required base class methods
  isFunctionDefinition(line) {
    return this.patterns.function.test(line);
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

  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    // Handle compressed Python code
    let preprocessed = code;
    
    // Remove any standalone semicolons first
    preprocessed = preprocessed.replace(/;\s*;/g, ';');
    
    // Add line breaks after semicolons (if not already present)
    preprocessed = preprocessed.replace(/;(?!\s*[\r\n])/g, ';\n');
    
    // Add line breaks after colons ONLY for Python control structures (not all colons)
    // Only break after colons that end statements (Python block starters)
    preprocessed = preprocessed.replace(/(def|class|if|elif|else|for|while|try|except|finally|with)\s+[^:\n]*:(?!\s*[\r\n])/g, '$&\n');
    
    // Handle Python keywords that typically start new lines
    preprocessed = preprocessed.replace(/\b(def|class|if|elif|else|for|while|try|except|finally|with)\s+/g, '\n$1 ');
    
    // Remove leading newline if added
    preprocessed = preprocessed.replace(/^\n/, '');
    
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
      
      // Decrease indent for else, elif, except, finally
      if (trimmed.match(/^(else|elif|except|finally)\b/)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Add indentation (4 spaces for Python)
      const indent = '    '.repeat(indentLevel);
      formatted.push(indent + trimmed);
      
      // Increase indent after colons that end Python control structure lines
      if (trimmed.match(/^(def|class|if|elif|else|for|while|try|except|finally|with)\b.*:$/)) {
        indentLevel++;
      }
      
      // Handle dedent after certain keywords
      if (trimmed.match(/^(else|elif|except|finally)\b/) && trimmed.endsWith(':')) {
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
