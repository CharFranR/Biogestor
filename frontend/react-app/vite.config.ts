import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // permitir acceso desde la red (0.0.0.0)
    port: 5173,
    strictPort: true,
    proxy: {
      // Proxy de endpoints del backend durante desarrollo
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/productos': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // Proxy para WebSocket (Channels)
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  }
})
