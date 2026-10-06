import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { button, click, mountApp, pill, row, savedChecks, savedMoves } from './helpers'

const SUNDAY = new Date('2026-10-04T12:00:00')
const shown = () =>
  [...document.querySelectorAll('[data-block]')].map((el) => el.getAttribute('data-block'))
const dayMoves = (day, index = 0) => button(new RegExp(`^Move blocks to or from ${day}`), index)
const skipAll = (pairs) =>
  localStorage.setItem(
    'ptTrackerMoves',
    JSON.stringify(Object.fromEntries(pairs.map((key) => [key, 'skip'])))
  )

describe('moving one block', () => {
  it.each([false, true])('moves it to another day and back (dark: %s)', (dark) => {
    mountApp({ dark })
    click(button('Move or skip Bands'))
    const panel = screen.getByRole('dialog', { name: 'Move or skip Bands' })
    expect(within(panel).getByRole('button', { name: 'Move to Tuesday' }).disabled).toBe(true)
    expect(within(panel).queryByRole('button', { name: 'Move back' })).toBeNull()

    click(within(panel).getByRole('button', { name: 'Move to Wednesday' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(savedMoves()).toEqual({ 'Tuesday-Bands': 'Wednesday' })
    expect(shown()).not.toContain('Tuesday-Bands')
    expect(button('Bands moved to Wednesday, put it back').textContent).toContain('Wed')

    click(pill('Wednesday'))
    expect(shown()).toContain('Tuesday-Bands')
    expect(screen.getByText('from Tue')).not.toBeNull()
    click(button('Move or skip Bands'))
    click(button('Move back'))
    expect(savedMoves()).toEqual({})
    expect(shown()).not.toContain('Tuesday-Bands')
  })

  it('keeps checks with the block wherever it is shown', () => {
    mountApp()
    click(row('Pull Apart'))
    click(screen.getByText('Bands'))
    click(button('Move or skip Bands'))
    click(button('Move to Wednesday'))
    expect(savedChecks()).toEqual(['Tuesday-Bands'])
    click(pill('Wednesday'))
    expect(screen.getByText('from Tue').closest('button').textContent).toContain('1/1')
  })

  it('moving a block onto its own day is moving it back', () => {
    mountApp()
    click(button('Move or skip Bands'))
    click(button('Move to Wednesday'))
    click(pill('Wednesday'))
    click(button('Move or skip Bands'))
    click(button('Move to Tuesday'))
    expect(savedMoves()).toEqual({})
  })

  it.each([false, true])('skips a daily block, which has no day targets (dark: %s)', (dark) => {
    mountApp({ dark })
    click(button('Move or skip Warm Up'))
    expect(screen.queryByRole('button', { name: /^Move to / })).toBeNull()
    click(button('Skip'))
    expect(savedMoves()).toEqual({ 'Tuesday-warmup': 'skip' })
    expect(screen.getByText(/^Today:/).textContent).toContain('0/8')

    const placeholder = button('Warm Up skipped, put it back')
    expect(placeholder.textContent).toContain('skipped')
    click(placeholder)
    expect(savedMoves()).toEqual({})
  })

  it('closes on a second press, Escape, or a press elsewhere', () => {
    mountApp()
    const open = () => screen.queryByRole('dialog') !== null
    click(button('Move or skip Bands'))
    click(button('Move or skip Bands'))
    expect(open()).toBe(false)
    click(button('Move or skip Bands'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(open()).toBe(false)
    click(button('Move or skip Bands'))
    fireEvent.pointerDown(screen.getByRole('dialog'))
    expect(open()).toBe(true)
    fireEvent.pointerDown(document.body)
    expect(open()).toBe(false)
  })

  it('labels a block that has no display name by its key', () => {
    mountApp({ date: new Date('2026-10-10T12:00:00') })
    click(button('Move or skip odds'))
    click(button('Skip'))
    expect(button('odds skipped, put it back')).not.toBeNull()
  })
})

describe('the day-level panel', () => {
  it.each([false, true])('pulls a strength session in as one (dark: %s)', (dark) => {
    mountApp({ dark })
    click(dayMoves('Tuesday', 1))
    const panel = screen.getByRole('dialog', { name: 'Move blocks, Tuesday' })
    expect(
      within(panel)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label'))
    ).toEqual([
      'Pull Strength (2) from Monday',
      'Pull Cardio from Monday',
      'Pull Cardio from Sunday',
      'Pull Strength (2) from Wednesday',
      'Pull Cardio from Wednesday',
      'Pull Cardio from Thursday',
      'Pull Bands from Thursday',
      'Pull Strength (2) from Friday',
      'Pull Cardio from Friday',
      'Pull Bands from Saturday',
      'Pull odds from Saturday'
    ])
    expect(within(panel).queryByText('Moved to Tuesday')).toBeNull()

    click(within(panel).getByRole('button', { name: 'Pull Strength (2) from Monday' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(savedMoves()).toEqual({ 'Monday-Push': 'Tuesday', 'Monday-Pull': 'Tuesday' })
    expect(shown()).toEqual(expect.arrayContaining(['Monday-Push', 'Monday-Pull']))
    expect(screen.getByText('Strength day')).not.toBeNull()
    expect(screen.getByText('Strength back to back with Wed')).not.toBeNull()
  })

  it('sends back what was moved in, one origin at a time', () => {
    localStorage.setItem(
      'ptTrackerMoves',
      JSON.stringify({
        'Monday-Push': 'Tuesday',
        'Monday-Pull': 'Tuesday',
        'Wednesday-cardio': 'Tuesday'
      })
    )
    mountApp()
    click(dayMoves('Tuesday', 1))
    const panel = screen.getByRole('dialog')
    expect(within(panel).getByText('2 blocks from Monday')).not.toBeNull()
    expect(within(panel).getByText('1 block from Wednesday')).not.toBeNull()
    // A session parked on another day is offered apart from that day's own.
    click(within(panel).getByRole('button', { name: 'Send back to Monday' }))
    expect(savedMoves()).toEqual({ 'Wednesday-cardio': 'Tuesday' })

    click(pill('Wednesday'))
    click(dayMoves('Wednesday', 1))
    expect(button('Pull Cardio from Wed from Tuesday')).not.toBeNull()
  })

  it('closes on Escape', () => {
    mountApp()
    click(dayMoves('Tuesday', 1))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('says so when other days owe nothing', () => {
    const gated = {
      Sunday: ['cardio'],
      Monday: ['cardio', 'Push', 'Pull'],
      Wednesday: ['cardio', 'Push', 'Pull'],
      Thursday: ['cardio', 'Bands'],
      Friday: ['cardio', 'Push', 'Pull'],
      Saturday: ['Bands', 'odds']
    }
    skipAll(Object.entries(gated).flatMap(([day, list]) => list.map((c) => `${day}-${c}`)))
    mountApp()
    click(dayMoves('Tuesday', 1))
    expect(screen.getByText('Nothing unfinished on other days')).not.toBeNull()
  })

  it.each([false, true])('carries the clash warning on the phone chip (dark: %s)', (dark) => {
    localStorage.setItem('ptTrackerMoves', JSON.stringify({ 'Monday-Push': 'Tuesday' }))
    mountApp({ dark })
    const chip = dayMoves('Tuesday')
    expect(chip.getAttribute('aria-label')).toBe(
      'Move blocks to or from Tuesday. Strength back to back with Mon and Wed'
    )
    expect(chip.className).toContain('text-amber')
    click(chip)
    expect(
      within(screen.getByRole('dialog')).getByText('Strength back to back with Mon and Wed')
    ).not.toBeNull()
  })

  it.each([false, true])('turns the week-view button amber on a clash (dark: %s)', (dark) => {
    localStorage.setItem('ptTrackerMoves', JSON.stringify({ 'Monday-Push': 'Tuesday' }))
    mountApp({ dark })
    fireEvent.keyDown(window, { key: 'w' })
    expect(dayMoves('Tuesday').title).toBe('Strength back to back with Mon and Wed. Move blocks')
    expect(dayMoves('Thursday').title).toBe('Move blocks')
    expect(screen.queryByText(/^Strength back to back/)).toBeNull()
    expect(button('Push moved to Tuesday, put it back')).not.toBeNull()

    fireEvent.keyDown(window, { key: 't' })
    expect(screen.getAllByText(/^Strength back to back/).length).toBeGreaterThan(0)
  })
})

describe('the offer to pull in yesterday', () => {
  it.each([false, true])('offers each unfinished group and pulls on tap (dark: %s)', (dark) => {
    mountApp({ dark })
    const offer = screen.getByText('Pull in from Monday').parentElement
    expect(
      within(offer)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label'))
    ).toEqual([
      'Pull Strength (2) from Monday in to today',
      'Pull Cardio from Monday in to today',
      'Dismiss'
    ])
    click(button('Pull Cardio from Monday in to today'))
    expect(savedMoves()).toEqual({ 'Monday-cardio': 'Tuesday' })
    expect(shown()).toEqual(expect.arrayContaining(['Tuesday-cardio', 'Monday-cardio']))
    expect(screen.queryByRole('button', { name: 'Pull Cardio from Monday in to today' })).toBeNull()
  })

  it('can be dismissed', () => {
    mountApp()
    click(button('Dismiss'))
    expect(screen.queryByText('Pull in from Monday')).toBeNull()
  })

  it('is only shown on today, and never on a Sunday', () => {
    const { unmount } = mountApp()
    click(pill('Wednesday'))
    expect(screen.queryByText(/^Pull in from/)).toBeNull()
    unmount()
    mountApp({ date: SUNDAY })
    expect(screen.queryByText(/^Pull in from/)).toBeNull()
  })

  it('goes away once yesterday owes nothing', () => {
    skipAll(['Monday-cardio', 'Monday-Push', 'Monday-Pull'])
    mountApp()
    expect(screen.queryByText(/^Pull in from/)).toBeNull()
  })
})
