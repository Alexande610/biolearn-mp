import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'fixture-routes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/admin' || req.url === '/admin/logs') req.url = '/tests/ui/index.html';
        next();
      });
    },
  }],
  resolve: { alias: [{ find: /^(?:\.\.\/lib\/supabase|\.\/supabase)$/, replacement: fileURLToPath(new URL('./supabase.js', import.meta.url)) }] },
  server: { host: '127.0.0.1', port: 5186, strictPort: true },
});
