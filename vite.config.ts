import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({mode}) => {
  return {
    // base relativa: necessaria sia per il deploy statico sia per l'app nativa (file://)
    base: './',
    define: {
      // `npm run build:app` (vite build --mode app) attiva la modalità APP a tutto schermo
      // per la build nativa iOS/Android, senza bisogno di alcun file .env.
      'import.meta.env.VITE_APP_MODE': JSON.stringify(mode === 'app' ? 'app' : ''),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
