import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';
import manifest from './webmanifest.json' assert { type: 'json' };

export default defineConfig({
  integrations: [
    react(),
    AstroPWA({
      mode: 'production',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*'],
      workbox: {
        navigateFallback: '/',
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: manifest as any,
    })
  ],
  site: 'https://janaushadhi.oriz.in',
  output: 'static',
  compressHTML: true,
  minify: true,
  buildOptions: {
    contentLayer: {
      compilationStrategy: 'parallel',
      maxWorkers: 4
    }
  },
  // No experimental flags needed for Astro 5
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            utils: ['fuse.js']
          }
        }
      }
    }
  }
});
