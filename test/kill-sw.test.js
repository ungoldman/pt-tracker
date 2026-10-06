import { beforeEach, describe, expect, it, vi } from 'vitest'

// The kill worker is a plain script that talks to the worker global. Stand one
// up, load the script, and fire its lifecycle events by hand.
let handlers
let worker
let cacheNames

beforeEach(async () => {
  vi.resetModules()
  handlers = {}
  cacheNames = [
    'workbox-precache-v2-https://example.test/pt-tracker/',
    'https://example.test/pt-tracker/-runtime',
    'someone-elses-cache',
    'workbox-precache-v2-https://example.test/blog/'
  ]
  worker = {
    addEventListener: (type, handler) => {
      handlers[type] = handler
    },
    skipWaiting: vi.fn(),
    registration: {
      scope: 'https://example.test/pt-tracker/',
      unregister: vi.fn(() => Promise.resolve(true))
    }
  }
  vi.stubGlobal('self', worker)
  vi.stubGlobal('caches', {
    keys: () => Promise.resolve([...cacheNames]),
    delete: vi.fn((name) => {
      cacheNames = cacheNames.filter((n) => n !== name)
      return Promise.resolve(true)
    })
  })
  await import('../src/kill-sw.js')
})

describe('kill-sw', () => {
  it('takes over without waiting', () => {
    handlers.install()
    expect(worker.skipWaiting).toHaveBeenCalledTimes(1)
  })

  it('deletes only the caches named for its own scope, then unregisters', async () => {
    let work
    handlers.activate({ waitUntil: (promise) => (work = promise) })
    await work
    expect(cacheNames).toEqual([
      'someone-elses-cache',
      'workbox-precache-v2-https://example.test/blog/'
    ])
    expect(worker.registration.unregister).toHaveBeenCalledTimes(1)
  })
})
