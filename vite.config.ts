import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
    include: ['onnxruntime-web'],
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'transformers': ['@xenova/transformers'],
        },
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});
