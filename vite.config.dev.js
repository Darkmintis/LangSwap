import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Development configuration
export default defineConfig({
  plugins: [react()],
  
  // Set target to support modern features like import.meta
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    minify: false,
  },
  
  // Base path for local development
  base: '/',
  
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
