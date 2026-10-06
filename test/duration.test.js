import { describe, expect, it } from 'vitest'
import { estimateBlock, estimateMinutes, exerciseSeconds, holdPlan } from '../src/lib/duration'

describe('exerciseSeconds', () => {
  it.each([
    ['reps with a hold each', { sets: 2, reps: 5, hold: '10s' }, 2 * 5 * 10 + 20],
    ['holds in place of reps', { sets: 3, hold: '30s' }, 3 * 30 + 40],
    ['plain reps', { sets: 3, reps: 10 }, 3 * 10 * 3.5 + 40],
    ['a timed rep string, one set', { reps: '30s' }, 30],
    ['a goal with no timing', { target: 5000 }, 0],
    ['a hold that is not seconds', { hold: 'long', reps: 'many' }, 0]
  ])('%s', (_label, ex, seconds) => {
    expect(exerciseSeconds(ex)).toBe(seconds)
  })
})

describe('estimates', () => {
  it('rounds up to five minutes and is zero when nothing is timed', () => {
    expect(estimateMinutes([{ sets: 1, reps: 1 }])).toBe(5)
    expect(
      estimateMinutes([
        { sets: 3, hold: '30s' },
        { sets: 3, hold: '30s' }
      ])
    ).toBe(5)
    expect(
      estimateMinutes([
        { sets: 4, hold: '30s' },
        { sets: 4, hold: '30s' }
      ])
    ).toBe(10)
    expect(estimateMinutes([{ target: 1 }])).toBe(0)
  })

  it('lets a block opt out or override', () => {
    const list = [{ sets: 3, reps: 10 }]
    expect(estimateBlock({ noEstimate: true, minutes: 9 }, list)).toEqual({
      minutes: 0,
      exact: false
    })
    expect(estimateBlock({ minutes: 12 }, list)).toEqual({ minutes: 12, exact: true })
    expect(estimateBlock({}, list)).toEqual({ minutes: 5, exact: false })
    expect(estimateBlock(undefined, list)).toEqual({ minutes: 5, exact: false })
  })
})

describe('holdPlan', () => {
  it.each([
    [
      'a hold per rep counts every rep',
      { sets: 1, reps: 8, hold: '10s' },
      { seconds: 10, count: 8 }
    ],
    ['a hold per set', { sets: 3, hold: '30s' }, { seconds: 30, count: 3 }],
    ['no sets means one', { reps: 3, hold: '20s' }, { seconds: 20, count: 3 }],
    ['a timed rep string', { sets: 3, reps: '30s' }, { seconds: 30, count: 3 }],
    ['a hold with a non-numeric rep', { hold: '15s', reps: 'each side' }, { seconds: 15, count: 1 }]
  ])('%s', (_label, ex, plan) => {
    expect(holdPlan(ex)).toEqual(plan)
  })

  it('has no plan for short holds or untimed work', () => {
    expect(holdPlan({ sets: 3, reps: 10, hold: '3s' })).toBeNull()
    expect(holdPlan({ sets: 3, reps: 10 })).toBeNull()
    expect(holdPlan({ target: 5000 })).toBeNull()
  })
})
