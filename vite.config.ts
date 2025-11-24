import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(() => {
  // Custom domain is configured, use root path
  const base = process.env.GITHUB_PAGES === 'true' ? '/' : '/'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', '.nojekyll', 'CNAME'],
        manifest: {
          name: 'PCAL - Parent-Child Activity Log',
          short_name: 'PCAL',
          description: '100% Offline Parent-Child Activity Tracking for Head Start Programs',
          theme_color: '#2563eb',
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
