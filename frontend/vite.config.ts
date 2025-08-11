import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Solo se usa en desarrollo local
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      external: ['xlsx'] // Evita error en el build de Netlify
    }
  }
})

