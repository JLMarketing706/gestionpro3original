import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    plugins: [
      react(),
     VitePWA({
  registerType: 'autoUpdate',
  injectRegister: false, // Evita que el plugin registre el SW por su cuenta
  manifest: false,
  includeAssets: ['manifest.webmanifest'],
  strategies: 'injectManifest', // No genera un SW automático
  srcDir: 'public',
  filename: 'service-worker.js',
}),

    ],
  };
});

