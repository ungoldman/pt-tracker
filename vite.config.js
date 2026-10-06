import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Emergency exit. Set to true and deploy to ship a service worker that
// unregisters itself and deletes its caches on every phone, then leave it
// deployed until each installed copy has opened once. The file must keep the
// name sw.js for as long as any copy is installed: a client only ever checks
// the URL it registered, so a renamed or removed worker strands it.
const KILL_SERVICE_WORKER = false

export default defineConfig({
  base: '/pt-tracker/',
  plugins: [
    react(),
    VitePWA({
      // A new build waits until the user accepts it (src/lib/updates.js) or
      // every copy of the app is closed. It never takes over a running page.
      registerType: 'prompt',
      injectRegister: false,
      selfDestroying: KILL_SERVICE_WORKER,
      // public/manifest.webmanifest is the manifest. Don't generate a second.
      manifest: false,
      workbox: {
        // The whole app, including the timer's bowl recordings, for offline use.
        globPatterns: ['**/*.{js,css,html,svg,m4a,webmanifest}'],
        cleanupOutdatedCaches: true
      }
    })
  ]
})
