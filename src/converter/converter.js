// Professional Code Converter - Supports 10 Programming Languages
import { JavaScriptConverter } from './languages/javascript.js';
import { PythonConverter } from './languages/python.js';
import { JavaConverter } from './languages/java.js';
import { TypeScriptConverter } from './languages/typescript.js';
import { CSharpConverter } from './languages/csharp.js';
import { CppConverter } from './languages/cpp.js';
import { PhpConverter } from './languages/php.js';
import { GoConverter } from './languages/go.js';
import { RustConverter } from './languages/rust.js';
import { KotlinConverter } from './languages/kotlin.js';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extension: 'js' },
  { value: 'python', label: 'Python', extension: 'py' },
  { value: 'java', label: 'Java', extension: 'java' },
  { value: 'typescript', label: 'TypeScript', extension: 'ts' },
  { value: 'csharp', label: 'C#', extension: 'cs' },
  { value: 'cpp', label: 'C++', extension: 'cpp' },
  { value: 'php', label: 'PHP', extension: 'php' },
  { value: 'go', label: 'Go', extension: 'go' },
  { value: 'rust', label: 'Rust', extension: 'rs' },
  { value: 'kotlin', label: 'Kotlin', extension: 'kt' }
];

// Language converters
const CONVERTERS = {
  javascript: JavaScriptConverter,
  python: PythonConverter,
  java: JavaConverter,
  typescript: TypeScriptConverter,
  csharp: CSharpConverter,
  cpp: CppConverter,
  php: PhpConverter,
  go: GoConverter,
  rust: RustConverter,
  kotlin: KotlinConverter
};

// Main conversion function
export function convertCode(sourceCode, fromLang, toLang) {
  if (!sourceCode?.trim()) {
    throw new Error('Please provide source code to convert');
  }

  if (fromLang === toLang) {
    throw new Error('Source and target languages must be different');
  }

  const fromConverter = CONVERTERS[fromLang];
  const toConverter = CONVERTERS[toLang];

  if (!fromConverter || !toConverter) {
    throw new Error(`Conversion between ${fromLang} and ${toLang} is not supported`);
  }

  try {
    // Step 1: Parse source code to intermediate representation (optimized for large files)
    const sourceConverter = new fromConverter();
    const ast = sourceConverter.parseToAST(sourceCode);
    
    // Step 2: Convert to target language (optimized conversion)
    const targetConverter = new toConverter();
    const targetCode = targetConverter.generateFromAST(ast);
    
    // Step 3: Professional formatting without excessive comments
    const formattedCode = targetConverter.formatCode(targetCode);
    
    // Ensure we have valid formatted code
    if (!formattedCode || typeof formattedCode !== 'string') {
      throw new Error('Code formatting failed - invalid output');
    }
    
    return {
      code: formattedCode,
      warnings: [...sourceConverter.getWarnings(), ...targetConverter.getWarnings()]
    };
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`);
  }
}

// Utility functions
export function getSupportedConversions() {
  const conversions = [];
  for (const from of SUPPORTED_LANGUAGES) {
    for (const to of SUPPORTED_LANGUAGES) {
      if (from.value !== to.value) {
        conversions.push({
          from: from.value,
          to: to.value,
          fromLabel: from.label,
          toLabel: to.label
        });
      }
    }
  }
  return conversions;
}

export function isConversionSupported(fromLang, toLang) {
  return CONVERTERS[fromLang] && CONVERTERS[toLang] && fromLang !== toLang;
}

export function getLanguageInfo(langCode) {
  return SUPPORTED_LANGUAGES.find(lang => lang.value === langCode);
}

// JavaScript to Python conversion
function convertJavaScriptToPython(code) {
  let result = code;
  
  // Function definitions
  result = result.replace(/function\s+(\w+)\s*\((.*?)\)\s*\{/g, 'def $1($2):');
  
  // Console.log
  result = result.replace(/console\.log\s*\((.*?)\);?/g, 'print($1)');
  
  // Comments
  result = result.replace(/\/\/(.*)/g, '#$1');
  
  // Template literals (basic)
  result = result.replace(/`([^`]*\$\{[^}]*\}[^`]*)`/g, (match, content) => {
    return 'f"' + content.replace(/\$\{([^}]+)\}/g, '{$1}') + '"';
  });
  
  // For loops
  result = result.replace(/for\s*\(\s*let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\w+);\s*\1\+\+\s*\)\s*\{/g, 'for $1 in range($2):');
  result = result.replace(/for\s*\(\s*let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\d+);\s*\1\+\+\s*\)\s*\{/g, 'for $1 in range($2):');
  
  // While loops
  result = result.replace(/while\s*\((.*?)\)\s*\{/g, 'while $1:');
  
  // If statements
  result = result.replace(/if\s*\((.*?)\)\s*\{/g, 'if $1:');
  result = result.replace(/\}\s*else\s+if\s*\((.*?)\)\s*\{/g, 'elif $1:');
  result = result.replace(/\}\s*else\s*\{/g, 'else:');
  
  // Boolean values
  result = result.replace(/\btrue\b/g, 'True');
  result = result.replace(/\bfalse\b/g, 'False');
  result = result.replace(/\bnull\b/g, 'None');
  
  // Remove braces and semicolons, fix indentation
  const lines = result.split('\n');
  const processedLines = [];
  let indentLevel = 0;
  
  for (let line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
      continue;
    }
    
    if (trimmedLine.endsWith(':')) {
      processedLines.push('    '.repeat(indentLevel) + trimmedLine);
      indentLevel++;
    } else if (trimmedLine) {
      const cleanLine = trimmedLine.replace(/;$/, '');
      processedLines.push('    '.repeat(indentLevel) + cleanLine);
    } else {
      processedLines.push('');
    }
  }
  
  return processedLines.join('\n');
}

// Basic implementations for other language pairs
function convertPythonToJava(code) {
  let result = convertPythonToJavaScript(code);
  
  // Convert to Java syntax
  result = result.replace(/function\s+(\w+)\s*\((.*?)\)\s*\{/g, 'public static void $1($2) {');
  result = result.replace(/console\.log\s*\((.*?)\);?/g, 'System.out.println($1);');
  result = result.replace(/let\s+(\w+)/g, 'int $1');
  
  // Wrap in a class
  const lines = result.split('\n');
  const wrappedLines = [
    'public class Main {',
    ...lines.map(line => line ? '    ' + line : line),
    '}'
  ];
  
  return wrappedLines.join('\n');
}

function convertJavaToPython(code) {
  let result = code;
  
  // Remove class wrapper and access modifiers
  result = result.replace(/public\s+class\s+\w+\s*\{/, '');
  result = result.replace(/public\s+static\s+void\s+(\w+)\s*\((.*?)\)\s*\{/g, 'def $1($2):');
  result = result.replace(/System\.out\.println\s*\((.*?)\);?/g, 'print($1)');
  result = result.replace(/\/\/(.*)/g, '#$1');
  
  // Remove final closing brace and fix indentation
  const lines = result.split('\n');
  let processedLines = [];
  let indentLevel = 0;
  
  for (let line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '}' && indentLevel === 0) continue; // Skip class closing brace
    
    if (trimmedLine === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
      continue;
    }
    
    if (trimmedLine.endsWith(':')) {
      processedLines.push('    '.repeat(indentLevel) + trimmedLine);
      indentLevel++;
    } else if (trimmedLine) {
      const cleanLine = trimmedLine.replace(/;$/, '');
      processedLines.push('    '.repeat(indentLevel) + cleanLine);
    } else {
      processedLines.push('');
    }
  }
  
  return processedLines.join('\n');
}

function convertPythonToCpp(code) {
  let result = convertPythonToJavaScript(code);
  
  // Convert to C++ syntax
  result = result.replace(/function\s+(\w+)\s*\((.*?)\)\s*\{/g, 'void $1($2) {');
  result = result.replace(/console\.log\s*\((.*?)\);?/g, 'std::cout << $1 << std::endl;');
  result = result.replace(/let\s+(\w+)/g, 'int $1');
  
  // Add includes and namespace
  const lines = result.split('\n');
  const wrappedLines = [
    '#include <iostream>',
    '#include <string>',
    'using namespace std;',
    '',
    ...lines,
    '',
    'int main() {',
    '    // Call your functions here',
    '    return 0;',
    '}'
  ];
  
  return wrappedLines.join('\n');
}

function convertCppToPython(code) {
  let result = code;
  
  // Remove includes and using statements
  result = result.replace(/#include\s*<.*?>/g, '');
  result = result.replace(/using\s+namespace\s+\w+;/g, '');
  
  // Convert function definitions
  result = result.replace(/\w+\s+(\w+)\s*\((.*?)\)\s*\{/g, 'def $1($2):');
  
  // Convert cout statements
  result = result.replace(/std::cout\s*<<\s*(.*?)\s*<<\s*std::endl;/g, 'print($1)');
  result = result.replace(/cout\s*<<\s*(.*?)\s*<<\s*endl;/g, 'print($1)');
  
  // Convert comments
  result = result.replace(/\/\/(.*)/g, '#$1');
  
  // Remove main function wrapper and fix indentation
  const lines = result.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && 
           !trimmed.startsWith('#include') && 
           !trimmed.startsWith('using namespace') &&
           !trimmed.includes('int main()') &&
           !trimmed.includes('return 0;');
  });
  
  return convertJavaScriptToPython(lines.join('\n'));
}

// Placeholder implementations for remaining conversions
function convertJavaScriptToJava(code) {
  return convertPythonToJava(convertJavaScriptToPython(code));
}

function convertJavaToJavaScript(code) {
  return convertPythonToJavaScript(convertJavaToPython(code));
}

function convertJavaScriptToCpp(code) {
  return convertPythonToCpp(convertJavaScriptToPython(code));
}

function convertCppToJavaScript(code) {
  return convertPythonToJavaScript(convertCppToPython(code));
}

function convertJavaToCpp(code) {
  return convertPythonToCpp(convertJavaToPython(code));
}

function convertCppToJava(code) {
  return convertPythonToJava(convertCppToPython(code));
}
