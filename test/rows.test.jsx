import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { button, click, mountApp, pill, row } from './helpers'

const notes = () => JSON.parse(localStorage.getItem('ptTrackerNotes'))
const stats = () => screen.getByText(/^Today:/).textContent.replace(/\s+/g, ' ')

describe('exercise rows', () => {
  it('describes each kind of prescription', () => {
    mountApp()
    const text = (name) => row(name).textContent
    expect(text('Arm Circles')).toBe('Arm Circles2 x 10')
    expect(text('Doorway Stretch')).toBe('Doorway Stretch3 x 30s')
    expect(text('Sleeper Stretch')).toBe('Sleeper Stretch1 x 2 · 10s hold')
    expect(text('Tendon Glide')).toBe('Tendon Glide3 x 10 · 3s hold · 3x/day')
    expect(text('Overhead Reach')).toBe('Overhead Reach2 x 30s')
    expect(text('Daily Steps')).toBe('Daily Steps5000')
  })

  it('offers a timer only for holds worth timing', () => {
    mountApp()
    expect(
      screen
        .getAllByRole('button', { name: /^Start hold timer/ })
        .map((b) => b.getAttribute('aria-label').replace('Start hold timer: ', ''))
    ).toEqual(['3 x 30s', '2 x 10s', '2 x 30s'])
  })

  it.each([false, true])('links to a video without toggling the row (dark: %s)', (dark) => {
    mountApp({ dark })
    click(pill('Monday'))
    const link = screen.getByRole('link', { name: 'video' })
    expect(link.getAttribute('href')).toBe('https://example.com/squats')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    click(link)
    expect(stats()).toBe('Today: 0/10')
  })

  it.each([false, true])('greens a finished row (dark: %s)', (dark) => {
    mountApp({ dark })
    click(row('Arm Circles'))
    expect(row('Arm Circles').parentElement.className).toMatch(/bg-green-(50|900)/)
    expect(row('Arm Circles').querySelector('svg')).not.toBeNull()
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
    expect(stats()).toBe('Today: 0/10')

    click(button('Close'))
    expect(screen.queryByRole('textbox')).toBeNull()
    click(button('View note'))
    expect(screen.getByRole('textbox').value).toBe('one\ntwo\nthree')
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
    const before = screen.getAllByRole('button', { name: /^Start hold timer/ }).length
    click(button('Add a note', 2))
    expect(screen.getAllByRole('button', { name: /^Start hold timer/ })).toHaveLength(before - 1)
  })
})
