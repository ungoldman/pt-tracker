import { act, fireEvent, renderHook, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTracker } from '../src/context/TrackerContext'
import { button, click, mountApp, pill, row, savedChecks, savedMoves, tick } from './helpers'

const blockTitles = () =>
  [...document.querySelectorAll('[data-block]')].map((el) => el.getAttribute('data-block'))
const stats = () => screen.getByText(/^Today:/).textContent.replace(/\s+/g, ' ')
const priority = () =>
  screen.getByText('Priority exercises done today').parentElement.firstChild.textContent

describe('day view', () => {
  it('shows today’s blocks in three lanes on a wide screen', () => {
    mountApp()
    expect(screen.getByRole('heading', { name: 'Today' })).not.toBeNull()
    expect(screen.getByText('Tuesday, October 6')).not.toBeNull()
    expect(blockTitles()).toEqual([
      'Tuesday-warmup',
      'Tuesday-mobility',
      'Tuesday-goals',
      'Tuesday-cardio',
      'Tuesday-Bands'
    ])
    expect(stats()).toBe('Today: 0/10')
    expect(screen.getByText('Rest day')).not.toBeNull()
  })

  it.each([
    [1400, 3],
    [1100, 2],
    [800, 1]
  ])('lays out %ipx as %i columns and follows a resize', (width, columns) => {
    mountApp({ width: 500 })
    const lanes = () => document.querySelector('[data-block]').parentElement.parentElement.children
    expect(lanes()).toHaveLength(1)
    act(() => {
      window.innerWidth = width
      window.dispatchEvent(new Event('resize'))
    })
    expect(lanes()).toHaveLength(columns)
    // A lane past the last column folds into it, so nothing is dropped.
    expect(blockTitles()).toHaveLength(5)
  })

  it('names another day by its weekday', () => {
    mountApp()
    click(pill('Monday'))
    expect(screen.getByRole('heading', { name: 'Monday' })).not.toBeNull()
    expect(screen.getByText('October 5')).not.toBeNull()
    expect(blockTitles()).toContain('Monday-Push')
  })

  it.each([false, true])('renders every view in both themes (dark: %s)', (dark) => {
    mountApp({ dark })
    click(pill('Monday'))
    for (const key of ['w', 't', 'd']) {
      fireEvent.keyDown(window, { key })
      expect(screen.getAllByText('Warm Up').length).toBeGreaterThan(0)
    }
  })
})

describe('checking exercises off', () => {
  it('toggles a row by click and by keyboard, and saves it', () => {
    mountApp()
    click(row('Arm Circles'))
    expect(stats()).toBe('Today: 1/10')
    expect(savedChecks()).toEqual(['Tuesday-warmup'])

    fireEvent.keyDown(row('Arm Circles'), { key: 'Enter' })
    expect(stats()).toBe('Today: 0/10')
    fireEvent.keyDown(row('Arm Circles'), { key: ' ' })
    fireEvent.keyDown(row('Arm Circles'), { key: 'a' })
    expect(stats()).toBe('Today: 1/10')
  })

  it('ignores the click that ends a text selection', () => {
    mountApp()
    vi.spyOn(window, 'getSelection').mockReturnValue({ isCollapsed: false })
    click(row('Arm Circles'))
    expect(stats()).toBe('Today: 0/10')
    vi.spyOn(window, 'getSelection').mockReturnValue(null)
    click(row('Arm Circles'))
    expect(stats()).toBe('Today: 1/10')
  })

  it.each([false, true])('celebrates, then settles (dark: %s)', (dark) => {
    mountApp({ dark })
    click(row('Arm Circles'))
    expect(document.querySelector('.ring-green-400\\/70')).not.toBeNull()
    expect(document.querySelectorAll('.rounded-sm.shadow-lg')).toHaveLength(30)
    tick(1000)
    expect(document.querySelector('.ring-green-400\\/70')).toBeNull()
    tick(1000)
    expect(document.querySelectorAll('.rounded-sm.shadow-lg')).toHaveLength(0)
  })

  it('collapses a finished block and brings the next unfinished one up', () => {
    mountApp({ width: 500 })
    click(row('Arm Circles'))
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
    click(row('Wall Slides'))
    expect(screen.queryByText('Wall Slides')).toBeNull()
    tick(350)
    const target = Element.prototype.scrollIntoView.mock.contexts[0]
    expect(target.getAttribute('data-block')).toBe('Tuesday-mobility')
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start'
    })
  })

  it('scrolls gently on a wide screen or with reduced motion', () => {
    mountApp({ reduced: true })
    click(row('Arm Circles'))
    click(row('Wall Slides'))
    tick(350)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'nearest'
    })
  })

  it('wraps to an earlier block, and stops when the whole day is done', () => {
    mountApp()
    click(row('Pull Apart'))
    tick(350)
    expect(Element.prototype.scrollIntoView.mock.contexts[0].getAttribute('data-block')).toBe(
      'Tuesday-warmup'
    )

    Element.prototype.scrollIntoView.mockClear()
    for (const name of [
      'Arm Circles',
      'Wall Slides',
      'Doorway Stretch',
      'Sleeper Stretch',
      'Tendon Glide',
      'Overhead Reach',
      'Daily Steps',
      'Sit Ups'
    ]) {
      click(row(name))
    }
    Element.prototype.scrollIntoView.mockClear()
    click(row('Run'))
    tick(350)
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
    expect(stats()).toBe('Today: 10/10')
  })

  it('does not jump when switching days or cancelling a pending scroll', () => {
    mountApp()
    click(row('Arm Circles'))
    click(row('Wall Slides'))
    click(pill('Monday'))
    tick(350)
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })
})

describe('header', () => {
  it('tracks priority work and the strength badge', () => {
    mountApp()
    expect(priority()).toBe('0/1')
    click(row('Sit Ups'))
    expect(priority()).toBe('1/1')
  })

  it.each([false, true])('shows a strength day and its dots (dark: %s)', (dark) => {
    mountApp({ dark, date: new Date('2026-10-05T12:00:00') })
    expect(screen.getByText('Strength day')).not.toBeNull()
    click(row('Sit Ups'))
    click(row('Press (5)'))
    expect(priority()).toBe('2/2')
  })

  it('hides the stats on a day with nothing scheduled', () => {
    localStorage.setItem(
      'ptTrackerMoves',
      JSON.stringify(
        Object.fromEntries(
          ['warmup', 'mobility', 'goals', 'cardio', 'Bands'].map((c) => [`Tuesday-${c}`, 'skip'])
        )
      )
    )
    mountApp()
    expect(screen.queryByText(/^Today:/)).toBeNull()
  })

  it('cycles the view from its button and keeps it across reloads', () => {
    const { unmount } = mountApp()
    const cycle = () => click(button(/^Cycle view/))
    expect(screen.getByText('Day view')).not.toBeNull()
    cycle()
    expect(screen.getByText('3-day view')).not.toBeNull()
    cycle()
    expect(screen.getByText('Week view')).not.toBeNull()
    cycle()
    expect(screen.getByText('Day view')).not.toBeNull()
    cycle()
    unmount()
    mountApp()
    expect(screen.getByText('3-day view')).not.toBeNull()
  })

  it('ignores view shortcuts while typing and unknown keys', () => {
    mountApp()
    click(button('Add a note'))
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'w' })
    const input = document.createElement('input')
    document.body.append(input)
    fireEvent.keyDown(input, { key: 'w' })
    fireEvent.keyDown(window, { key: 'x' })
    expect(screen.getByText('Day view')).not.toBeNull()
    input.remove()
  })

  it('toggles the theme', () => {
    mountApp()
    click(button('Switch to dark mode'))
    expect(localStorage.getItem('ptTrackerDarkMode')).toBe('true')
    click(button('Switch to light mode'))
    expect(localStorage.getItem('ptTrackerDarkMode')).toBe('false')
  })

  it('shrinks once scrolled and grows back near the top', () => {
    mountApp()
    const bar = screen.getByRole('heading', { name: 'pt-tracker' }).closest('.sticky')
    const scrollTo = (y) =>
      act(() => {
        window.scrollY = y
        window.dispatchEvent(new Event('scroll'))
      })
    scrollTo(50)
    expect(bar.className).toContain('p-3 ')
    scrollTo(100)
    expect(bar.className).toContain('py-1.5')
    scrollTo(50)
    expect(bar.className).toContain('py-1.5')
    scrollTo(10)
    expect(bar.className).toContain('p-3 ')
  })

  it('publishes its height for sticky block headers', () => {
    let observed
    window.ResizeObserver = class {
      constructor(callback) {
        observed = callback
      }
      observe() {}
      disconnect() {}
    }
    mountApp()
    expect(document.documentElement.style.getPropertyValue('--header-h')).toBe('0px')
    const bar = screen.getByRole('heading', { name: 'pt-tracker' }).closest('.sticky')
    Object.defineProperty(bar, 'offsetHeight', { value: 84 })
    act(() => observed())
    expect(document.documentElement.style.getPropertyValue('--header-h')).toBe('84px')
  })

  it('jumps to a day from the week dots, marking today and the selection', () => {
    mountApp()
    fireEvent.keyDown(window, { key: 'w' })
    const dots = screen.getByRole('group', { name: 'Week progress' })
    expect(within(dots).getByRole('button', { name: 'Tuesday: 0% done (today)' })).not.toBeNull()
    click(within(dots).getByRole('button', { name: 'Monday: 0% done' }))
    expect(screen.getByRole('heading', { name: 'Monday' })).not.toBeNull()
    expect(within(dots).getByRole('button', { name: 'Monday: 0% done (selected)' })).not.toBeNull()
  })

  it.each([false, true])('colors the week dots by progress (dark: %s)', (dark) => {
    mountApp({ dark })
    const dot = (day) =>
      within(screen.getByRole('group', { name: 'Week progress' })).getByRole('button', {
        name: new RegExp(`^${day}:`)
      }).firstChild
    expect(dot('Tuesday').className).toMatch(/bg-gray-(300|600)/)
    click(row('Arm Circles'))
    expect(dot('Tuesday').className).toContain('bg-blue-500')
    for (const name of ['Wall Slides', 'Doorway Stretch', 'Sleeper Stretch', 'Tendon Glide']) {
      click(row(name))
    }
    expect(dot('Tuesday').className).toContain('bg-green-500')
    for (const name of ['Overhead Reach', 'Daily Steps', 'Sit Ups', 'Run', 'Pull Apart']) {
      click(row(name))
    }
    expect(dot('Tuesday').tagName.toLowerCase()).toBe('svg')
    click(pill('Monday'))
    expect(dot('Tuesday').tagName.toLowerCase()).toBe('svg')
  })

  it('stars a finished day that is not today, a size smaller', () => {
    mountApp()
    click(pill('Sunday'))
    for (const name of [
      'Arm Circles',
      'Wall Slides',
      'Doorway Stretch',
      'Sleeper Stretch',
      'Tendon Glide',
      'Overhead Reach',
      'Daily Steps',
      'Sit Ups',
      'Run'
    ]) {
      click(row(name))
    }
    const star = within(screen.getByRole('group', { name: 'Week progress' })).getByRole('button', {
      name: /^Sunday: 100% done/
    }).firstChild
    expect(star.getAttribute('width')).toBe('13')
  })
})

describe('the tracker context', () => {
  it('refuses to be read outside the app', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useTracker())).toThrow(/within a TrackerContext provider/)
  })
})

describe('collapsing sections', () => {
  const open = (title) => screen.queryByText(title) !== null

  it('toggles one block by hand', () => {
    mountApp()
    click(screen.getByText('Warm Up'))
    expect(open('Arm Circles')).toBe(false)
    click(screen.getByText('Warm Up'))
    expect(open('Arm Circles')).toBe(true)
  })

  it('cycles collapse all, expand all, and back to done-only', () => {
    mountApp()
    click(row('Arm Circles'))
    click(row('Wall Slides'))
    expect(open('Arm Circles')).toBe(false)

    click(button('Sections: collapse all'))
    expect(open('Doorway Stretch')).toBe(false)
    click(button('Sections: expand all'))
    expect(open('Arm Circles')).toBe(true)
    expect(open('Doorway Stretch')).toBe(true)
    click(button('Sections: collapse done'))
    expect(open('Arm Circles')).toBe(false)
    expect(open('Doorway Stretch')).toBe(true)
  })

  it('lets completion override a bulk action', () => {
    mountApp()
    click(button('Sections: collapse all'))
    click(button('Sections: expand all'))
    click(row('Arm Circles'))
    click(row('Wall Slides'))
    expect(open('Arm Circles')).toBe(false)
    // Reopening by unchecking is not possible while collapsed, so peek first.
    click(screen.getByText('Warm Up'))
    click(row('Arm Circles'))
    expect(open('Arm Circles')).toBe(true)
  })
})

describe('resetting', () => {
  const openMenu = () => click(button('Reset checkboxes'))

  it('opens and closes the menu', () => {
    mountApp()
    openMenu()
    expect(screen.getByRole('menu')).not.toBeNull()
    openMenu()
    expect(screen.queryByRole('menu')).toBeNull()
    openMenu()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it.each([false, true])('resets one day when confirmed (dark: %s)', (dark) => {
    mountApp({ dark })
    click(row('Arm Circles'))
    click(pill('Monday'))
    click(row('Arm Circles'))
    click(button('Add a note'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'sore' } })

    vi.spyOn(window, 'confirm').mockReturnValue(false)
    openMenu()
    click(screen.getByRole('menuitem', { name: 'Reset Monday' }))
    expect(savedChecks()).toEqual(['Monday-warmup', 'Tuesday-warmup'])

    window.confirm.mockReturnValue(true)
    openMenu()
    click(screen.getByRole('menuitem', { name: 'Reset Monday' }))
    expect(savedChecks()).toEqual(['Tuesday-warmup'])
    expect(JSON.parse(localStorage.getItem('ptTrackerNotes'))).toEqual({})
  })

  it('resets the week, moves included, when confirmed', () => {
    mountApp()
    click(row('Arm Circles'))
    click(button('Move or skip Warm Up'))
    click(button('Skip'))
    expect(savedMoves()).toEqual({ 'Tuesday-warmup': 'skip' })

    vi.spyOn(window, 'confirm').mockReturnValue(false)
    openMenu()
    click(screen.getByRole('menuitem', { name: 'Reset week' }))
    expect(savedChecks()).toEqual(['Tuesday-warmup'])

    window.confirm.mockReturnValue(true)
    openMenu()
    click(screen.getByRole('menuitem', { name: 'Reset week' }))
    expect(savedChecks()).toEqual([])
    expect(savedMoves()).toEqual({})
  })
})
