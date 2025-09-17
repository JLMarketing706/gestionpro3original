// Cambio menor para forzar deploy en develop
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    // Vite expone automáticamente las variables que empiezan con VITE_
    // No es necesario definirlas manualmente aquí
    // Si necesitas exponer más variables, agrégalas en .env con el prefijo VITE_
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    plugins: [
      react(),
    ],
  };
});

