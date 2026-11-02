import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { button, click, mountApp, openSession, row, savedHistory, tick } from './helpers'

const notes = () => JSON.parse(localStorage.getItem('ptTrackerExerciseNotes'))

describe('exercise rows', () => {
  it('describes each kind of prescription', () => {
    mountApp()
    const text = (name) => row(name).textContent
    expect(text('Daily Steps')).toBe('Daily Steps5000')
    openSession('Push day', { list: true })
    expect(text('Arm Circles')).toBe('Arm Circles2 × 10')
    expect(text('Doorway Stretch')).toBe('Doorway Stretch3 × 30s')
    expect(text('Sleeper Stretch')).toBe('Sleeper Stretch1 × 2, 10s hold each')
    click(button('Close'))
    click(button('Start session'))
    click(button('List'))
    expect(text('Tendon Glide')).toBe('Tendon Glide3 × 10, 3s hold each, 3x/day')
  })

  it('offers a timer only for holds worth timing', () => {
    mountApp()
    openSession('Push day', { list: true })
    expect(
      screen
        .getAllByRole('button', { name: /^Start hold timer/ })
        .map((b) => b.getAttribute('aria-label').replace('Start hold timer: ', ''))
    ).toEqual(['3 x 30s', '2 x 10s'])
  })

  it.each([false, true])('links to a video without toggling the row (dark: %s)', (dark) => {
    mountApp({ dark })
    openSession('Pull day', { list: true })
    const link = screen.getByRole('link', { name: 'video' })
    expect(link.getAttribute('href')).toBe('https://example.com/squats')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    click(link)
    expect(savedHistory()['2026-10-06'].sessions.pull.done).toEqual({})
  })

  it('reads a double tap as one check, and a later tap as an undo', () => {
    mountApp()
    click(row('Daily Steps'))
    tick(100)
    click(row('Daily Steps'))
    expect(row('Daily Steps').querySelector('svg')).not.toBeNull()
    tick(400)
    click(row('Daily Steps'))
    expect(Object.values(savedHistory()['2026-10-06'].daily)).toEqual([false])
  })

  it.each([false, true])('greens a finished row (dark: %s)', (dark) => {
    mountApp({ dark })
    click(row('Daily Steps'))
    expect(row('Daily Steps').parentElement.className).toMatch(/bg-green-(50|900)/)
    expect(row('Daily Steps').querySelector('svg')).not.toBeNull()
  })
})

describe('notes', () => {
  it.each([false, true])('saves as you type and survives closing (dark: %s)', (dark) => {
    mountApp({ dark })
    click(button('Add a note'))
    const box = screen.getByRole('textbox')
    expect(box.rows).toBe(2)
    expect(screen.queryByRole('button', { name: 'Discard' })).toBeNull()

    fireEvent.change(box, { target: { value: 'one\ntwo\nthree' } })
    expect(Object.values(notes())).toEqual(['one\ntwo\nthree'])
    expect(screen.getByRole('textbox').rows).toBe(3)
    // Typing in the box must not check the exercise off.
    click(screen.getByRole('textbox'))
    fireEvent.focus(screen.getByRole('textbox'))
    expect(savedHistory()['2026-10-06']).toBeUndefined()

    click(button('Close'))
    expect(screen.queryByRole('textbox')).toBeNull()
    click(button('View note'))
    expect(screen.getByRole('textbox').value).toBe('one\ntwo\nthree')
  })

  it('keeps one note per exercise, wherever it shows up', () => {
    mountApp()
    openSession('Pull day', { list: true })
    click(button('Add a note', 2))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'tight' } })
    click(button('Close'))
    // Nothing checked, so Pull day was taken back and Push day is open to start.
    openSession('Push day', { list: true })
    // Sleeper Stretch is the warm-down in both.
    expect(screen.getByRole('textbox').value).toBe('tight')
  })

  it('discards a note', () => {
    mountApp()
    click(button('Add a note'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } })
    expect(screen.getByRole('textbox').rows).toBe(2)
    click(button('Discard'))
    expect(notes()).toEqual({})
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'View note' })).toBeNull()
  })

  it('hides the row’s own controls while its editor is open', () => {
    mountApp()
    openSession('Push day', { list: true })
    const before = screen.getAllByRole('button', { name: /^Start hold timer/ }).length
    // Doorway Stretch, the first row with a timer.
    click(button('Add a note', 5))
    expect(screen.getAllByRole('button', { name: /^Start hold timer/ })).toHaveLength(before - 1)
  })
})
