/**
 * Durable per-exercise identity: a short, position-independent hash of the
 * name (FNV-1a → base36). Reordering or inserting exercises no longer shifts
 * keys; only renaming an exercise changes its id (acceptable — a renamed or
 * reweighted move is effectively a new prescription).
 */
function hashString(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

export const exerciseId = (ex) => hashString(ex.name)

/** Completion is stored in one flat map keyed by day + block + durable id. */
export const completionKey = (day, category, id) => `${day}-${category}-${id}`

export const isCompleted = (completed, day, category, id) =>
  !!completed[completionKey(day, category, id)]

/** Completed / total for one block's scheduled exercises. */
export function categoryStats(completed, day, category, scheduled) {
  const total = scheduled.length
  const completedCount = scheduled.reduce(
    (acc, { ex }) => acc + (isCompleted(completed, day, category, exerciseId(ex)) ? 1 : 0),
    0
  )
  return { completedCount, total }
}

/**
 * Aggregate stats for a day's scheduled blocks. Counts only scheduled
 * exercises, so orphaned localStorage keys (removed categories/exercises, or
 * other days sharing the weekday label) can't inflate the totals.
 */
export function dayStats(completed, blocks, day) {
  let totalToday = 0
  let completedToday = 0
  let priorityTotal = 0
  let priorityDone = 0
  blocks.forEach(({ category, exercises }) => {
    exercises.forEach(({ ex }) => {
      totalToday += 1
      const done = isCompleted(completed, day, category, exerciseId(ex))
      if (done) completedToday += 1
      // Priority is now defined by block membership, not a per-exercise prop.
      if (category === 'Priority') {
        priorityTotal += 1
        if (done) priorityDone += 1
      }
    })
  })
  const pct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
  return { completedToday, totalToday, pct, priorityDone, priorityTotal }
}
