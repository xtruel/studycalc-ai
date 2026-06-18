// Build "single file" SOLO per test rapido: produce un unico index.html autonomo
// (JS, CSS e font inline) che si apre con doppio click via file:// senza server.
// Non è la build usata per iOS/Android (quella resta `npm run build:app`).
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(() => ({
  base: './',
  define: {
    'import.meta.env.VITE_APP_MODE': JSON.stringify('app'),
  },
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  build: { outDir: 'dist-standalone', assetsInlineLimit: 100000000 },
}));
