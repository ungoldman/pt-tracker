import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { exerciseId } from '../src/lib/stats'

describe('exerciseId', () => {
  it('is a short base36 hash that depends only on the name', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        expect(exerciseId({ name: a })).toMatch(/^[0-9a-z]+$/)
        expect(exerciseId({ name: a, sets: 3 })).toBe(exerciseId({ name: a }))
        if (a === b) expect(exerciseId({ name: a })).toBe(exerciseId({ name: b }))
      })
    )
  })

  it('separates the names in use', () => {
    expect(exerciseId({ name: 'Row' })).not.toBe(exerciseId({ name: 'Press' }))
  })
})
