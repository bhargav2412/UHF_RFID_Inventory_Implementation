import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';

const requestLoggerPlugin = () => ({
  name: 'request-logger',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const ip = req.socket?.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown IP';
      console.log(`[Dev Server] ${req.method} ${req.originalUrl} from IP: ${ip}`);
      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), requestLoggerPlugin()],
  css: {
    postcss: {
      plugins: [tailwindcss()]
    }
  },
  // base: '/metronic/tailwind/react',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    chunkSizeWarningLimit: 3000
  }
});
