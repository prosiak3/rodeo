import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://zpbhwjnuqiomuufscvho.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYmh3am51cWlvbXV1ZnNjdmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNjkxNDUsImV4cCI6MjA3NTY0NTE0NX0.S1zwrdxL6L9gzGIORwMk00CVNM8_tg5EnLMGwqsWmks'),
  },
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
