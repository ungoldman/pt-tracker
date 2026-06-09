/** Completion is stored in one flat map keyed by day+block+original index. */
export const completionKey = (day, category, index) => `${day}-${category}-${index}`;

export const isCompleted = (completed, day, category, index) =>
  !!completed[completionKey(day, category, index)];

/** Completed / total for one block's scheduled exercises. */
export function categoryStats(completed, day, category, scheduled) {
  const total = scheduled.length;
  const completedCount = scheduled.reduce(
    (acc, { index }) => acc + (isCompleted(completed, day, category, index) ? 1 : 0),
    0
  );
  return { completedCount, total };
}

/**
 * Aggregate stats for a day's scheduled blocks. Counts only scheduled
 * exercises, so orphaned localStorage keys (removed categories/exercises, or
 * other days sharing the weekday label) can't inflate the totals.
 */
export function dayStats(completed, blocks, day) {
  let totalToday = 0;
  let completedToday = 0;
  let priorityTotal = 0;
  let priorityDone = 0;
  blocks.forEach(({ category, exercises }) => {
    exercises.forEach(({ ex, index }) => {
      totalToday += 1;
      const done = isCompleted(completed, day, category, index);
      if (done) completedToday += 1;
      if (ex.priority === 'high') {
        priorityTotal += 1;
        if (done) priorityDone += 1;
      }
    });
  });
  const pct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  return { completedToday, totalToday, pct, priorityDone, priorityTotal };
}
