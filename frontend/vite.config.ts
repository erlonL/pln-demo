import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/pln-demo/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Além das Palavras — Detector de Persuasão',
        short_name: 'Além das Palavras',
        description: 'Detector experimental de técnicas persuasivas em português, executado no navegador.',
        theme_color: '#f4efe5',
        background_color: '#f4efe5',
        display: 'standalone',
        lang: 'pt-BR',
        start_url: '/pln-demo/',
        scope: '/pln-demo/',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        globIgnores: ['models/**/*', 'banner.png'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('ort-wasm'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'alem-das-palavras:ort-runtime:v1',
              expiration: { maxEntries: 2, maxAgeSeconds: 31_536_000 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: { reporter: ['text', 'html'] },
  },
  worker: { format: 'es' },
  build: { target: 'es2022', sourcemap: true },
})
