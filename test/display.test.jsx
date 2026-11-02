import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getBlockStyle } from '../src/lib/blockStyle'
import {
  doseParts,
  equipmentOf,
  formatDose,
  formatExerciseName,
  getExerciseIcon,
  getPriorityIcon
} from '../src/lib/exerciseDisplay'
import { exercises } from './fixtures/program'

describe('getBlockStyle', () => {
  it('resolves a block to its accent and icon', () => {
    const style = getBlockStyle('warmup')
    expect(style.textLight).toBe('text-amber-600')
    expect(style.Icon).toBe(exercises.warmup.icon)
  })

  it('gives a block with no icon the default one', () => {
    expect(getBlockStyle('Pull').Icon).toBe(getBlockStyle('missing').Icon)
    expect(getBlockStyle('Pull').textLight).toBe('text-indigo-600')
  })

  it('falls back for an unknown block or accent', () => {
    expect(getBlockStyle('missing').textLight).toBe('text-blue-600')
    expect(getBlockStyle('odds')).toBe(getBlockStyle('missing'))
  })
})

describe('exercise display', () => {
  it('strips the equipment from the name', () => {
    expect(formatExerciseName('Flexion with Dumbbell (3)')).toBe('Flexion (3)')
    expect(formatExerciseName('Press with Dowel')).toBe('Press')
    expect(formatExerciseName('Row with Resistance ')).toBe('Row')
    expect(formatExerciseName('Wall Slides')).toBe('Wall Slides')
  })

  it.each([
    ['Curl with Dumbbell', 'Dumbbell'],
    ['Press with Dowel', 'Dowel'],
    ['Row with Resistance', 'Resistance band']
  ])('badges %s in both themes', (name, title) => {
    for (const dark of [false, true]) {
      const { container, unmount } = render(getExerciseIcon(name, dark))
      expect(container.querySelector(`[title="${title}"] svg`)).not.toBeNull()
      unmount()
    }
  })

  it('has no badge for bodyweight work', () => {
    expect(getExerciseIcon('Wall Slides', false)).toBeNull()
  })

  it('stars priority work only', () => {
    expect(getPriorityIcon(false, false)).toBeNull()
    for (const dark of [false, true]) {
      const { container, unmount } = render(getPriorityIcon(true, dark))
      expect(container.querySelector('svg')).not.toBeNull()
      unmount()
    }
  })
})

describe('doses', () => {
  it.each([
    [{ sets: 3, reps: 10 }, '3 × 10', null],
    [{ sets: 3, reps: 10, hold: '3s' }, '3 × 10', '3s hold each'],
    [{ sets: 2, hold: '30s' }, '2 × 30s', 'hold each'],
    [{ reps: 3, hold: '20s' }, '3 reps', '20s hold each'],
    [{ hold: '30s' }, '30s', 'hold each'],
    [{ target: 5000 }, '5000', null]
  ])('splits %j', (ex, main, sub) => {
    expect(doseParts(ex)).toEqual({ main, sub })
  })

  it('reads on one line, and is empty for an item with no dose', () => {
    expect(formatDose({ sets: 3, reps: 10, hold: '3s' })).toBe('3 × 10, 3s hold each')
    expect(formatDose({ sets: 3, reps: 10 })).toBe('3 × 10')
    expect(formatDose({ name: 'Hand Foam Roll' })).toBe('')
  })

  it('names the equipment in an exercise', () => {
    expect(equipmentOf('Curl with Dumbbell').label).toBe('Dumbbell')
    expect(equipmentOf('Wall Slides')).toBeUndefined()
  })
})
