import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        strategies: 'generateSW',
        includeAssets: [
          'favicon.svg',
          'icon-*.png',
          'robots.txt',
          'fonts/*.woff2',
          'audio_samples/*.mp3',
        ],
        workbox: {
          globPatterns: [
            '**/*.{js,css,html,woff2,png,svg}',
          ],
          // Aumentar tamanho máximo de cache para 5MB (Phaser é pesado)
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // Não fazer cache-bust para assets imutáveis
          dontCacheBustURLsMatching: /\.(js|css|woff2)$/,
          skipWaiting: true,
          clientsClaim: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@assets': path.resolve(__dirname, 'attached_assets'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Phaser only loads once the player leaves the menu (App.tsx lazy-
          // loads PhaserGame), so splitting it from app code lets browsers
          // cache it independently — it changes far less often than
          // gameplay code. Everything else from node_modules goes into a
          // shared vendor chunk instead of being duplicated per entry point.
          manualChunks(id: string): string | undefined {
            if (id.includes('node_modules/phaser')) return 'phaser';
            if (id.includes('node_modules')) return 'vendor';
            return undefined;
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify-file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
