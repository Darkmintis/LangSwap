// Rust Language Converter
import { BaseLanguageConverter } from '../BaseLanguageConverter.js';

export class RustConverter extends BaseLanguageConverter {
  constructor() {
    super('Rust');
  }

  setupLanguageRules() {
    this.patterns = {
      function: /^(?:pub\s+)?fn\s+(\w+)\s*\((.*?)\)\s*(?:->\s*(.+))?\s*\{?$/,
      struct: /^(?:pub\s+)?struct\s+(\w+)(?:<(.+)>)?\s*\{?$/,
      enum: /^(?:pub\s+)?enum\s+(\w+)(?:<(.+)>)?\s*\{?$/,
      impl: /^impl(?:<(.+)>)?\s+(\w+)(?:<(.+)>)?\s*\{?$/,
      trait: /^(?:pub\s+)?trait\s+(\w+)(?:<(.+)>)?\s*\{?$/,
      variable: /^let\s+(?:mut\s+)?(\w+)(?:\s*:\s*(.+?))?\s*=\s*(.+)\s*;?$/,
      const: /^const\s+(\w+)\s*:\s*(.+)\s*=\s*(.+)\s*;?$/,
      use: /^use\s+(.+)\s*;?$/,
      mod: /^(?:pub\s+)?mod\s+(\w+)\s*(?:\{|;)$/
    };
  }

  isComment(line) {
    if (!line || typeof line !== 'string') return false;
    return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('///');
  }

  isFunctionDefinition(line) {
    return this.patterns.function.test(line);
  }

  isClassDefinition(line) {
    return this.patterns.struct.test(line) || this.patterns.enum.test(line) || 
           this.patterns.trait.test(line) || this.patterns.impl.test(line);
  }

  isVariableAssignment(line) {
    return this.patterns.variable.test(line) || this.patterns.const.test(line);
  }

  isControlFlow(line) {
    return line.includes('if ') || line.includes('for ') || line.includes('while ') || 
           line.includes('match ') || line.includes('loop {');
  }

  formatComment(value) {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('//')) return value;
    return `// ${value.replace(/^#+\s*/, '')}`;
  }

  formatFunctionDefinition(node) {
    if (node.originalLine) return node.originalLine;
    const params = node.parameters ? node.parameters.join(', ') : '';
    const returnType = node.returnType ? ` -> ${node.returnType}` : '';
    return `fn ${node.name}(${params})${returnType} {`;
  }

  formatClassDefinition(node) {
    if (node.originalLine) return node.originalLine;
    switch (node.type) {
      case 'struct':
        return `struct ${node.name} {`;
      case 'enum':
        return `enum ${node.name} {`;
      case 'trait':
        return `trait ${node.name} {`;
      case 'impl':
        return `impl ${node.name} {`;
      default:
        return node.originalLine;
    }
  }

  formatVariableAssignment(node) {
    if (node.originalLine) return node.originalLine;
    if (node.isConst) {
      return `const ${node.name}: ${node.dataType} = ${node.value};`;
    }
    const dataType = node.dataType ? `: ${node.dataType}` : '';
    return `let ${node.name}${dataType} = ${node.value};`;
  }

  formatExpression(node) {
    if (!node.originalLine) return '';
    let line = node.originalLine.trim();
    
    // Add semicolon for statements (but not for control structures)
    if (line && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && 
        !line.includes('if ') && !line.includes('for ') && !line.includes('while ') &&
        !line.includes('match ') && !line.includes('loop ')) {
      line += ';';
    }
    
    return line;
  }

  validateSyntax(code) {
    super.validateSyntax(code);
    const lines = code.split('\n');
    let hasMain = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('fn main()')) hasMain = true;
      
      // Check for common Rust patterns
      if (line.includes('let ') && !line.includes('=')) {
        this.addWarning(`Line ${i + 1}: Rust variables should be initialized when declared`);
      }
    }
  }

  formatCode(code) {
    if (!code || typeof code !== 'string') return '';
    
    // Handle compressed Rust code with extra protection for Rust syntax
    let preprocessed = code;
    
    // Remove any standalone semicolons first
    preprocessed = preprocessed.replace(/;\s*;/g, ';');
    
    // Extra protection for Rust-specific patterns before general formatting
    preprocessed = preprocessed.replace(/::/g, '__RUST_SCOPE__');
    preprocessed = preprocessed.replace(/(println!|print!|dbg!|vec!|format!)\s*\(/g, '__RUST_MACRO_$1__(');
    preprocessed = preprocessed.replace(/\{\s*:\s*\?\s*\}/g, '__RUST_DEBUG_FMT__');
    preprocessed = preprocessed.replace(/\{\s*:\s*(\w+)\s*\}/g, '__RUST_FMT_$1__');
    
    // Remove semicolons from lines that shouldn't have them in Rust
    // Struct/enum/impl/trait definitions, function signatures, block declarations
    preprocessed = preprocessed.replace(/(struct\s+\w+\s*\{[^}]*\})\s*;/g, '$1');
    preprocessed = preprocessed.replace(/(enum\s+\w+\s*\{[^}]*\})\s*;/g, '$1');
    preprocessed = preprocessed.replace(/(impl\s+[^{]*\{)\s*;/g, '$1');
    preprocessed = preprocessed.replace(/(fn\s+[^{]*\{)\s*;/g, '$1');
    preprocessed = preprocessed.replace(/(\}\s*)\s*;(?=\s*(?:impl|struct|enum|fn|$))/g, '$1');
    
    // Remove semicolons after opening braces
    preprocessed = preprocessed.replace(/(\{)\s*;/g, '$1');
    
    // Remove semicolons after closing braces (except for statements that need them)
    preprocessed = preprocessed.replace(/(\})\s*;(?!\s*(?:else|catch|finally))/g, '$1');
    
    // Add line breaks after semicolons (if not already present)
    preprocessed = preprocessed.replace(/;(?!\s*[\r\n])/g, ';\n');
    
    // Add line breaks around braces (if not already present)
    preprocessed = preprocessed.replace(/\{(?!\s*[\r\n])/g, ' {\n');
    preprocessed = preprocessed.replace(/\}(?!\s*[\r\n])/g, '\n}\n');
    
    // Handle Rust keywords and patterns
    preprocessed = preprocessed.replace(/(fn|struct|enum|impl|trait|if|else|for|while|loop|match|let|const|static)\s+/g, '$1 ');
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
      
      // Skip lines that are just semicolons or standalone colons
      if (trimmed === ';' || trimmed === ':') {
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
    
    let result = formatted
      .join('\n')
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive empty lines
      .replace(/^\n+/, '') // Remove leading newlines
      .replace(/\n*$/, '\n'); // Ensure single trailing newline
    
    // Final cleanup for Rust-specific syntax
    result = result.replace(/__RUST_SCOPE__/g, '::');
    result = result.replace(/__RUST_MACRO_(println!|print!|dbg!|vec!|format!)__/g, '$1');
    result = result.replace(/__RUST_DEBUG_FMT__/g, '{:?}');
    result = result.replace(/__RUST_FMT_(\w+)__/g, '{:$1}');
    
    // Additional cleanup for remaining unwanted semicolons
    result = result.replace(/^(\s*)(struct|enum|impl|fn|trait)\s+[^{]*\{\s*;$/gm, '$1$2');
    result = result.replace(/^(\s*)\}\s*;$/gm, '$1}');
    
    return result;
  }
}
