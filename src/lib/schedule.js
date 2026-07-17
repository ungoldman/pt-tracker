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

/** A day is a strength/training day if the Strength block is scheduled on it. */
export function isStrengthDay(blocks) {
  return blocks.some(({ category }) => category.startsWith('Strength'))
}
