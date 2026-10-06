import { describe, expect, it, vi } from 'vitest'
import { DAYS, getExercisesForDay } from '../src/lib/schedule'
import { exerciseId } from '../src/lib/stats'

// The real program. Its content changes often, so this checks its shape and
// the invariants storage depends on, never specific exercises.
const { exercises } = await vi.importActual('../src/data')
const ACCENTS = ['amber', 'yellow', 'purple', 'indigo', 'teal', 'red', 'blue']
const validDays = (days) => days === undefined || days.every((day) => DAYS.includes(day))

describe('the program in data.js', () => {
  const blocks = Object.entries(exercises)

  it('has blocks', () => {
    expect(blocks.length).toBeGreaterThan(0)
  })

  it.each(blocks)('%s is a well-formed block', (_key, block) => {
    expect(block.displayName).toBeTypeOf('string')
    expect(Number.isInteger(block.lane) && block.lane >= 0).toBe(true)
    expect(ACCENTS).toContain(block.accent)
    expect(block.icon).toBeDefined()
    expect(validDays(block.days)).toBe(true)
    expect(block.exercises.length).toBeGreaterThan(0)
    for (const ex of block.exercises) {
      expect(ex.name).toBeTypeOf('string')
      expect(validDays(ex.days)).toBe(true)
    }
  })

  // Completion and notes are keyed by block plus a hash of the exercise name,
  // so two exercises in a block must never hash alike.
  it.each(blocks)('%s has no two exercises sharing a storage id', (_key, block) => {
    const ids = block.exercises.map(exerciseId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('schedules something on every day', () => {
    for (const day of DAYS) expect(getExercisesForDay(exercises, day).length).toBeGreaterThan(0)
  })
})
