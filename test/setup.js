import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { setMedia } from './helpers'

// Every test runs against the fixture program. The real one is checked for
// shape in data.test.js.
vi.mock('../src/data', () => import('./fixtures/program'))

// jsdom has no layout, media queries, or observers. Give the app the handful
// it touches, reset per test so one test's viewport never leaks into the next.
beforeEach(() => {
  localStorage.clear()
  setMedia()
  window.ResizeObserver = class {
    observe() {}
    disconnect() {}
  }
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  document.documentElement.removeAttribute('style')
})
