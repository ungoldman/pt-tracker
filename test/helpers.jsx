import { act, fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../src/App'

/** A Tuesday. The app keys everything off the weekday, so tests pin the date. */
export const TUESDAY = new Date('2026-10-06T12:00:00')

/** Freeze `Date` only, leaving real timers running for Testing Library. */
export function freezeDate(date = TUESDAY) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(date)
}

/**
 * Stub `matchMedia` and the window width. `dark` is the OS theme (the app
 * reads it once at import, so `mountApp` also saves the preference), `reduced`
 * is prefers-reduced-motion, and `width` drives both the lg breakpoint query
 * and the day view's column count.
 */
export function setMedia({ dark = false, reduced = false, width = 1400 } = {}) {
  window.innerWidth = width
  window.matchMedia = (query) => ({
    matches:
      (query.includes('prefers-color-scheme: dark') && dark) ||
      (query.includes('prefers-reduced-motion') && reduced) ||
      (query.includes('min-width: 1024px') && width >= 1024),
    media: query
  })
}

/** Everything the hold timer asks of WebAudio, recording what was played. */
export function fakeAudio() {
  const log = []
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn()
  })
  // A source may only be stopped once, like the real thing.
  const source = (kind) => {
    let stopped = false
    return {
      kind,
      type: '',
      buffer: null,
      onended: null,
      frequency: param(),
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(() => {
        if (stopped) throw new Error('already stopped')
        stopped = true
      })
    }
  }
  class FakeAudioContext {
    constructor() {
      this.currentTime = 0
      this.sampleRate = 8000
      this.destination = {}
      this.resume = vi.fn()
      FakeAudioContext.instances.push(this)
    }
    createGain() {
      return { gain: param(), connect: vi.fn() }
    }
    createOscillator() {
      const node = source('oscillator')
      log.push(node)
      return node
    }
    createBufferSource() {
      const node = source('buffer')
      log.push(node)
      return node
    }
    createBuffer(_channels, length) {
      return { getChannelData: () => new Float32Array(length) }
    }
    createBiquadFilter() {
      return { type: '', frequency: param(), Q: param(), connect: vi.fn() }
    }
    decodeAudioData(data) {
      return Promise.resolve({ decoded: data })
    }
  }
  FakeAudioContext.instances = []
  return { FakeAudioContext, log }
}

/**
 * Mount the whole app on a fixed date with every timer faked. Timers are
 * faked because completion, confetti, auto-advance, and the hold timer all
 * run on them. Step time with `tick`.
 */
export function mountApp({ date = TUESDAY, ...media } = {}) {
  setMedia(media)
  if (media.dark) localStorage.setItem('ptTrackerDarkMode', 'true')
  vi.useFakeTimers()
  vi.setSystemTime(date)
  return render(<App />)
}

export const tick = (ms) => act(() => vi.advanceTimersByTime(ms))

/** Let pending promise callbacks run, inside act. */
export const flush = () => act(() => vi.advanceTimersByTimeAsync(0))

export const click = (el) => fireEvent.click(el)

/** The clickable row for an exercise, by its displayed name. */
export const row = (name, index = 0) => screen.getAllByText(name)[index].closest('[role="button"]')

/** The desktop day pill, which reads as the day name followed by its date. */
export const pill = (day) =>
  screen.getByRole('button', { name: new RegExp(`^${day}\\s?[A-Z][a-z]{2} \\d+$`) })

export const button = (name, index = 0) => screen.getAllByRole('button', { name })[index]

/** Completed storage keys, read back from localStorage. */
export const savedChecks = () =>
  Object.entries(JSON.parse(localStorage.getItem('ptTrackerCompleted')))
    .filter(([, done]) => done)
    .map(([key]) => key.replace(/-[0-9a-z]+$/, ''))
    .sort()

export const savedMoves = () => JSON.parse(localStorage.getItem('ptTrackerMoves'))
