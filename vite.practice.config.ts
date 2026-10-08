import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./practice', import.meta.url)),
  base: './',
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  define: { 'process.env.NEXT_PUBLIC_PRACTICE_MODE': JSON.stringify('local') },
  css: { postcss: fileURLToPath(new URL('.', import.meta.url)) },
  build: { outDir: fileURLToPath(new URL('./docs', import.meta.url)), emptyOutDir: true },
});
