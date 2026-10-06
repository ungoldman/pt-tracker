import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { categoryStats, completionKey, dayStats, exerciseId, isCompleted } from '../src/lib/stats'

const ex = (name, extra = {}) => ({ ex: { name, ...extra } })

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

describe('completion', () => {
  it('keys by day, block, and id', () => {
    expect(completionKey('Monday', 'legs', 'abc')).toBe('Monday-legs-abc')
  })

  it('reads a missing or false key as not done', () => {
    const done = { 'Monday-legs-a': true, 'Monday-legs-b': false }
    expect(isCompleted(done, 'Monday', 'legs', 'a')).toBe(true)
    expect(isCompleted(done, 'Monday', 'legs', 'b')).toBe(false)
    expect(isCompleted(done, 'Monday', 'legs', 'c')).toBe(false)
  })

  it('counts a block', () => {
    const scheduled = [ex('Row'), ex('Press')]
    const done = { [completionKey('Monday', 'legs', exerciseId({ name: 'Row' }))]: true }
    expect(categoryStats(done, 'Monday', 'legs', scheduled)).toEqual({
      completedCount: 1,
      total: 2
    })
  })
})

describe('dayStats', () => {
  const blocks = [
    { category: 'a', sourceDay: 'Monday', exercises: [ex('Row', { priority: true }), ex('Press')] },
    { category: 'b', sourceDay: 'Sunday', exercises: [ex('Curl', { priority: true })] }
  ]

  it('is all zeroes for an empty day', () => {
    expect(dayStats({}, [])).toEqual({
      completedToday: 0,
      totalToday: 0,
      pct: 0,
      priorityDone: 0,
      priorityTotal: 0
    })
  })

  it('keys each block by its own sourceDay and tracks priority work', () => {
    const done = {
      [completionKey('Monday', 'a', exerciseId({ name: 'Row' }))]: true,
      [completionKey('Sunday', 'b', exerciseId({ name: 'Curl' }))]: true,
      // The same block under the day it is shown on must not count.
      [completionKey('Monday', 'b', exerciseId({ name: 'Curl' }))]: true,
      'Monday-a-orphan': true
    }
    expect(dayStats(done, blocks)).toEqual({
      completedToday: 2,
      totalToday: 3,
      pct: 67,
      priorityDone: 2,
      priorityTotal: 2
    })
  })
})
