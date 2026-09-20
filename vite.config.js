import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Custom dev middleware for /api/chat in local Vite server
function chatApiDevPlugin(env) {
  return {
    name: 'chat-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/chat')) {
          try {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              let parsedBody = {};
              try {
                parsedBody = JSON.parse(body);
              } catch {
                parsedBody = {};
              }

              // Set environment variables from loaded env
              process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
              process.env.GROQ_API_KEY = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

              const mockReq = {
                method: req.method,
                body: parsedBody,
                headers: req.headers
              };

              const mockRes = {
                status(code) {
                  res.statusCode = code;
                  return this;
                },
                setHeader(k, v) {
                  res.setHeader(k, v);
                  return this;
                },
                json(data) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                  return this;
                },
                end() {
                  res.end();
                  return this;
                }
              };

              const handlerModule = await server.ssrLoadModule('/api/chat.js');
              await handlerModule.default(mockReq, mockRes);
            });
            return;
          } catch (err) {
            console.error('Error in /api/chat dev handler:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || `${command === 'serve' ? 'local' : 'build'}-${new Date().toISOString().replace(/[-:.]/g, '')}`),
    },
    plugins: [
      react(),
      tailwindcss(),
      chatApiDevPlugin(env)
    ],
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    server: {
      // Giữ cố định URL local để khớp Supabase Auth Redirect URLs.
      // strictPort ngăn Vite âm thầm nhảy sang 5176 nếu cổng bị chiếm.
      port: 5175,
      strictPort: true,
    }
  };
});
