// Base Language Converter - Foundation for all language converters
export class BaseLanguageConverter {
  constructor(languageName) {
    this.languageName = languageName;
    this.warnings = [];
    this.conversionRules = new Map();
    this.commentPatterns = new Map();
    this.setupLanguageRules();
  }

  // Abstract method - must be implemented by each language
  setupLanguageRules() {
    throw new Error(`setupLanguageRules must be implemented by ${this.languageName} converter`);
  }

  // Parse source code for large codebases
  parseToAST(sourceCode) {
    this.clearWarnings();
    
    try {
      // Validate syntax before parsing
      this.validateSyntax(sourceCode);
      
      // Extract comments while preserving context
      const { cleanCode, comments, commentMap } = this.extractCommentsWithContext(sourceCode);
      
      // Parse to intermediate representation
      const ast = this.parseCode(cleanCode);
      
      // Restore comments with proper positioning
      this.restoreCommentsToAST(ast, comments, commentMap);
      
      return ast;
    } catch (error) {
      throw new Error(`Failed to parse ${this.languageName} code: ${error.message}`);
    }
  }

  // Extract comments while preserving exact positioning
  extractCommentsWithContext(sourceCode) {
    if (!sourceCode || typeof sourceCode !== 'string') {
      return { cleanCode: '', comments: [], commentMap: new Map() };
    }
    
    const lines = sourceCode.split('\n');
    const comments = [];
    const commentMap = new Map();
    let cleanLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || typeof line !== 'string') {
        cleanLines.push('');
        continue;
      }
      
      const trimmed = line.trim();
      
      // Check if entire line is a comment
      if (this.isFullLineComment(trimmed)) {
        comments.push({
          type: 'fullLine',
          content: trimmed,
          originalLine: i,
          indentation: line.length - line.trimStart().length
        });
        commentMap.set(i, comments.length - 1);
        cleanLines.push(''); // Keep line position but empty
      }
      // Check for inline comments
      else if (this.hasInlineComment(line)) {
        const { code, comment } = this.splitInlineComment(line);
        comments.push({
          type: 'inline',
          content: comment,
          originalLine: i,
          associatedCode: code.trim()
        });
        commentMap.set(i, comments.length - 1);
        cleanLines.push(code);
      }
      else {
        cleanLines.push(line);
      }
    }
    
    return {
      cleanCode: cleanLines.join('\n'),
      comments,
      commentMap
    };
  }

  // Generate code from AST with proper comment restoration
  generateFromAST(ast) {
    try {
      const code = this.generateCode(ast);
      return this.formatCode(code);
    } catch (error) {
      throw new Error(`Failed to generate ${this.languageName} code: ${error.message}`);
    }
  }

  // Parse code for large files
  parseCode(sourceCode) {
    return this.createAST(sourceCode);
  }

  generateCode(ast) {
    return this.astToCode(ast);
  }

  // Create AST with better structure for large files
  createAST(sourceCode) {
    const ast = {
      type: 'Program',
      body: [],
      sourceLanguage: this.languageName,
      originalCode: sourceCode,
      metadata: {
        totalLines: sourceCode.split('\n').length,
        complexity: 0
      }
    };

    const lines = sourceCode.split('\n');
    let currentContext = null;
    let blockStack = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip empty lines but preserve them in output
      if (!trimmedLine) {
        ast.body.push({
          type: 'EmptyLine',
          line: i + 1
        });
        continue;
      }

      const node = this.parseLineToNode(line, i + 1, currentContext);
      if (node) {
        // Track complexity for large files
        if (node.type === 'FunctionDefinition' || node.type === 'ClassDefinition') {
          ast.metadata.complexity++;
        }
        
        ast.body.push(node);
        
        // Update context for block-based parsing
        if (this.isBlockStart(node)) {
          blockStack.push(node);
          currentContext = node;
        } else if (this.isBlockEnd(trimmedLine)) {
          blockStack.pop();
          currentContext = blockStack[blockStack.length - 1] || null;
        }
      }
    }

    return ast;
  }

  // AST to code conversion with proper comment handling
  astToCode(ast) {
    if (!ast || !ast.body) return '';
    
    let code = '';
    let previousNodeType = null;
    
    for (let i = 0; i < ast.body.length; i++) {
      const node = ast.body[i];
      const nextNode = ast.body[i + 1];
      
      const lineCode = this.nodeToCode(node, previousNodeType, nextNode);
      
      if (lineCode !== null && lineCode !== undefined) {
        code += lineCode;
        
        // Smart line breaks - avoid excessive empty lines
        if (node && node.type !== 'EmptyLine' && this.needsLineBreak(node, nextNode)) {
          code += '\n';
        }
      }
      
      previousNodeType = node ? node.type : null;
    }

    return code.replace(/\n{3,}/g, '\n\n'); // Limit consecutive empty lines
  }

  // Line parsing with better context awareness
  parseLineToNode(line, lineNumber, context) {
    const trimmedLine = line.trim();
    const indent = line.length - line.trimStart().length;

    // Function definition
    if (this.isFunctionDefinition(trimmedLine)) {
      return this.parseFunctionDefinition(trimmedLine, lineNumber, indent, context);
    }

    // Class definition
    if (this.isClassDefinition(trimmedLine)) {
      return this.parseClassDefinition(trimmedLine, lineNumber, indent, context);
    }

    // Variable assignment
    if (this.isVariableAssignment(trimmedLine)) {
      return this.parseVariableAssignment(trimmedLine, lineNumber, indent, context);
    }

    // Control flow (if, for, while)
    if (this.isControlFlow(trimmedLine)) {
      return this.parseControlFlow(trimmedLine, lineNumber, indent, context);
    }

    // Import/Export statements
    if (this.isImportExport(trimmedLine)) {
      return this.parseImportExport(trimmedLine, lineNumber, indent);
    }

    // Function call or expression
    return this.parseExpression(trimmedLine, lineNumber, indent, context);
  }

  // Node to code conversion
  nodeToCode(node, previousType, nextNode) {
    if (!node) return '';
    
    let result = '';
    switch (node.type) {
      case 'EmptyLine':
        result = '\n';
        break;
      case 'Comment':
        result = this.formatComment(node);
        break;
      case 'FunctionDefinition':
        result = this.formatFunctionDefinition(node);
        break;
      case 'ClassDefinition':
        result = this.formatClassDefinition(node);
        break;
      case 'VariableAssignment':
        result = this.formatVariableAssignment(node);
        break;
      case 'ControlFlow':
        result = this.formatControlFlow(node);
        break;
      case 'ImportExport':
        result = this.formatImportExport(node);
        break;
      case 'Expression':
        result = this.formatExpression(node);
        break;
      default:
        result = node.originalLine || '';
    }
    
    // Ensure we always return a string
    return typeof result === 'string' ? result : String(result || '');
  }

  // Professional code formatting
  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    // First, handle compressed/minified code by adding proper line breaks
    let preprocessed = code;
    
    // Remove any standalone semicolons first
    preprocessed = preprocessed.replace(/;\s*;/g, ';');
    
    // Protect language-specific operators before general formatting
    const protectedPatterns = [];
    
    // Protect :: (Rust, C++)
    preprocessed = preprocessed.replace(/::/g, '__DOUBLE_COLON__');
    
    // Protect println! and similar macros
    preprocessed = preprocessed.replace(/(println!|print!|dbg!|vec!)\s*\(/g, '__MACRO_$1__(');
    
    // Protect string formatting patterns like {:?}
    preprocessed = preprocessed.replace(/\{\s*:\s*\?\s*\}/g, '__FORMAT_DEBUG__');
    preprocessed = preprocessed.replace(/\{\s*:\s*(\w+)\s*\}/g, '__FORMAT_$1__');
    
    // Add line breaks after common statement terminators (if not already present)
    preprocessed = preprocessed.replace(/;(?!\s*[\r\n])/g, ';\n');
    
    // Add line breaks around braces (if not already present)
    preprocessed = preprocessed.replace(/\{(?!\s*[\r\n])/g, ' {\n');
    preprocessed = preprocessed.replace(/\}(?!\s*[\r\n])/g, '\n}\n');
    
    // Add line breaks after commas in function parameters or arrays (if not already present)
    // But be careful not to break method chaining or generic types
    preprocessed = preprocessed.replace(/,(?!\s*[\r\n])(?![^<]*>)/g, ',\n');
    
    // Handle method chaining - add line breaks before dots (if not a decimal number or module access)
    // Don't break :: (Rust/C++) or numeric decimals
    preprocessed = preprocessed.replace(/\.(?![0-9])(?!\.)/g, '\n.');
    
    // Add breaks after control structures
    preprocessed = preprocessed.replace(/(if|else|for|while|do|try|catch|finally|switch)\s*\(/g, '$1 (');
    preprocessed = preprocessed.replace(/\)\s*(?=\{)/g, ') ');
    
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
      
      // Skip lines that are just semicolons or colons
      if (trimmed === ';' || trimmed === ':') {
        continue;
      }
      
      // Adjust indent for closing braces/brackets/parentheses
      if (trimmed === '}' || trimmed.startsWith('} ') || 
          trimmed === '];' || trimmed === ');' || trimmed === '}>') {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Add indentation
      const indent = '    '.repeat(indentLevel);
      formatted.push(indent + trimmed);
      
      // Increase indent for opening braces/brackets
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || 
          trimmed.endsWith('(') || trimmed.endsWith('=>') ||
          trimmed.match(/^(if|else|for|while|do|try|catch|finally|switch)\b.*\)\s*$/)) {
        indentLevel++;
      }
    }
    
    let result = formatted
      .join('\n')
      .replace(/\n{3,}/g, '\n\n') // Limit to max 2 consecutive newlines
      .replace(/^\n+/, '') // Remove leading newlines
      .replace(/\n*$/, '\n'); // Ensure single trailing newline
    
    // Restore protected patterns
    result = result.replace(/__DOUBLE_COLON__/g, '::');
    result = result.replace(/__MACRO_(println!|print!|dbg!|vec!)__/g, '$1');
    result = result.replace(/__FORMAT_DEBUG__/g, '{:?}');
    result = result.replace(/__FORMAT_(\w+)__/g, '{:$1}');
    
    return result;
  }

  // Comment handling methods (to be overridden by specific languages)
  isFullLineComment(line) { return false; }
  hasInlineComment(line) { return false; }
  splitInlineComment(line) { return { code: line, comment: '' }; }
  
  // Parsing methods (to be overridden)
  isFunctionDefinition(line) { return false; }
  isClassDefinition(line) { return false; }
  isVariableAssignment(line) { return false; }
  isControlFlow(line) { return false; }
  isImportExport(line) { return false; }
  isBlockStart(node) { return false; }
  isBlockEnd(line) { return false; }
  needsLineBreak(currentNode, nextNode) { 
    if (!nextNode) return false;
    // Add line break before function/class definitions
    return ['FunctionDefinition', 'ClassDefinition'].includes(nextNode.type);
  }

  // Parsing methods with context
  parseFunctionDefinition(line, lineNumber, indent, context) { 
    return { type: 'FunctionDefinition', originalLine: line, line: lineNumber, indent, context };
  }
  parseClassDefinition(line, lineNumber, indent, context) { 
    return { type: 'ClassDefinition', originalLine: line, line: lineNumber, indent, context };
  }
  parseVariableAssignment(line, lineNumber, indent, context) { 
    return { type: 'VariableAssignment', originalLine: line, line: lineNumber, indent, context };
  }
  parseControlFlow(line, lineNumber, indent, context) { 
    return { type: 'ControlFlow', originalLine: line, line: lineNumber, indent, context };
  }
  parseImportExport(line, lineNumber, indent) { 
    return { type: 'ImportExport', originalLine: line, line: lineNumber, indent };
  }
  parseExpression(line, lineNumber, indent, context) { 
    return { type: 'Expression', originalLine: line, line: lineNumber, indent, context };
  }

  // Formatting methods (to be overridden)
  formatComment(node) { 
    const comment = node.content || node.value || '';
    return typeof comment === 'string' ? comment : String(comment);
  }
  formatFunctionDefinition(node) { return node.originalLine || ''; }
  formatClassDefinition(node) { return node.originalLine || ''; }
  formatVariableAssignment(node) { return node.originalLine || ''; }
  formatControlFlow(node) { return node.originalLine || ''; }
  formatImportExport(node) { return node.originalLine || ''; }
  formatExpression(node) { return node.originalLine || ''; }

  // Restore comments to AST
  restoreCommentsToAST(ast, comments, commentMap) {
    // Add comment nodes back to AST in proper positions
    const newBody = [];
    
    for (let i = 0; i < ast.body.length; i++) {
      const node = ast.body[i];
      
      // Check if there's a comment associated with this line
      if (commentMap.has(node.line - 1)) {
        const commentIndex = commentMap.get(node.line - 1);
        const comment = comments[commentIndex];
        
        if (comment.type === 'fullLine') {
          newBody.push({
            type: 'Comment',
            content: comment.content,
            line: comment.originalLine + 1,
            indentation: comment.indentation
          });
        } else if (comment.type === 'inline') {
          // Attach inline comment to the node
          node.inlineComment = comment.content;
        }
      }
      
      newBody.push(node);
    }
    
    ast.body = newBody;
  }

  // Syntax validation for large files
  validateSyntax(code) {
    const lines = code.split('\n');
    
    // Skip validation for very large files to improve performance
    if (lines.length > 5000) {
      this.addWarning('Large file detected - some validations skipped for performance');
      return;
    }
    
    // Basic validation
    const openBrackets = (code.match(/[\(\[\{]/g) || []).length;
    const closeBrackets = (code.match(/[\)\]\}]/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      this.addWarning('Mismatched brackets detected');
    }
    
    // Check for potential syntax issues
    if (code.includes('undefined')) {
      this.addWarning('Potential undefined values detected');
    }
  }

  // Warning management
  addWarning(message, line = null) {
    this.warnings.push({
      message,
      line,
      language: this.languageName,
      timestamp: new Date().toISOString()
    });
  }

  getWarnings() {
    return [...this.warnings];
  }

  clearWarnings() {
    this.warnings = [];
  }

  // Utility methods
  getIndentation(level) {
    return '    '.repeat(level);
  }

  normalizeIndentation(code) {
    const lines = code.split('\n');
    if (lines.length === 0) return code;
    
    const minIndent = Math.min(
      ...lines
        .filter(line => line.trim())
        .map(line => line.length - line.trimStart().length)
    );
    
    return lines
      .map(line => line.slice(minIndent))
      .join('\n');
  }
}
