import { act, fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  button,
  click,
  fakeAudio,
  flush,
  mountApp,
  openSession,
  row,
  savedHistory,
  tick
} from './helpers'

let audio

beforeEach(() => {
  audio = fakeAudio()
  vi.stubGlobal('AudioContext', audio.FakeAudioContext)
  vi.stubGlobal('fetch', () => Promise.reject(new Error('no recordings in tests')))
  navigator.vibrate = vi.fn()
})

const dialog = () => screen.queryByRole('dialog', { name: 'Hold timer' })
const reading = () => dialog().textContent.replace(/\s+/g, ' ')
const startFooter = (label) => click(screen.getByRole('button', { name: label }))
// What the open push session has checked off.
const checked = () =>
  Object.entries(savedHistory()['2026-10-06'].sessions.push.done)
    .filter(([, done]) => done)
    .map(([key]) => key.replace(/-[0-9a-z]+$/, ''))

describe('the hold timer from the footer', () => {
  it.each([false, true])('runs prep, hold, and rest until stopped (dark: %s)', async (dark) => {
    mountApp({ dark })
    startFooter('10s')
    await flush()
    expect(reading()).toContain('10-second holds')
    expect(reading()).toContain('Get ready…')
    expect(reading()).toContain('5')
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeNull()

    tick(2000)
    expect(reading()).toContain('3')
    tick(3000)
    expect(reading()).toContain('Hold — rep 1')
    expect(navigator.vibrate).toHaveBeenCalledTimes(1)

    tick(7000)
    expect(reading()).toContain('3')
    expect(dialog().querySelector('.text-orange-400')).not.toBeNull()
    tick(3000)
    expect(reading()).toContain('Rest — next up rep 2')
    tick(4000)
    expect(reading()).toContain('6')

    tick(6000)
    expect(reading()).toContain('Hold — rep 2')
    expect(reading()).toContain('10')

    click(screen.getByRole('button', { name: 'Stop' }))
    expect(dialog()).toBeNull()
    for (const node of audio.log) expect(node.stop).toHaveBeenCalled()
  })

  it('closes on Escape and ignores other keys', async () => {
    mountApp()
    startFooter('30s')
    await flush()
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(reading()).toContain('30-second holds')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(dialog()).toBeNull()
  })

  it('runs silently where there is no WebAudio or vibration', () => {
    vi.stubGlobal('AudioContext', undefined)
    navigator.vibrate = undefined
    mountApp()
    startFooter('10s')
    tick(5000)
    tick(10000)
    tick(10000)
    expect(reading()).toContain('Hold — rep 2')
    expect(audio.log).toHaveLength(0)
  })
})

describe('the hold timer from an exercise card', () => {
  // Push day's cards, to the one named.
  const toCard = (name) => {
    openSession('Push day')
    while (
      document.querySelector('article[aria-hidden="false"]').getAttribute('aria-label') !== name
    ) {
      click(button('Next exercise'))
    }
  }

  it('runs that exercise’s own holds, then stops and checks it off', async () => {
    mountApp()
    toCard('Sleeper Stretch')
    click(button('Start holds, 2 × 10s'))
    await flush()
    expect(reading()).toContain('Sleeper Stretch')
    tick(5000)
    expect(reading()).toContain('Hold — rep 1 of 2')
    tick(10000)
    expect(reading()).toContain('Rest — next up rep 2')
    tick(10000)
    expect(reading()).toContain('Hold — rep 2 of 2')
    expect(checked()).toEqual([])
    tick(10000)
    expect(dialog()).toBeNull()
    expect(checked()).toEqual(['mobility'])
    expect(screen.queryByRole('button', { name: /^Start holds/ })).toBeNull()
  })

  it('leaves an exercise checked by hand during the run alone', () => {
    mountApp()
    toCard('Sleeper Stretch')
    click(button('Start holds, 2 × 10s'))
    click(button('Tap when done'))
    // One tick per phase: each phase change needs a render before the next.
    for (const ms of [5000, 10000, 10000, 10000]) tick(ms)
    expect(dialog()).toBeNull()
    expect(checked()).toEqual(['mobility'])
  })

  it('does not check anything off when stopped early', () => {
    mountApp()
    toCard('Doorway Stretch')
    click(button('Start holds, 3 × 30s'))
    tick(5000)
    click(screen.getByRole('button', { name: 'Stop' }))
    expect(checked()).toEqual([])
    // A fresh footer run carries no count or name over from the card.
    startFooter('10s')
    tick(5000)
    expect(reading()).toContain('10-second holds')
    expect(reading()).not.toContain(' of ')
  })

  it('starts from a row in the list too', async () => {
    mountApp()
    openSession('Push day', { list: true })
    click(button('Start hold timer: 2 x 10s'))
    await flush()
    expect(reading()).toContain('Sleeper Stretch')
  })

  it('checks off a daily exercise the same way', () => {
    mountApp()
    click(button(/^Hand passes/))
    click(screen.getByRole('region', { name: 'Once a day' }).querySelector('button'))
    click(button('Start holds, 2 × 30s'))
    for (const ms of [5000, 30000, 10000, 30000]) tick(ms)
    expect(dialog()).toBeNull()
    expect(Object.values(savedHistory()['2026-10-06'].daily)).toEqual([true])
  })
})

describe('the screen wake lock', () => {
  const lockUp = () => {
    const locks = []
    navigator.wakeLock = {
      request: vi.fn(() => {
        const lock = { release: vi.fn() }
        locks.push(lock)
        return Promise.resolve(lock)
      })
    }
    return locks
  }
  const becomes = (state) => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
  }

  it('is held for the length of a run and taken again after the tab returns', async () => {
    const locks = lockUp()
    mountApp()
    startFooter('10s')
    await flush()
    expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen')

    becomes('hidden')
    await flush()
    expect(locks).toHaveLength(1)
    becomes('visible')
    await flush()
    expect(locks).toHaveLength(2)

    click(screen.getByRole('button', { name: 'Cancel' }))
    expect(locks[1].release).toHaveBeenCalledTimes(1)
    becomes('visible')
    await flush()
    expect(locks).toHaveLength(2)
    delete navigator.wakeLock
  })

  it('drops a lock that arrives after the run has ended', async () => {
    const locks = lockUp()
    mountApp()
    startFooter('10s')
    click(screen.getByRole('button', { name: 'Cancel' }))
    await flush()
    expect(locks[0].release).toHaveBeenCalledTimes(1)
    delete navigator.wakeLock
  })

  it('runs without one when the request is refused', async () => {
    navigator.wakeLock = { request: vi.fn(() => Promise.reject(new Error('denied'))) }
    mountApp()
    startFooter('10s')
    await flush()
    expect(reading()).toContain('Get ready…')
    click(screen.getByRole('button', { name: 'Cancel' }))
    delete navigator.wakeLock
  })
})
