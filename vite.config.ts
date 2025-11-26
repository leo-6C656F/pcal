import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(() => {
  // Custom domain is configured, use root path
  const base = process.env.GITHUB_PAGES === 'true' ? '/' : '/'

  // Generate build timestamp
  const buildTimestamp = new Date().toISOString()

  return {
    base,
    define: {
      '__BUILD_TIMESTAMP__': JSON.stringify(buildTimestamp),
    },
    optimizeDeps: {
      exclude: ['@huggingface/transformers'],
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'robots.txt', 'apple-touch-icon.png', 'icon.svg', '.nojekyll', 'CNAME'],
        manifest: {
          name: 'PCAL - Parent-Child Activity Log',
          short_name: 'PCAL',
          description: '100% Offline Parent-Child Activity Tracking for Head Start Programs',
          theme_color: '#4F46E5',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            {
              src: base === '/' ? '/icon-192x192.png' : `${base}icon-192x192.png`,
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: base === '/' ? '/icon-512x512.png' : `${base}icon-512x512.png`,
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'openai-api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
}
})
