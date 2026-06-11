export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Returns the exercises scheduled for `day`, grouped by block:
 *   [{ category, exercises: [{ ex, index }] }]
 *
 * Scheduling: a per-exercise `days` array wins; otherwise the block's `days`;
 * otherwise the exercise is daily. The original array `index` is preserved so
 * completion/note keys (`${day}-${category}-${index}`) stay stable as the
 * visible list is filtered per day. Blocks with nothing scheduled are dropped.
 */
export function getExercisesForDay(exercises, day) {
  const result = [];
  Object.entries(exercises).forEach(([category, data]) => {
    const scheduled = data.exercises
      .map((ex, index) => ({ ex, index }))
      .filter(({ ex }) => {
        const sched = ex.days || data.days;
        return !sched || sched.includes(day);
      });
    if (scheduled.length > 0) {
      result.push({ category, exercises: scheduled });
    }
  });
  return result;
}

/** A day is a strength/training day if the Strength block is scheduled on it. */
export function isStrengthDay(blocks) {
  return blocks.some(({ category }) => category.startsWith('Strength'));
}
