import { categoryStats } from './stats'

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Returns the exercises scheduled for `day`, grouped by block:
 *   [{ category, exercises: [{ ex }] }]
 *
 * Scheduling: a per-exercise `days` array wins; otherwise the block's `days`;
 * otherwise the exercise is daily. Completion/note identity comes from the
 * exercise itself (see `exerciseId` in stats.js), not its position, so no
 * index is carried. Blocks with nothing scheduled are dropped.
 */
export function getExercisesForDay(exercises, day) {
  const result = []
  Object.entries(exercises).forEach(([category, data]) => {
    const scheduled = data.exercises
      .map((ex) => ({ ex }))
      .filter(({ ex }) => {
        const sched = ex.days || data.days
        return !sched || sched.includes(day)
      })
    if (scheduled.length > 0) {
      result.push({ category, exercises: scheduled })
    }
  })
  return result
}

/** A day is a strength day if any block flagged `strength` is scheduled on it. */
export function isStrengthDay(exercises, blocks) {
  return blocks.some(({ category }) => exercises[category]?.strength)
}

/** Move value for a block dropped from the week rather than sent to a day. */
export const SKIP = 'skip'

/** Moves are keyed by the block's scheduled day, the same day its completion keys use. */
export const moveKey = (sourceDay, category) => `${sourceDay}-${category}`

/**
 * Only a block whose scheduled exercises are all day-gated can move to another
 * day. Moving a daily exercise would land it on a day that already has it.
 */
export const isGated = (block, scheduled) => scheduled.every(({ ex }) => ex.days || block?.days)

/**
 * Applies `moves` ({ [moveKey]: day | SKIP }) to the static schedule:
 *   { [day]: { blocks: [{ category, sourceDay, exercises }], away: [{ category, sourceDay, to }] } }
 *
 * A moved block keeps `sourceDay` as its storage identity, so moving it never
 * touches completion or notes and two instances of one block can share a day.
 * `away` lists what left `day`. Entries that no longer match the schedule are
 * ignored, so a stale move can't hide or invent a block.
 */
export function resolveSchedule(baseByDay, moves, categoryOrder) {
  const resolved = Object.fromEntries(DAYS.map((day) => [day, { blocks: [], away: [] }]))
  DAYS.forEach((sourceDay) => {
    baseByDay[sourceDay].forEach(({ category, exercises }) => {
      const to = moves[moveKey(sourceDay, category)]
      const valid = to === SKIP || (DAYS.includes(to) && to !== sourceDay)
      if (!valid) {
        resolved[sourceDay].blocks.push({ category, sourceDay, exercises })
        return
      }
      resolved[sourceDay].away.push({ category, sourceDay, to })
      if (to !== SKIP) resolved[to].blocks.push({ category, sourceDay, exercises })
    })
  })
  // Data order, with a day's own block ahead of one moved in beside it.
  DAYS.forEach((day) => {
    const rank = ({ category, sourceDay }) =>
      categoryOrder.indexOf(category) * 2 + (sourceDay === day ? 0 : 1)
    resolved[day].blocks.sort((a, b) => rank(a) - rank(b))
  })
  return resolved
}

/** Strength days that sit next to another strength day, as { [day]: [neighbors] }. */
export function strengthClashes(exercises, resolved) {
  const strong = DAYS.map((day) => isStrengthDay(exercises, resolved[day].blocks))
  const clashes = {}
  DAYS.forEach((day, i) => {
    if (!strong[i]) return
    const neighbors = [DAYS[i - 1], DAYS[i + 1]].filter((d) => d && strong[DAYS.indexOf(d)])
    if (neighbors.length > 0) clashes[day] = neighbors
  })
  return clashes
}

/**
 * A day's unfinished movable blocks, grouped the way they move: strength
 * blocks as one session per day they were scheduled on, then every other
 * block alone. Grouping by scheduled day keeps a session that was moved onto
 * a day separate from that day's own, so pulling one never drags the other.
 */
export function unfinishedGroups(exercises, blocks, completed) {
  const unfinished = blocks.filter(({ category, sourceDay, exercises: scheduled }) => {
    const { completedCount, total } = categoryStats(completed, sourceDay, category, scheduled)
    return completedCount < total && isGated(exercises[category], scheduled)
  })
  const sessions = new Map()
  const singles = []
  unfinished.forEach((block) => {
    if (!exercises[block.category]?.strength) singles.push([block])
    else sessions.set(block.sourceDay, [...(sessions.get(block.sourceDay) ?? []), block])
  })
  return [...sessions.values(), ...singles]
}

/**
 * Label for a group from unfinishedGroups, as listed under `day`. A group
 * scheduled on another day says so.
 */
export function groupLabel(exercises, group, day) {
  const [{ category, sourceDay }] = group
  const name =
    group.length > 1 ? `Strength (${group.length})` : exercises[category]?.displayName || category
  return sourceDay === day ? name : `${name} from ${sourceDay.slice(0, 3)}`
}
