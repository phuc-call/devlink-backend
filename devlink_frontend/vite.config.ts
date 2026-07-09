import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      recharts: 'recharts/es6',
    },
  },
  optimizeDeps: {
    include: ['recharts'],
    force: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/internal': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/oauth2': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      }
    }
  }
})