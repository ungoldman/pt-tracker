import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  DAYS,
  getExercisesForDay,
  groupLabel,
  isGated,
  isStrengthDay,
  moveKey,
  resolveSchedule,
  SKIP,
  strengthClashes,
  unfinishedGroups
} from '../src/lib/schedule'
import { completionKey, exerciseId } from '../src/lib/stats'

const MWF = ['Monday', 'Wednesday', 'Friday']

// A small program with every scheduling shape: daily, block-gated, strength,
// and a block that mixes a gated exercise with a per-exercise override.
const program = {
  daily: { displayName: 'Daily', exercises: [{ name: 'Walk' }, { name: 'Stretch' }] },
  upper: {
    displayName: 'Upper',
    strength: true,
    days: MWF,
    exercises: [{ name: 'Press' }, { name: 'Row' }]
  },
  lower: { displayName: 'Lower', strength: true, days: MWF, exercises: [{ name: 'Squat' }] },
  run: {
    days: MWF,
    exercises: [{ name: 'Strides' }, { name: 'Run', days: ['Sunday', 'Tuesday'] }]
  },
  never: { days: [], exercises: [{ name: 'Unscheduled' }] }
}
const order = Object.keys(program)
const base = Object.fromEntries(DAYS.map((day) => [day, getExercisesForDay(program, day)]))
const names = (blocks) => blocks.map(({ category }) => category)
const keysOf = (resolved) =>
  DAYS.flatMap((day) =>
    resolved[day].blocks.flatMap(({ category, sourceDay, exercises }) =>
      exercises.map(({ ex }) => completionKey(sourceDay, category, exerciseId(ex)))
    )
  ).sort()

describe('getExercisesForDay', () => {
  it('resolves a per-exercise schedule over the block schedule over daily', () => {
    expect(names(base.Monday)).toEqual(['daily', 'upper', 'lower', 'run'])
    expect(base.Monday[3].exercises.map(({ ex }) => ex.name)).toEqual(['Strides'])
    expect(names(base.Tuesday)).toEqual(['daily', 'run'])
    expect(base.Tuesday[1].exercises.map(({ ex }) => ex.name)).toEqual(['Run'])
    expect(names(base.Thursday)).toEqual(['daily'])
  })

  it('knows a strength day by its blocks', () => {
    expect(isStrengthDay(program, base.Monday)).toBe(true)
    expect(isStrengthDay(program, base.Tuesday)).toBe(false)
    expect(isStrengthDay(program, [{ category: 'gone' }])).toBe(false)
  })
})

describe('isGated', () => {
  it('needs every scheduled exercise to be day-gated', () => {
    expect(isGated(program.upper, base.Monday[1].exercises)).toBe(true)
    expect(isGated(program.daily, base.Monday[0].exercises)).toBe(false)
    expect(isGated(undefined, [{ ex: { name: 'x', days: MWF } }])).toBe(true)
    expect(isGated(undefined, [{ ex: { name: 'x' } }])).toBe(false)
  })
})

describe('resolveSchedule', () => {
  it('is the base schedule when nothing has moved', () => {
    const resolved = resolveSchedule(base, {}, order)
    for (const day of DAYS) {
      expect(names(resolved[day].blocks)).toEqual(names(base[day]))
      expect(resolved[day].blocks.every(({ sourceDay }) => sourceDay === day)).toBe(true)
      expect(resolved[day].away).toEqual([])
    }
  })

  it('moves a block, keeps its source day, and leaves a note where it was', () => {
    const resolved = resolveSchedule(base, { [moveKey('Monday', 'upper')]: 'Tuesday' }, order)
    expect(names(resolved.Monday.blocks)).toEqual(['daily', 'lower', 'run'])
    expect(resolved.Monday.away).toEqual([
      { category: 'upper', sourceDay: 'Monday', to: 'Tuesday' }
    ])
    expect(resolved.Tuesday.blocks.map((b) => `${b.category}@${b.sourceDay}`)).toEqual([
      'daily@Tuesday',
      'upper@Monday',
      'run@Tuesday'
    ])
  })

  it("puts a day's own block ahead of the same block moved in", () => {
    const resolved = resolveSchedule(base, { [moveKey('Monday', 'run')]: 'Tuesday' }, order)
    expect(resolved.Tuesday.blocks.map((b) => `${b.category}@${b.sourceDay}`)).toEqual([
      'daily@Tuesday',
      'run@Tuesday',
      'run@Monday'
    ])
  })

  it('skips a block without placing it anywhere', () => {
    const resolved = resolveSchedule(base, { [moveKey('Monday', 'daily')]: SKIP }, order)
    expect(names(resolved.Monday.blocks)).toEqual(['upper', 'lower', 'run'])
    expect(resolved.Monday.away).toEqual([{ category: 'daily', sourceDay: 'Monday', to: SKIP }])
  })

  it('ignores moves that no longer match the schedule', () => {
    const stale = {
      [moveKey('Monday', 'upper')]: 'Monday',
      [moveKey('Monday', 'lower')]: 'Someday',
      [moveKey('Tuesday', 'upper')]: 'Friday',
      [moveKey('Monday', 'deleted')]: 'Friday'
    }
    expect(resolveSchedule(base, stale, order)).toEqual(resolveSchedule(base, {}, order))
  })

  it('never loses or invents an exercise, whatever the moves say', () => {
    const slots = DAYS.flatMap((day) => [...order, 'ghost'].map((c) => moveKey(day, c)))
    const moves = fc.dictionary(
      fc.constantFrom(...slots),
      fc.constantFrom(...DAYS, SKIP, 'Someday', '')
    )
    fc.assert(
      fc.property(moves, (map) => {
        const resolved = resolveSchedule(base, map, order)
        const skipped = DAYS.flatMap((day) =>
          resolved[day].away
            .filter(({ to }) => to === SKIP)
            .flatMap(({ category }) =>
              base[day]
                .find((block) => block.category === category)
                .exercises.map(({ ex }) => completionKey(day, category, exerciseId(ex)))
            )
        )
        // Storage identity survives every move: what is placed plus what is
        // skipped is exactly the base schedule's key set.
        expect([...keysOf(resolved), ...skipped].sort()).toEqual(
          keysOf(resolveSchedule(base, {}, order))
        )
        for (const day of DAYS) {
          for (const { sourceDay, to } of resolved[day].away) {
            expect(sourceDay).toBe(day)
            expect(to).not.toBe(day)
          }
        }
      })
    )
  })
})

describe('strengthClashes', () => {
  it('is empty for the program as written', () => {
    expect(strengthClashes(program, resolveSchedule(base, {}, order))).toEqual({})
  })

  it('names the neighbors of a strength day moved next to another', () => {
    const resolved = resolveSchedule(base, { [moveKey('Monday', 'upper')]: 'Tuesday' }, order)
    expect(strengthClashes(program, resolved)).toEqual({
      Monday: ['Tuesday'],
      Tuesday: ['Monday', 'Wednesday'],
      Wednesday: ['Tuesday']
    })
  })

  it('does not wrap the week', () => {
    const moves = {
      [moveKey('Monday', 'upper')]: 'Sunday',
      [moveKey('Friday', 'upper')]: 'Saturday'
    }
    const clashes = strengthClashes(program, resolveSchedule(base, moves, order))
    expect(clashes.Sunday).toEqual(['Monday'])
    expect(clashes.Saturday).toEqual(['Friday'])
  })
})

describe('unfinishedGroups', () => {
  const done = (day, category, name) => ({
    [completionKey(day, category, exerciseId({ name }))]: true
  })
  const monday = resolveSchedule(base, {}, order).Monday.blocks

  it('pulls strength as one session and everything else alone, skipping daily work', () => {
    const groups = unfinishedGroups(program, monday, {})
    expect(groups.map((group) => names(group))).toEqual([['upper', 'lower'], ['run']])
    expect(groupLabel(program, groups[0], 'Monday')).toBe('Strength (2)')
    expect(groupLabel(program, groups[1], 'Monday')).toBe('run')
  })

  it('leaves out finished blocks and names a lone strength block', () => {
    const completed = {
      ...done('Monday', 'lower', 'Squat'),
      ...done('Monday', 'run', 'Strides')
    }
    const groups = unfinishedGroups(program, monday, completed)
    expect(groups.map((group) => names(group))).toEqual([['upper']])
    expect(groupLabel(program, groups[0], 'Monday')).toBe('Upper')
  })

  it('keeps a session moved onto a day apart from that day’s own', () => {
    const moves = Object.fromEntries(
      ['upper', 'lower'].map((category) => [moveKey('Monday', category), 'Wednesday'])
    )
    const { blocks } = resolveSchedule(base, moves, order).Wednesday
    const groups = unfinishedGroups(program, blocks, {})
    expect(groups.map((group) => group.map((b) => `${b.category}@${b.sourceDay}`))).toEqual([
      ['upper@Wednesday', 'lower@Wednesday'],
      ['upper@Monday', 'lower@Monday'],
      ['run@Wednesday']
    ])
    expect(groupLabel(program, groups[0], 'Wednesday')).toBe('Strength (2)')
    expect(groupLabel(program, groups[1], 'Wednesday')).toBe('Strength (2) from Mon')
  })
})
