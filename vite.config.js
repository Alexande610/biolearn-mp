import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  server: {
    proxy: {
      '/api/ai': {
        target: 'https://text.pollinations.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai/, '/openai'),
        headers: {
          'Origin': 'https://text.pollinations.ai',
          'Referer': 'https://text.pollinations.ai/'
        }
      }
    }
  }
})
