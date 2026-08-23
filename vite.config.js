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
    // Giữ cố định URL local để khớp Supabase Auth Redirect URLs.
    // strictPort ngăn Vite âm thầm nhảy sang 5176 nếu cổng bị chiếm.
    port: 5175,
    strictPort: true,
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
