import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

// Build de un solo archivo (dist/index.html) para poder alojarlo en cualquier sitio estático.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: { target: 'es2020', cssCodeSplit: false, assetsInlineLimit: 100000000 },
});
