import React, { useState, useCallback, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, ArrowRightLeft, AlertTriangle, CheckCircle, Loader2, Code, Trash2, FileText, Heart, X, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import { convertCode, SUPPORTED_LANGUAGES } from './converter/converter';

const LANGUAGES = SUPPORTED_LANGUAGES;

const DEFAULT_EXAMPLES = {
  javascript: `// JavaScript Example - Array Processing
function processData(numbers) {
    const doubled = numbers.map(n => n * 2);
    const filtered = doubled.filter(n => n > 10);
    const sum = filtered.reduce((acc, n) => acc + n, 0);
    return { original: numbers, doubled, filtered, sum };
}

const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const result = processData(data);
console.log("Processing result:", result);`,

  python: `# Python Example - Fibonacci Calculator
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def main():
    print("Fibonacci Calculator")
    numbers = []
    for i in range(10):
        fib_num = fibonacci(i)
        numbers.append(fib_num)
        print(f"F({i}) = {fib_num}")
    
    print(f"Sum of first 10 Fibonacci numbers: {sum(numbers)}")

if __name__ == "__main__":
    main()`,

  java: `// Java Example - Class and Methods
public class Calculator {
    private double result;
    
    public Calculator() {
        this.result = 0.0;
    }
    
    public double add(double a, double b) {
        result = a + b;
        return result;
    }
    
    public double multiply(double a, double b) {
        result = a * b;
        return result;
    }
    
    public static void main(String[] args) {
        Calculator calc = new Calculator();
        System.out.println("5 + 3 = " + calc.add(5, 3));
        System.out.println("4 * 6 = " + calc.multiply(4, 6));
    }
}`,

  typescript: `// TypeScript Example - Generic Functions
interface DataProcessor<T> {
    process(data: T[]): T[];
}

class NumberProcessor implements DataProcessor<number> {
    process(data: number[]): number[] {
        return data
            .filter(n => n > 0)
            .map(n => n * 2)
            .sort((a, b) => a - b);
    }
}

const processor = new NumberProcessor();
const numbers: number[] = [3, -1, 4, 1, -5, 9, 2, -6];
const result = processor.process(numbers);
console.log("Processed numbers:", result);`,

  csharp: `// C# Example - LINQ and Classes
using System;
using System.Linq;
using System.Collections.Generic;

public class Program 
{
    public static void Main() 
    {
        var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
        
        var result = numbers
            .Where(n => n % 2 == 0)
            .Select(n => n * n)
            .Sum();
            
        Console.WriteLine($"Sum of squares of even numbers: {result}");
    }
}`,

  cpp: `// C++ Example - Classes and STL
#include <iostream>
#include <vector>
#include <algorithm>

class MathUtils {
public:
    static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }
    
    static double average(const std::vector<int>& numbers) {
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        return static_cast<double>(sum) / numbers.size();
    }
};

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::cout << "Average: " << MathUtils::average(numbers) << std::endl;
    std::cout << "5! = " << MathUtils::factorial(5) << std::endl;
    return 0;
}`,

  php: `<?php
// PHP Example - Array Operations
class DataAnalyzer {
    private $data;
    
    public function __construct($data) {
        $this->data = $data;
    }
    
    public function analyze() {
        $sum = array_sum($this->data);
        $count = count($this->data);
        $average = $sum / $count;
        $max = max($this->data);
        $min = min($this->data);
        
        return [
            'sum' => $sum,
            'average' => $average,
            'max' => $max,
            'min' => $min,
            'count' => $count
        ];
    }
}

$numbers = [10, 20, 30, 40, 50];
$analyzer = new DataAnalyzer($numbers);
$stats = $analyzer->analyze();

echo "Data Analysis Results:\\n";
foreach ($stats as $key => $value) {
    echo ucfirst($key) . ": " . $value . "\\n";
}
?>`,

  go: `// Go Example - Structs and Methods
package main

import (
    "fmt"
    "sort"
)

type NumberSet struct {
    numbers []int
}

func (ns *NumberSet) Add(num int) {
    ns.numbers = append(ns.numbers, num)
}

func (ns *NumberSet) Sort() {
    sort.Ints(ns.numbers)
}

func (ns *NumberSet) Sum() int {
    total := 0
    for _, num := range ns.numbers {
        total += num
    }
    return total
}

func main() {
    ns := &NumberSet{}
    ns.Add(5)
    ns.Add(2)
    ns.Add(8)
    ns.Add(1)
    
    fmt.Println("Before sort:", ns.numbers)
    ns.Sort()
    fmt.Println("After sort:", ns.numbers)
    fmt.Println("Sum:", ns.Sum())
}`,

  rust: `// Rust Example - Structs and Implementation
struct Calculator {
    history: Vec<f64>,
}

impl Calculator {
    fn new() -> Self {
        Calculator {
            history: Vec::new(),
        }
    }
    
    fn add(&mut self, a: f64, b: f64) -> f64 {
        let result = a + b;
        self.history.push(result);
        result
    }
    
    fn multiply(&mut self, a: f64, b: f64) -> f64 {
        let result = a * b;
        self.history.push(result);
        result
    }
    
    fn get_history(&self) -> &Vec<f64> {
        &self.history
    }
}

fn main() {
    let mut calc = Calculator::new();
    
    let sum = calc.add(10.0, 5.0);
    let product = calc.multiply(3.0, 4.0);
    
    println!("Sum: {}", sum);
    println!("Product: {}", product);
    println!("History: {:?}", calc.get_history());
}`,

  kotlin: `// Kotlin Example - Data Classes and Functions
data class Person(val name: String, val age: Int)

class PersonManager {
    private val people = mutableListOf<Person>()
    
    fun addPerson(person: Person) {
        people.add(person)
    }
    
    fun getAdults(): List<Person> {
        return people.filter { it.age >= 18 }
    }
    
    fun getAverageAge(): Double {
        return if (people.isEmpty()) 0.0 
               else people.map { it.age }.average()
    }
}

fun main() {
    val manager = PersonManager()
    manager.addPerson(Person("Alice", 25))
    manager.addPerson(Person("Bob", 17))
    manager.addPerson(Person("Charlie", 30))
    
    println("Adults: \${manager.getAdults()}")
    println("Average age: \${manager.getAverageAge()}")
}`
};

function App() {
  const [sourceCode, setSourceCode] = useState('');
  const [convertedCode, setConvertedCode] = useState('');
  const [fromLanguage, setFromLanguage] = useState('python');
  const [toLanguage, setToLanguage] = useState('javascript');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  
  // Detect mobile device dynamically
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Update mobile detection on window resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!sourceCode.trim()) {
      setError('Please enter some code to convert');
      return;
    }

    if (fromLanguage === toLanguage) {
      setError('Please select different source and target languages');
      return;
    }

    setIsConverting(true);
    setError('');
    setWarnings([]);
    setSuccessMessage('');

    try {
      // Add delay for better UX
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const result = convertCode(sourceCode, fromLanguage, toLanguage);
      
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid conversion result');
      }
      
      setConvertedCode(result.code || '');
      
      // Ensure warnings is always an array
      const warnings = Array.isArray(result.warnings) ? result.warnings : [];
      setWarnings(warnings);
      
      setSuccessMessage('Code converted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message || 'An unexpected error occurred during conversion');
      setConvertedCode('');
      setWarnings([]);
    } finally {
      setIsConverting(false);
    }
  }, [sourceCode, fromLanguage, toLanguage]);

  const copyToClipboard = useCallback(async () => {
    if (!convertedCode) return;
    
    try {
      await navigator.clipboard.writeText(convertedCode);
      setSuccessMessage('Copied to clipboard!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  }, [convertedCode]);

  // Crypto support functionality
  const POLYGON_ADDRESS = "0x742d35Cc6734C0532925A3b8D9DF9F5A5a53c8A2"; // Replace with your actual Polygon address

  const copyCryptoAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(POLYGON_ADDRESS);
      setSuccessMessage('Address copied to clipboard!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError('Failed to copy address');
    }
  }, []);

  const clearAll = useCallback(() => {
    setSourceCode('');
    setConvertedCode('');
    setError('');
    setWarnings([]);
    setSuccessMessage('');
  }, []);

  const swapLanguages = useCallback(() => {
    if (!convertedCode) return;
    
    setFromLanguage(toLanguage);
    setToLanguage(fromLanguage);
    setSourceCode(convertedCode);
    setConvertedCode(sourceCode);
    setError('');
    setWarnings([]);
  }, [fromLanguage, toLanguage, sourceCode, convertedCode]);

  const loadExample = useCallback(() => {
    const example = DEFAULT_EXAMPLES[fromLanguage] || DEFAULT_EXAMPLES.python;
    setSourceCode(example);
    setError('');
    setWarnings([]);
    setConvertedCode('');
  }, [fromLanguage]);

  const currentFromLang = useMemo(() => 
    LANGUAGES.find(l => l.value === fromLanguage), [fromLanguage]
  );
  
  const currentToLang = useMemo(() => 
    LANGUAGES.find(l => l.value === toLanguage), [toLanguage]
  );

  const isConvertDisabled = useMemo(() => 
    isConverting || !sourceCode.trim() || fromLanguage === toLanguage,
    [isConverting, sourceCode, fromLanguage, toLanguage]
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-top">
            <div></div>
            <div className="logo-section">
              <Code className="logo-icon" size={32} />
              <h1 className="app-title">LangSwap</h1>
            </div>
            <button 
              className="support-button"
              onClick={() => setShowSupportPopup(true)}
              title="Support the project"
            >
              <Heart size={18} />
              Support
            </button>
          </div>
          <p className="app-subtitle">
            Professional code converter supporting 10 programming languages
          </p>
          <div className="supported-languages">
            {LANGUAGES.map((lang, index) => (
              <span key={lang.value} className="language-badge">
                {lang.label}
                {index < LANGUAGES.length - 1 && <span className="separator">•</span>}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="converter-container">
          {/* Language Selection */}
          <div className="language-selection">
            <div className="language-group">
              <label htmlFor="from-language">Source Language</label>
              <select 
                id="from-language"
                value={fromLanguage} 
                onChange={(e) => setFromLanguage(e.target.value)}
                disabled={isConverting}
                className="language-select"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>

            <button 
              className="swap-button" 
              onClick={swapLanguages}
              disabled={isConverting || !convertedCode}
              title="Swap languages and code"
            >
              <ArrowRightLeft size={20} />
            </button>

            <div className="language-group">
              <label htmlFor="to-language">Target Language</label>
              <select 
                id="to-language"
                value={toLanguage} 
                onChange={(e) => setToLanguage(e.target.value)}
                disabled={isConverting}
                className="language-select"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              className="primary-button"
              onClick={handleConvert} 
              disabled={isConvertDisabled}
            >
              {isConverting ? (
                <>
                  <Loader2 className="spinning" size={18} />
                  Converting...
                </>
              ) : (
                <>
                  <ArrowRightLeft size={18} />
                  Convert Code
                </>
              )}
            </button>
            
            <button 
              className="secondary-button"
              onClick={loadExample}
              disabled={isConverting}
              title="Load example code"
            >
              <FileText size={18} />
              Example
            </button>
            
            <button 
              className="secondary-button"
              onClick={clearAll}
              disabled={isConverting}
              title="Clear all content"
            >
              <Trash2 size={18} />
              Clear
            </button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="message error-message">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="message success-message">
              <CheckCircle size={20} />
              <span>{successMessage}</span>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="message warning-message">
              <AlertTriangle size={20} />
              <div>
                <strong>Conversion Notes:</strong>
                <ul>
                  {warnings.map((warning, index) => {
                    let warningText = '';
                    if (typeof warning === 'string') {
                      warningText = warning;
                    } else if (warning && typeof warning === 'object' && warning.message) {
                      warningText = warning.message;
                    } else {
                      warningText = String(warning || 'Unknown warning');
                    }
                    
                    return (
                      <li key={index}>{warningText}</li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Code Editors */}
          <div className="editors-container">
            <div className="editor-panel">
              <div className="editor-header">
                <h3>Source Code ({currentFromLang?.label})</h3>
                <div className="editor-stats">
                  <span>Lines: {sourceCode.split('\n').length}</span>
                  <span>Characters: {sourceCode.length}</span>
                </div>
              </div>
              <div className="editor-wrapper">
                <Editor
                  height="450px"
                  language={fromLanguage === 'csharp' ? 'csharp' : 
                           fromLanguage === 'cpp' ? 'cpp' : fromLanguage}
                  value={sourceCode}
                  onChange={(value) => setSourceCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    readOnly: isConverting,
                    tabSize: 2,
                    insertSpaces: true,
                    detectIndentation: true,
                    folding: true,
                    bracketMatching: 'always',
                    smoothScrolling: true
                  }}
                  loading={
                    <div className="editor-loading">
                      <Loader2 className="spinning" size={24} />
                      <span>Loading editor...</span>
                    </div>
                  }
                />
              </div>
            </div>

            <div className="editor-panel">
              <div className="editor-header">
                <h3>Converted Code ({currentToLang?.label})</h3>
                <div className="editor-actions">
                  {convertedCode && (
                    <button 
                      className="copy-button"
                      onClick={copyToClipboard}
                      title="Copy converted code to clipboard"
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                  )}
                  <div className="editor-stats">
                    <span>Lines: {convertedCode.split('\n').length}</span>
                    <span>Characters: {convertedCode.length}</span>
                  </div>
                </div>
              </div>
              <div className="editor-wrapper">
                <Editor
                  height="450px"
                  language={toLanguage === 'csharp' ? 'csharp' : 
                           toLanguage === 'cpp' ? 'cpp' : toLanguage}
                  value={convertedCode}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    readOnly: true,
                    tabSize: 2,
                    insertSpaces: true,
                    detectIndentation: true,
                    folding: true,
                    bracketMatching: 'always',
                    smoothScrolling: true
                  }}
                  loading={
                    <div className="editor-loading">
                      <Loader2 className="spinning" size={24} />
                      <span>Loading editor...</span>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-bottom">
          <p>&copy; 2025 LangSwap. Built for developers, by developers.</p>
        </div>
      </footer>

      {/* Support Popup */}
      {showSupportPopup && (
        <div className="popup-overlay" onClick={() => setShowSupportPopup(false)}>
          <div className="support-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Support LangSwap</h3>
              <button 
                className="close-button"
                onClick={() => setShowSupportPopup(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="popup-content">
              {!isMobile && (
                <p className="support-message">
                  Help keep LangSwap free and open source! Send crypto donations via Polygon network.
                </p>
              )}
              
              <div className="qr-section">
                <div className="qr-container">
                  <QRCode 
                    value={POLYGON_ADDRESS}
                    size={isMobile ? 120 : 150}
                    style={{ 
                      height: "auto", 
                      maxWidth: "100%", 
                      width: "100%",
                      backgroundColor: "#0d1117",
                      padding: "8px",
                      borderRadius: "8px"
                    }}
                    fgColor="#f0f6fc"
                    bgColor="#0d1117"
                  />
                  {!isMobile && <p className="qr-label">Scan with crypto wallet</p>}
                </div>
              </div>
              
              <div className="address-section">
                <label>Polygon Address:</label>
                <div className="address-container">
                  <input 
                    type="text" 
                    value={POLYGON_ADDRESS}
                    readOnly
                    className="address-input"
                  />
                  <button 
                    className="copy-address-btn"
                    onClick={copyCryptoAddress}
                    title="Copy address"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              {!isMobile && (
                <div className="support-note">
                  <p>
                    <strong>Network:</strong> Polygon (MATIC)<br />
                    <strong>Supported:</strong> MATIC, USDT, USDC, ETH, ERC-20 tokens
                  </p>
                </div>
              )}
              
              {isMobile && (
                <div className="mobile-note">
                  <p><strong>Polygon Network</strong> • MATIC, USDT, USDC, ETH</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
