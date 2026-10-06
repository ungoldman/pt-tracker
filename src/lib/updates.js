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
 * opened after being fully closed. Nothing here reloads a page on its own.
 * Accepting in one tab does reload any other open tab, since the worker is
 * shared and a page must not outlive the build it was loaded from.
 *
 * In dev the plugin swaps in a no-op registerSW, so no worker ever runs there.
 */

// 0 until a new build is found. Bumped again on each later build and on each
// return to the foreground, so a dismissed notice comes back.
let notice = 0
let accept = () => {}
const listeners = new Set()

const announce = () => {
  notice += 1
  for (const listener of listeners) listener()
}

export function startUpdates() {
  let registration = null
  const updateSW = registerSW({
    onNeedRefresh: announce,
    onRegisteredSW(_url, registered) {
      registration = registered
      // An app resumed from the background doesn't navigate, so the browser
      // doesn't look for a new worker by itself. Ask on every return. iOS
      // home-screen apps don't reliably fire visibilitychange, hence pageshow.
      const onReturn = () => {
        if (document.visibilityState !== 'visible') return
        registration?.update().catch(() => {})
        if (notice > 0) announce()
      }
      document.addEventListener('visibilitychange', onReturn)
      window.addEventListener('pageshow', onReturn)
    }
  })
  accept = () => {
    // A page no worker controls yet (the first visit, or after a hard reload)
    // never holds a new worker in waiting: it activates straight away and
    // there is nothing to message. A reload is all that page needs.
    if (registration?.waiting) updateSW(true)
    else window.location.reload()
  }
}

export const subscribeUpdate = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export const updateNotice = () => notice
export const acceptUpdate = () => accept()
