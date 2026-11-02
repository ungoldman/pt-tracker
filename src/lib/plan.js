import { exerciseId } from './stats'

// History is one map keyed by local date, so a week's progress and how long
// since a session was last done both read off the same record, across weeks:
//
//   { '2026-10-29': {
//       daily: { [itemKey]: true, or a pass count for a `perDay` item },
//       sessions: { [sessionId]: { size, total, done: { [itemKey]: true }, finished } }
//   } }
//
// Session entries record `total` when started, so their credit never depends
// on the program as it is now.

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Noon, so adding days never crosses a DST edge into the wrong date.
export const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function addDays(key, n) {
  const date = parseKey(key)
  date.setDate(date.getDate() + n)
  return dateKey(date)
}

export const daysBetween = (from, to) => Math.round((parseKey(to) - parseKey(from)) / 86400000)

/** The seven date keys of the Monday-to-Sunday week holding `key`. */
export function weekOf(key) {
  const monday = addDays(key, -((parseKey(key).getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, n) => addDays(monday, n))
}

export const itemKey = (category, ex) => `${category}-${exerciseId(ex)}`

// A stretch names an exercise, wherever it lives. test/data.test.js checks
// every name resolves.
const findByName = (program, name) =>
  Object.entries(program).flatMap(([category, block]) =>
    block.exercises.filter((ex) => ex.name === name).map((ex) => ({ category, ex }))
  )[0]

const blockItems = (program, category) =>
  program[category].exercises.map((ex) => ({ category, ex }))

/**
 * What a session asks for, as { category, ex } in order: warm-up, the work,
 * then the stretches. A short session is the starred work, or the first half
 * when fewer than two are starred, plus the first stretch.
 */
export function sessionItems(program, session, size) {
  const warmup = session.warmup ? blockItems(program, session.warmup) : []
  const work = session.blocks.flatMap((category) => blockItems(program, category))
  const stretches = (session.stretches ?? []).map((name) => findByName(program, name))
  if (size === 'full') return [...warmup, ...work, ...stretches]
  const starred = work.filter(({ ex }) => ex.priority)
  const core = starred.length >= 2 ? starred : work.slice(0, Math.ceil(work.length / 2))
  return [...core, ...stretches.slice(0, 1)]
}

const SIZE_CREDIT = { full: 1, short: 0.5 }

export const doneCount = (entry) => Object.values(entry.done).filter(Boolean).length

/**
 * What an entry counts toward its weekly target: its size (one for full, half
 * for short) in proportion to the work checked off. Stopping early still
 * counts what was done, and only finishing everything earns the whole size.
 */
export function entryCredit(entry) {
  return SIZE_CREDIT[entry.size] * Math.min(1, doneCount(entry) / entry.total)
}

const entryOn = (history, key, id) => history[key]?.sessions?.[id]

const creditOn = (history, key, id) => {
  const entry = entryOn(history, key, id)
  return entry ? entryCredit(entry) : 0
}

export const weekCredit = (history, today, id) =>
  weekOf(today)
    .filter((key) => key <= today)
    .reduce((sum, key) => sum + creditOn(history, key, id), 0)

/** Days since a session last earned credit, or null if not in history. */
export function lastDone(history, today, id) {
  const keys = Object.keys(history)
    .filter((key) => key <= today && creditOn(history, key, id) > 0)
    .sort()
  return keys.length ? daysBetween(keys.at(-1), today) : null
}

/** True when a strength session earned credit yesterday. */
export function strengthRest(sessions, history, today) {
  const yesterday = addDays(today, -1)
  return sessions.some((s) => s.strength && creditOn(history, yesterday, s.id) > 0)
}

/** How many sessions, and how many strength ones, were started on a day. */
export function dayLoad(sessions, history, key) {
  const started = sessions.filter((s) => entryOn(history, key, s.id))
  return { sessions: started.length, strength: started.filter((s) => s.strength).length }
}

/**
 * Every session with its standing for the day, best pick first. Available ones
 * lead, ranked by the share of the weekly target still open (so a twice-a-week
 * session does not outrank a once-a-week one just by having more to do), then
 * by how long since it was last done, never done counting as longest. Strength
 * rests the day after strength, and once the day holds `strengthPerDay` of it.
 * `resting` says which, or is null.
 */
export function rankSessions(sessions, history, today, limits) {
  const rest = strengthRest(sessions, history, today)
    ? 'yesterday'
    : dayLoad(sessions, history, today).strength >= limits.strengthPerDay
      ? 'today'
      : null
  return sessions
    .map((session) => {
      const credit = weekCredit(history, today, session.id)
      const entry = entryOn(history, today, session.id)
      return {
        session,
        credit,
        owed: Math.max(0, session.perWeek - credit) / session.perWeek,
        since: lastDone(history, today, session.id),
        resting: session.strength ? rest : null,
        started: Boolean(entry),
        finished: Boolean(entry?.finished)
      }
    })
    .sort(
      (a, b) =>
        Number(Boolean(a.resting || a.started)) - Number(Boolean(b.resting || b.started)) ||
        b.owed - a.owed ||
        (b.since ?? Infinity) - (a.since ?? Infinity)
    )
}

/** Sessions done or credited per day of this week, for the week strip. */
export function weekStrip(sessions, history, today) {
  return weekOf(today).map((key) => ({
    key,
    entries: sessions
      .map((session) => ({
        session,
        entry: entryOn(history, key, session.id),
        credit: creditOn(history, key, session.id)
      }))
      .filter(({ entry }) => entry)
  }))
}

export function weekTotals(sessions, history, today) {
  return {
    done: sessions.reduce(
      (sum, s) => sum + Math.min(weekCredit(history, today, s.id), s.perWeek),
      0
    ),
    target: sessions.reduce((sum, s) => sum + s.perWeek, 0)
  }
}

/** Passes logged for a daily item, from a count or an older true. */
export const passes = (value) => Number(value ?? 0)

/** Full passes of the `perDay` items in the daily blocks: the fewest done. */
export function dailyPasses(program, blocks, day) {
  const items = blocks.flatMap((category) =>
    program[category].exercises
      .filter((ex) => ex.perDay)
      .map((ex) => ({ key: itemKey(category, ex), perDay: ex.perDay }))
  )
  if (!items.length) return null
  return {
    done: Math.min(...items.map(({ key }) => passes(day?.daily?.[key]))),
    perDay: Math.max(...items.map(({ perDay }) => perDay))
  }
}

/**
 * The daily blocks split by how they are done: `pass` items run several times
 * a day (`perDay`), `once` items run once a day, `goals` are a number to hit
 * (`target`), and `ambient` ones are worn or used as needed, never a task.
 */
export function dailyParts(program, blocks) {
  const all = blocks.flatMap((category) => blockItems(program, category))
  return {
    pass: all.filter(({ ex }) => ex.perDay),
    once: all.filter(({ ex }) => !ex.perDay && !ex.target && !ex.ambient),
    goals: all.filter(({ ex }) => ex.target),
    ambient: all.filter(({ ex }) => ex.ambient)
  }
}

// When each pass is due: one by late morning, two by late afternoon. Time and
// place are what a habit hangs on, so passes are tied to the time of day.
const PASS_DUE = [11, 16]

// Least time between hand passes. A chosen spacing, not a prescribed one.
const PASS_GAP_MS = 2 * 60 * 60 * 1000

/**
 * The one thing to do next on a day, in order: finish an open session, catch
 * up a hand pass that is due, take the top session while the day has room,
 * then any hand pass left, then the once-a-day work, then rest. A pass is not
 * offered within PASS_GAP_MS of the last one, however late the day, so they
 * stay spread out. Until then the rest of the list goes ahead of it, and `wait`
 * says when it comes back if that is still today.
 */
export function upNext({ ranked, plenty, hand, onceLeft, hour, now }) {
  const open = ranked.find((r) => r.started && !r.finished)
  if (open) return { kind: 'resume', id: open.session.id }
  const due = 1 + PASS_DUE.filter((h) => hour >= h).length
  const backAt = (hand?.lastPass ?? -PASS_GAP_MS) + PASS_GAP_MS
  const ready = now >= backAt
  if (hand && ready && hand.done < Math.min(due, hand.perDay)) {
    return { kind: 'pass', pass: hand.done + 1 }
  }
  const offers = ranked.filter((r) => !r.started && !r.resting)
  if (!plenty && offers.length) {
    return {
      kind: 'session',
      id: offers[0].session.id,
      others: offers.slice(1, 3).map((r) => r.session.id)
    }
  }
  const left = hand && hand.done < hand.perDay
  if (left && ready) return { kind: 'pass', pass: hand.done + 1 }
  if (onceLeft > 0) return { kind: 'once' }
  // An hour earlier than this one means the gap runs past midnight.
  if (left && new Date(backAt).getHours() >= hour) {
    return { kind: 'wait', pass: hand.done + 1, at: backAt }
  }
  return { kind: 'rest' }
}

/** Days this week a daily item was checked, through today. */
export const weekCount = (history, today, key) =>
  weekOf(today).filter((day) => day <= today && history[day]?.daily?.[key]).length

/** Drop days older than `keep` days, so storage stays small. */
export function prune(history, today, keep = 70) {
  const cutoff = addDays(today, -keep)
  return Object.fromEntries(Object.entries(history).filter(([key]) => key >= cutoff))
}
