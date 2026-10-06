// The emergency-exit service worker. Not part of the app bundle: when
// KILL_SERVICE_WORKER is set in vite.config.js this file is published as
// sw.js in place of the real worker. Every installed copy picks it up on its
// next update check, and it removes this app's worker and caches.
//
// It only deletes caches named for its own scope. Cache Storage is shared by
// the whole origin, and other paths on the domain may keep caches of their own.
// It also leaves open pages alone. They keep running what they have loaded and
// get the plain, worker-free site on their next launch.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      const own = names.filter((name) => name.includes(self.registration.scope))
      await Promise.all(own.map((name) => caches.delete(name)))
      await self.registration.unregister()
    })()
  )
})
