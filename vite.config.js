import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Emergency exit. Set to true and deploy to replace the service worker with
// src/kill-sw.js, which unregisters itself and deletes this app's caches on
// every phone. The build then ships no worker registration at all. Leave it
// deployed until each installed copy has opened once while online. The file
// must keep the name sw.js for as long as any copy is installed: a client only
// ever checks the URL it registered, so a renamed or removed worker strands it.
const KILL_SERVICE_WORKER = false

const killWorker = () => ({
  name: 'kill-service-worker',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'sw.js',
      source: readFileSync(new URL('./src/kill-sw.js', import.meta.url), 'utf8')
    })
  }
})

export default defineConfig({
  base: '/pt-tracker/',
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.{js,jsx}'],
    setupFiles: ['test/setup.js'],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      // The entry only mounts the app and starts the worker registration.
      exclude: ['src/main.jsx'],
      reporter: ['text'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 }
    }
  },
  plugins: [
    react(),
    VitePWA({
      // Disabled, the plugin builds no worker and its registerSW is a no-op.
      disable: KILL_SERVICE_WORKER,
      // A new build waits until the user accepts it (src/lib/updates.js) or
      // every copy of the app is closed. It never takes over a running page.
      registerType: 'prompt',
      injectRegister: false,
      // public/manifest.webmanifest is the manifest. Don't generate a second.
      manifest: false,
      workbox: {
        // The whole app, including the timer's bowl recordings, for offline use.
        globPatterns: ['**/*.{js,css,html,svg,m4a,webmanifest}'],
        cleanupOutdatedCaches: true
      }
    }),
    KILL_SERVICE_WORKER && killWorker()
  ]
})
