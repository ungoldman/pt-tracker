import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  addDays,
  dailyParts,
  dailyPasses,
  dateKey,
  dayLoad,
  daysBetween,
  doneCount,
  entryCredit,
  itemKey,
  lastDone,
  parseKey,
  passes,
  prune,
  rankSessions,
  sessionItems,
  strengthRest,
  upNext,
  weekCount,
  weekCredit,
  weekOf,
  weekStrip,
  weekTotals
} from '../src/lib/plan'
import { exerciseId } from '../src/lib/stats'
import { exercises, limits, sessions } from './fixtures/program'

const [push, pull, odds, mobility] = sessions
const names = (items) => items.map(({ ex }) => ex.name)
// An entry with `count` of `total` checked off.
const entry = (size, total, count = total, finished = true) => ({
  size,
  total,
  done: Object.fromEntries(Array.from({ length: total }, (_, n) => [`k${n}`, n < count])),
  finished
})
const full = (count) => entry('full', 4, count)
const short = (count) => entry('short', 2, count)
const on = (id, e) => ({ sessions: { [id]: e } })

// Tuesday. Its week runs Monday 10-05 to Sunday 10-11.
const TODAY = '2026-10-06'

describe('dates', () => {
  it('keys a local date, padded', () => {
    expect(dateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('reads a key back at local noon', () => {
    const date = parseKey('2026-03-08')
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 2, 8, 12
    ])
  })

  it('adds days across month, year, and daylight-saving edges', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09')
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31')
  })

  it('counts whole days, and adding then counting round-trips', () => {
    fc.assert(
      fc.property(fc.integer({ min: -800, max: 800 }), (n) => {
        expect(daysBetween(TODAY, addDays(TODAY, n))).toBe(n)
      })
    )
  })

  it('runs a week Monday to Sunday', () => {
    expect(weekOf(TODAY)).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11'
    ])
    expect(weekOf('2026-10-11')[0]).toBe('2026-10-05')
    expect(weekOf('2026-10-05')[6]).toBe('2026-10-11')
  })
})

describe('sessionItems', () => {
  it('keys an item by block and exercise', () => {
    const ex = { name: 'Row' }
    expect(itemKey('Pull', ex)).toBe(`Pull-${exerciseId(ex)}`)
  })

  it('runs warm-up, work, then stretches for a full session', () => {
    expect(names(sessionItems(exercises, push, 'full'))).toEqual([
      'Arm Circles',
      'Wall Slides',
      'Press with Dumbbell (5)',
      'Fly with Dumbbell',
      'Curl with Dumbbell',
      'Doorway Stretch',
      'Sleeper Stretch'
    ])
    expect(sessionItems(exercises, push, 'full').at(-1).category).toBe('mobility')
  })

  it('cuts a short session to the starred work and the first stretch', () => {
    expect(names(sessionItems(exercises, push, 'short'))).toEqual([
      'Press with Dumbbell (5)',
      'Fly with Dumbbell',
      'Doorway Stretch'
    ])
  })

  it('falls back to the first half when fewer than two are starred', () => {
    expect(names(sessionItems(exercises, pull, 'short'))).toEqual([
      'Row with Resistance',
      'Sleeper Stretch'
    ])
    expect(names(sessionItems(exercises, odds, 'short'))).toEqual(['Odd One'])
    expect(names(sessionItems(exercises, odds, 'full'))).toEqual(['Odd One'])
    expect(names(sessionItems(exercises, mobility, 'short'))).toEqual(['Doorway Stretch'])
  })
})

describe('entryCredit', () => {
  it('counts a session by its size in proportion to what was done', () => {
    expect(entryCredit(full())).toBe(1)
    expect(entryCredit(full(1))).toBe(0.25)
    expect(entryCredit(short())).toBe(0.5)
    expect(entryCredit(short(1))).toBe(0.25)
    expect(entryCredit(full(0))).toBe(0)
  })

  it('counts in-progress work the same as stopped work', () => {
    expect(entryCredit(entry('full', 4, 2, false))).toBe(0.5)
  })

  it('never counts past the whole size', () => {
    const extra = { ...full(), done: { ...full().done, extra: true } }
    expect(doneCount(extra)).toBe(5)
    expect(entryCredit(extra)).toBe(1)
  })
})

describe('the week', () => {
  const history = {
    // Last week: does not count toward this one, but is the last time done.
    '2026-09-30': on('pull', full()),
    '2026-10-05': { sessions: { push: full(), odds: short() } },
    '2026-10-06': on('push', full(2)),
    // Next week, as if from a wrong clock: ignored.
    '2026-10-12': on('push', full())
  }

  it('sums this week’s credit through today', () => {
    expect(weekCredit(history, TODAY, 'push')).toBe(1.5)
    expect(weekCredit(history, TODAY, 'odds')).toBe(0.5)
    expect(weekCredit(history, TODAY, 'pull')).toBe(0)
  })

  it('finds the last day a session earned credit, across weeks', () => {
    expect(lastDone(history, TODAY, 'push')).toBe(0)
    expect(lastDone(history, TODAY, 'pull')).toBe(6)
    expect(lastDone(history, TODAY, 'mobility')).toBe(null)
    // Started with nothing done is not done.
    expect(lastDone({ [TODAY]: on('odds', full(0)) }, TODAY, 'odds')).toBe(null)
  })

  it('rests strength the day after it earned credit', () => {
    expect(strengthRest(sessions, history, TODAY)).toBe(true)
    expect(strengthRest(sessions, history, '2026-10-08')).toBe(false)
    expect(strengthRest(sessions, { '2026-10-05': on('odds', full()) }, TODAY)).toBe(false)
  })

  it('counts what a day holds', () => {
    expect(dayLoad(sessions, history, '2026-10-05')).toEqual({ sessions: 2, strength: 1 })
    expect(dayLoad(sessions, history, '2026-10-07')).toEqual({ sessions: 0, strength: 0 })
  })

  it('totals the week, capped at each target', () => {
    const extra = { ...history, '2026-10-06': { sessions: { odds: full(), push: full() } } }
    expect(weekTotals(sessions, extra, TODAY)).toEqual({ done: 3, target: 6 })
  })

  it('lists what was started each day', () => {
    const strip = weekStrip(sessions, history, TODAY)
    expect(strip.map(({ key }) => key)).toEqual(weekOf(TODAY))
    expect(strip[0].entries.map(({ session, credit }) => [session.id, credit])).toEqual([
      ['push', 1],
      ['odds', 0.5]
    ])
    expect(strip[1].entries.map(({ credit }) => credit)).toEqual([0.5])
    expect(strip[2].entries).toEqual([])
  })

  it('counts the days a daily item was checked', () => {
    const daily = {
      '2026-10-04': { daily: { run: true } },
      '2026-10-05': { daily: { run: true } },
      '2026-10-06': { daily: { run: 2, steps: false } },
      '2026-10-07': { daily: { run: true } }
    }
    expect(weekCount(daily, TODAY, 'run')).toBe(2)
    expect(weekCount(daily, TODAY, 'steps')).toBe(0)
  })
})

describe('daily passes', () => {
  const glide = itemKey('hand', exercises.hand.exercises[0])

  it('reads a count, an older true, or nothing', () => {
    expect(passes(2)).toBe(2)
    expect(passes(true)).toBe(1)
    expect(passes(false)).toBe(0)
    expect(passes(undefined)).toBe(0)
  })

  it('counts the fewest passes across the per-day items', () => {
    expect(dailyPasses(exercises, ['hand'], undefined)).toEqual({ done: 0, perDay: 3 })
    expect(dailyPasses(exercises, ['hand'], { daily: { [glide]: 2 } })).toEqual({
      done: 2,
      perDay: 3
    })
  })

  it('has nothing to count without per-day items', () => {
    expect(dailyPasses(exercises, ['goals'], {})).toBe(null)
  })
})

describe('rankSessions', () => {
  const ids = (ranked) => ranked.map(({ session }) => session.id)

  it('keeps program order when nothing separates them', () => {
    expect(ids(rankSessions(sessions, {}, TODAY, limits))).toEqual([
      'push',
      'pull',
      'odds',
      'mobility'
    ])
  })

  it('puts the largest open share first, then the longest wait', () => {
    const history = {
      '2026-09-20': on('odds', full()),
      '2026-09-25': on('pull', full()),
      '2026-10-05': on('mobility', full())
    }
    const ranked = rankSessions(sessions, history, '2026-10-07', limits)
    // Push owes all of 2. Pull and odds owe all of 1, odds waited longer.
    // Mobility owes half of 2.
    expect(ids(ranked)).toEqual(['push', 'odds', 'pull', 'mobility'])
    expect(ranked[0]).toMatchObject({ credit: 0, owed: 1, since: null, resting: null })
    expect(ranked[3]).toMatchObject({ credit: 1, owed: 0.5, since: 2 })
  })

  it('sinks a resting or already started session, and marks finished ones', () => {
    const history = {
      '2026-10-05': on('push', full()),
      '2026-10-06': { sessions: { odds: full(), mobility: entry('full', 4, 0, false) } }
    }
    const ranked = rankSessions(sessions, history, TODAY, limits)
    // Held-back sessions still order by what they owe among themselves.
    expect(ids(ranked)).toEqual(['pull', 'mobility', 'push', 'odds'])
    expect(ranked[1]).toMatchObject({ started: true, finished: false })
    expect(ranked[2]).toMatchObject({ resting: 'yesterday', started: false })
    expect(ranked[3]).toMatchObject({ started: true, finished: true, owed: 0 })
  })

  it('rests strength once the day holds enough of it', () => {
    const history = { [TODAY]: on('push', full(1)) }
    const ranked = rankSessions(sessions, history, TODAY, limits)
    expect(ranked.find((r) => r.session.id === 'pull').resting).toBe('today')
    expect(ranked.find((r) => r.session.id === 'odds').resting).toBe(null)
    expect(
      rankSessions(sessions, history, TODAY, { ...limits, strengthPerDay: 2 }).find(
        (r) => r.session.id === 'pull'
      ).resting
    ).toBe(null)
  })
})

describe('prune', () => {
  it('drops days older than the window', () => {
    const history = { '2026-07-28': {}, '2026-07-29': {}, [TODAY]: {} }
    expect(Object.keys(prune(history, TODAY))).toEqual(['2026-07-28', '2026-07-29', TODAY])
    expect(Object.keys(prune(history, TODAY, 69))).toEqual(['2026-07-29', TODAY])
  })
})

describe('dailyParts', () => {
  it('splits the daily blocks by how each is done', () => {
    const parts = dailyParts(exercises, ['hand', 'goals'])
    expect(names(parts.pass)).toEqual(['Tendon Glide'])
    expect(names(parts.once)).toEqual(['Overhead Reach with Dowel'])
    expect(names(parts.goals)).toEqual(['Daily Steps', 'Run'])
    expect(names(parts.ambient)).toEqual(['Wear Brace'])
  })
})

describe('upNext', () => {
  const rankedOn = (history) => rankSessions(sessions, history, TODAY, limits)
  const hand = (done) => ({ done, perDay: 3 })
  const base = { ranked: rankedOn({}), plenty: false, hand: hand(0), onceLeft: 1, hour: 9, now: 0 }

  it('finishes an open session first', () => {
    const ranked = rankedOn({ [TODAY]: on('odds', entry('full', 4, 1, false)) })
    expect(upNext({ ...base, ranked })).toEqual({ kind: 'resume', id: 'odds' })
  })

  it('catches up a hand pass that is due by the time of day', () => {
    expect(upNext(base)).toEqual({ kind: 'pass', pass: 1 })
    expect(upNext({ ...base, hand: hand(1), hour: 12 })).toEqual({ kind: 'pass', pass: 2 })
    expect(upNext({ ...base, hand: hand(2), hour: 18 })).toEqual({ kind: 'pass', pass: 3 })
  })

  it('leaves a gap after a pass, however overdue the next one is', () => {
    const at = new Date('2026-10-06T18:50:00').getTime()
    const hour = 18
    const later = { ...base, hand: { ...hand(1), lastPass: at }, hour, now: at + 60_000 }
    expect(upNext(later).kind).toBe('session')
    expect(upNext({ ...later, plenty: true })).toEqual({ kind: 'once' })
    expect(upNext({ ...later, plenty: true, onceLeft: 0 })).toEqual({
      kind: 'wait',
      pass: 2,
      at: at + 2 * 60 * 60 * 1000
    })
    expect(upNext({ ...later, now: at + 2 * 60 * 60 * 1000 })).toEqual({ kind: 'pass', pass: 2 })
  })

  it('rests when the gap runs past midnight', () => {
    const at = new Date('2026-10-06T23:00:00').getTime()
    const late = { ...base, plenty: true, onceLeft: 0, hour: 23, now: at + 60_000 }
    expect(upNext({ ...late, hand: { ...hand(1), lastPass: at } })).toEqual({ kind: 'rest' })
  })

  it('then offers the top session, with two others', () => {
    expect(upNext({ ...base, hand: hand(1) })).toEqual({
      kind: 'session',
      id: 'push',
      others: ['pull', 'odds']
    })
  })

  it('then any pass left, the once-a-day work, and rest', () => {
    expect(upNext({ ...base, hand: hand(1), plenty: true })).toEqual({ kind: 'pass', pass: 2 })
    expect(upNext({ ...base, hand: hand(3), plenty: true })).toEqual({ kind: 'once' })
    expect(upNext({ ...base, hand: hand(3), plenty: true, onceLeft: 0 })).toEqual({
      kind: 'rest'
    })
  })

  it('works without per-day items', () => {
    expect(upNext({ ...base, hand: null, plenty: true, onceLeft: 0 })).toEqual({ kind: 'rest' })
  })
})
