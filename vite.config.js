import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Set target to support modern features like import.meta
  build: {
    target: 'es2020',
    // Output directory
    outDir: 'dist',
    
    // Generate sourcemaps for debugging
    sourcemap: false,
    
    // Minification
    minify: 'terser',
    
    // Terser options for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
    },
    
    // Rollup options for better bundling
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vendor chunk for third-party libraries
          vendor: ['react', 'react-dom'],
          // Monaco editor in separate chunk
          monaco: ['@monaco-editor/react'],
          // Icons in separate chunk
          icons: ['lucide-react'],
        },
        
        // Consistent naming for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash].[ext]';
          }
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          if (/\.(png|jpe?g|gif|svg|ico|webp)$/.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
      
      // External dependencies (if needed for CDN)
      external: [],
    },
    
    // Asset size warnings
    chunkSizeWarningLimit: 1000, // 1MB warning threshold
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Preserve comments in production (remove if not needed)
    cssMinify: true,
  },
  
  // Server configuration for development
  server: {
    port: 3000,
    open: true, // Auto-open browser
    cors: true,
    
    // Hot module replacement
    hmr: {
      overlay: true,
    },
  },
  
  // Preview server for production build testing
  preview: {
    port: 3001,
    open: true,
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@monaco-editor/react',
      'lucide-react',
    ],
    exclude: [],
  },
  
  // CSS preprocessing
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      // Add any CSS preprocessor options if needed
    },
    postcss: {
      // PostCSS plugins can be added here
      plugins: [],
    },
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  
  // Environment variables
  envPrefix: 'VITE_',
  
  // Base path for deployment (adjust for GitHub Pages or other hosting)
  base: './',
  
  // ESBuild options
  esbuild: {
    // Remove console and debugger in production
    drop: ['console', 'debugger'],
    
    // Legal comments handling
    legalComments: 'none',
    
    // Target for better browser support
    target: 'es2020',
  },
  
  // Worker configuration
  worker: {
    format: 'es',
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@converter': '/src/converter',
      '@utils': '/src/utils',
    },
  },
});
