import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/bolls': {
        target: 'https://bolls.life',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bolls/, ''),
      },
    },
  },
})
