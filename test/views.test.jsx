import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { button, click, mountApp, pill, row } from './helpers'

const week = () => fireEvent.keyDown(window, { key: 'w' })
const three = () => fireEvent.keyDown(window, { key: 't' })
// The header's week dots share the chips' labels, so look inside the chip grid.
const chip = (day) =>
  within(document.querySelector('.grid.sm\\:hidden')).getByRole('button', {
    name: new RegExp(`^${day}: \\d+% done`)
  })
const finishTuesday = () => {
  for (const name of [
    'Arm Circles',
    'Wall Slides',
    'Doorway Stretch',
    'Sleeper Stretch',
    'Tendon Glide',
    'Overhead Reach',
    'Daily Steps',
    'Sit Ups',
    'Run',
    'Pull Apart'
  ]) {
    click(row(name))
  }
}

describe('week view', () => {
  it.each([false, true])('shows seven day cards with today tinted (dark: %s)', (dark) => {
    mountApp({ dark })
    week()
    const cards = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(cards.map((text) => text.replace(/[A-Z][a-z]{2} \d+$/, ''))).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ])
    const today = screen.getByRole('heading', { name: /^Tuesday/ }).closest('.rounded-xl')
    expect(today.className).toMatch(/bg-blue-(50|900)/)
    // Week columns have no room for notes, timers, or the per-block control.
    expect(screen.queryByRole('button', { name: 'Add a note' })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Start hold timer/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Move or skip/ })).toBeNull()
  })

  it('marks an exercise that has a note', () => {
    mountApp()
    click(button('Add a note'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'tight today' } })
    week()
    expect(screen.getAllByTitle('Has a note')).toHaveLength(1)
  })

  it.each([false, true])('gives phones a row per day with a bar per block (dark: %s)', (dark) => {
    mountApp({ dark })
    click(row('Arm Circles'))
    click(row('Wall Slides'))
    week()
    const overview = button('Tuesday: 2 of 10 done (today)')
    expect(within(overview).getByText('2/10')).not.toBeNull()
    expect(overview.querySelectorAll('.h-1 > span')).toHaveLength(5)
    expect(overview.querySelector('.bg-green-500')).not.toBeNull()

    click(button('Monday: 0 of 12 done'))
    expect(screen.getByRole('heading', { name: 'Monday' })).not.toBeNull()
  })

  it('stars a finished day in the overview', () => {
    mountApp()
    finishTuesday()
    week()
    const overview = button('Tuesday: 10 of 10 done (today)')
    expect(overview.querySelector('.fill-yellow-400')).not.toBeNull()
    expect(within(overview).queryByText('10/10')).toBeNull()
  })
})

describe('three-day view', () => {
  it('shows yesterday, today, and tomorrow', () => {
    mountApp()
    three()
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent.slice(0, 3))
    ).toEqual(['Mon', 'Tue', 'Wed'])
    expect(screen.getAllByRole('button', { name: 'Add a note' }).length).toBeGreaterThan(0)
  })

  it('wraps around the ends of the week', () => {
    const { unmount } = mountApp({ date: new Date('2026-10-04T12:00:00') })
    three()
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent.slice(0, 3))
    ).toEqual(['Sat', 'Sun', 'Mon'])
    unmount()
    mountApp({ date: new Date('2026-10-10T12:00:00') })
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent.slice(0, 3))
    ).toEqual(['Fri', 'Sat', 'Sun'])
  })

  it('keeps the phone chips for navigation, without a selection', () => {
    mountApp()
    three()
    expect(chip('Tuesday').getAttribute('aria-current')).toBeNull()
    expect(
      screen.queryByRole('button', { name: /^Move blocks to or from Tuesday$/ })
    ).not.toBeNull()
    click(chip('Friday'))
    expect(screen.getByRole('heading', { name: 'Friday' })).not.toBeNull()
  })
})

describe('the phone day chips', () => {
  it.each([false, true])('carry progress, today, and the selection (dark: %s)', (dark) => {
    mountApp({ dark })
    expect(chip('Tuesday').getAttribute('aria-label')).toBe('Tuesday: 0% done (today)')
    expect(chip('Tuesday').getAttribute('aria-current')).toBe('date')
    expect(chip('Tuesday').querySelector('.absolute')).toBeNull()

    click(row('Arm Circles'))
    expect(chip('Tuesday').querySelector('.absolute').style.width).toBe('10%')
    expect(chip('Tuesday').querySelector('.absolute').className).toContain('bg-white/70')

    click(chip('Monday'))
    expect(chip('Monday').getAttribute('aria-current')).toBe('date')
    expect(chip('Tuesday').className).toContain('ring-1')
    expect(chip('Tuesday').querySelector('.absolute').className).toContain('bg-blue-500')
  })

  it('stars a finished day', () => {
    mountApp()
    finishTuesday()
    click(pill('Monday'))
    expect(chip('Tuesday').querySelector('.fill-yellow-400')).not.toBeNull()
    expect(chip('Tuesday').querySelector('.absolute').className).toContain('bg-green-500')
  })
})
