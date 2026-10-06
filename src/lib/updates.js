import { registerSW } from 'virtual:pwa-register'

/**
 * Service worker registration and the "new version" signal.
 *
 * The worker caches the built app, so it opens offline and a deploy is found
 * by the browser's own update check, which skips the HTTP cache. (GitHub Pages
 * serves index.html with a 10 minute max-age a static site can't change, and
 * an installed home-screen app has no reload button.)
 *
 * A new build installs in the background and then waits. It takes over when
 * the user accepts it via UpdateNotice, or by itself the next time the app is
 * opened after being fully closed. Nothing here reloads a page in use.
 *
 * In dev the plugin swaps in a no-op registerSW, so no worker ever runs there.
 */
let ready = false
let accept = () => {}
const listeners = new Set()

const setReady = (value) => {
  ready = value
  for (const listener of listeners) listener()
}

export function startUpdates() {
  const updateSW = registerSW({
    onNeedRefresh: () => setReady(true),
    onRegisteredSW(_url, registration) {
      // An app resumed from the background doesn't navigate, so the browser
      // doesn't look for a new worker by itself. Ask on every return.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration?.update().catch(() => {})
      })
    }
  })
  // Tells the waiting worker to take over. The page reloads once it has.
  accept = () => updateSW(true)
}

export const subscribeUpdate = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export const isUpdateReady = () => ready
export const acceptUpdate = () => accept()
