# LangSwap - Professional Code Converter

A professional, production-ready code converter supporting 10 programming languages with advanced AST parsing and real-time conversion capabilities.

## 🚀 Features

### Supported Languages
- **JavaScript** - ES6+, modern syntax
- **Python** - Python 3.x with advanced features
- **Java** - Java 8+ with OOP support
- **TypeScript** - Full type system support
- **C#** - .NET framework compatible
- **C++** - Modern C++ standards
- **PHP** - PHP 7+ with classes
- **Go** - Go modules and concurrency
- **Rust** - Ownership and traits
- **Kotlin** - Multiplatform support

### Professional Features
- ⚡ **Real-time Conversion** - Instant code transformation
- 🎨 **Syntax Highlighting** - Monaco Editor (VS Code's editor)
- 🔍 **AST-based Parsing** - Professional code analysis
- 📱 **Responsive Design** - Works on all devices
- 🎯 **Error Handling** - Detailed conversion feedback
- 📋 **Copy to Clipboard** - One-click code copying
- 🔄 **Language Swapping** - Bidirectional conversion
- 📊 **Code Statistics** - Line and character counts
- 🌙 **Dark Theme** - Developer-friendly interface
- ♿ **Accessibility** - WCAG compliant

## 🛠️ Technology Stack

- **Frontend**: React 18 with Hooks
- **Editor**: Monaco Editor (VS Code)
- **Build Tool**: Vite with optimizations
- **Icons**: Lucide React
- **Styling**: Modern CSS with variables
- **Parsing**: Custom AST converters

## 📦 Quick Start

### Prerequisites
- Node.js 16+ 
- npm 8+

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd langswap

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development
```bash
# Start development server (auto-reload)
npm run dev

# Build for production
npm run build:production

# Preview production build
npm run preview:production

# Clean build directory
npm run clean:win
```

## 🚀 Production Deployment

### Build for Production
```bash
# Create optimized production build
npm run build:production

# The built files will be in the 'dist' directory
```

### Deployment Options

#### 1. **Netlify** (Recommended)
```bash
# Build command: npm run build:production
# Publish directory: dist
# Node version: 18
```

#### 2. **Vercel**
```bash
# Framework Preset: Vite
# Build Command: npm run build:production
# Output Directory: dist
```

#### 3. **GitHub Pages**
```bash
# Build and deploy
npm run build:production

# Upload 'dist' folder contents to gh-pages branch
# Enable GitHub Pages in repository settings
```

#### 4. **Static File Hosting**
```bash
# Build the project
npm run build:production

# Upload contents of 'dist' folder to any static hosting:
# - AWS S3 + CloudFront
# - Firebase Hosting
# - Surge.sh
# - Cloudflare Pages
```

### Environment Configuration
```bash
# For custom deployment paths, update vite.config_production.js:
base: '/your-subdirectory/', # For subdirectory deployments
```

## 🔧 Performance Optimizations

### Bundle Optimization
- **Code Splitting** - Vendor, Monaco, and Icons in separate chunks
- **Tree Shaking** - Removes unused code
- **Minification** - Terser with advanced compression
- **Asset Optimization** - Optimized images and fonts

### Loading Performance
- **Lazy Loading** - Components loaded on demand
- **Service Worker** - Caching for offline access
- **Compression** - Gzip/Brotli compression ready
- **CDN Ready** - Static assets optimized for CDN

### Browser Support
- **Modern Browsers** - Chrome 90+, Firefox 88+, Safari 14+
- **ES2015 Target** - Optimized for modern JavaScript
- **Progressive Enhancement** - Graceful degradation

## 📁 Project Structure

```
langswap/
├── public/                 # Static assets
│   ├── favicon.ico
│   └── manifest.json
├── src/                    # Source code
│   ├── converter/          # Conversion engine
│   │   ├── converter.js    # Main converter
│   │   ├── BaseLanguageConverter.js
│   │   └── languages/      # Language-specific converters
│   │       ├── javascript.js
│   │       ├── python.js
│   │       ├── java.js
│   │       ├── typescript.js
│   │       ├── csharp.js
│   │       ├── cpp.js
│   │       ├── php.js
│   │       ├── go.js
│   │       ├── rust.js
│   │       └── kotlin.js
│   ├── App.jsx             # Main React component
│   ├── main.jsx            # React entry point
│   └── index.css           # Global styles
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.js          # Development config
├── vite.config_production.js # Production config
└── README.md               # This file
```

## 🔍 Conversion Engine

### Architecture
The conversion engine uses a modular architecture with:

1. **BaseLanguageConverter** - Core conversion logic
2. **Language-Specific Converters** - Individual language implementations
3. **AST Parsing** - Abstract Syntax Tree analysis
4. **Rule-Based Conversion** - Language-specific transformation rules

### Adding New Languages
```javascript
// Create new converter in src/converter/languages/
import BaseLanguageConverter from '../BaseLanguageConverter.js';

export default class NewLanguageConverter extends BaseLanguageConverter {
  parseToAST(code) {
    // Language-specific parsing logic
  }
  
  convertFromAST(ast, targetLanguage) {
    // Conversion logic
  }
}

// Register in src/converter/converter.js
import NewLanguageConverter from './languages/newlanguage.js';
```

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build directory
npm run clean:win
npm run build:production
```

#### Monaco Editor Loading
```bash
# Ensure Monaco Editor worker files are properly loaded
# Check browser console for worker loading errors
```

#### Conversion Errors
```bash
# Check specific language converter implementations
# Verify input code syntax is valid
# Review browser console for detailed error messages
```

### Performance Issues
```bash
# Analyze bundle size
npm run analyze

# Check for memory leaks in browser DevTools
# Monitor network requests in production
```

## 📊 Analytics & Monitoring

### Production Monitoring
- **Error Tracking** - Browser console errors
- **Performance Metrics** - Core Web Vitals
- **Usage Analytics** - Conversion patterns
- **Bundle Analysis** - Size optimization

### Recommended Tools
- **Sentry** - Error tracking
- **Google Analytics** - Usage metrics
- **Lighthouse** - Performance auditing
- **Bundle Analyzer** - Size analysis

## 🔐 Security

### Content Security Policy
```html
<!-- Add to index.html for enhanced security -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self';">
```

### Best Practices
- ✅ No eval() usage
- ✅ Sanitized input handling
- ✅ HTTPS deployment
- ✅ Regular dependency updates

## 📜 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- 📧 Email: support@langswap.dev
- 🐛 Issues: GitHub Issues
- 📖 Docs: README.md

---

**LangSwap** - Professional code conversion made simple. Built for developers, by developers.
