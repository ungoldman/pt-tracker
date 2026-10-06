import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The plugin's real module registers a service worker. Capture what the app
// hands it and drive the callbacks by hand.
const registerSW = vi.fn()
vi.mock('virtual:pwa-register', () => ({ registerSW }))

let updates
let UpdateNotice
let options
let updateSW
let reload

const foreground = (state = 'visible') => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state)
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(async () => {
  // The notice count is module state, so each test gets a fresh module.
  vi.resetModules()
  updateSW = vi.fn()
  registerSW.mockReset().mockImplementation((opts) => {
    options = opts
    return updateSW
  })
  reload = vi.fn()
  vi.stubGlobal('location', { ...window.location, reload })
  updates = await import('../src/lib/updates')
  UpdateNotice = (await import('../src/components/UpdateNotice')).default
})

describe('updates', () => {
  it('reports nothing and accepts harmlessly before it starts', () => {
    expect(updates.updateNotice()).toBe(0)
    expect(() => updates.acceptUpdate()).not.toThrow()
    expect(reload).not.toHaveBeenCalled()
  })

  it('tells subscribers about a new build until they unsubscribe', () => {
    updates.startUpdates()
    const listener = vi.fn()
    const unsubscribe = updates.subscribeUpdate(listener)

    options.onNeedRefresh()
    expect(updates.updateNotice()).toBe(1)
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    options.onNeedRefresh()
    expect(updates.updateNotice()).toBe(2)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('asks for an update check on every return to the foreground', () => {
    updates.startUpdates()
    const registration = { update: vi.fn(() => Promise.reject(new Error('offline'))) }
    options.onRegisteredSW('sw.js', registration)

    foreground('hidden')
    expect(registration.update).not.toHaveBeenCalled()

    foreground()
    window.dispatchEvent(new Event('pageshow'))
    expect(registration.update).toHaveBeenCalledTimes(2)
    // No build has been found, so there is nothing to bring back.
    expect(updates.updateNotice()).toBe(0)
  })

  it('brings the notice back on return once a build is waiting', () => {
    updates.startUpdates()
    options.onRegisteredSW('sw.js', { update: () => Promise.resolve() })
    options.onNeedRefresh()
    foreground()
    expect(updates.updateNotice()).toBe(2)
  })

  it('survives a registration that never materialized', () => {
    updates.startUpdates()
    options.onRegisteredSW('sw.js', undefined)
    expect(() => foreground()).not.toThrow()
    updates.acceptUpdate()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('messages a waiting worker, and just reloads when none is waiting', () => {
    updates.startUpdates()
    const registration = { update: () => Promise.resolve(), waiting: null }
    options.onRegisteredSW('sw.js', registration)

    updates.acceptUpdate()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(updateSW).not.toHaveBeenCalled()

    registration.waiting = {}
    updates.acceptUpdate()
    expect(updateSW).toHaveBeenCalledWith(true)
    expect(reload).toHaveBeenCalledTimes(1)
  })
})

describe('UpdateNotice', () => {
  it.each([false, true])('stays hidden until a build is found (dark: %s)', (darkMode) => {
    updates.startUpdates()
    render(<UpdateNotice darkMode={darkMode} />)
    expect(screen.queryByRole('status')).toBeNull()

    act(() => options.onNeedRefresh())
    expect(screen.getByRole('status').textContent).toContain('New version ready')
  })

  it('accepts the update', () => {
    updates.startUpdates()
    render(<UpdateNotice darkMode={false} />)
    act(() => options.onNeedRefresh())
    fireEvent.click(screen.getByRole('button', { name: 'Update' }))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('hides when dismissed and returns for the next announcement', () => {
    updates.startUpdates()
    render(<UpdateNotice darkMode={false} />)
    act(() => options.onNeedRefresh())
    fireEvent.click(screen.getByRole('button', { name: 'Later' }))
    expect(screen.queryByRole('status')).toBeNull()

    act(() => options.onNeedRefresh())
    expect(screen.getByRole('status')).not.toBeNull()
  })
})
