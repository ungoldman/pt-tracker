// Rough session-time estimate for a block, in minutes. Heuristic, not exact —
// a block can override it with a `minutes` field in data.js (see estimateBlock).
const REP_TEMPO = 3.5 // seconds per controlled PT rep
const REST = 20 // seconds rest between sets

// Pull a seconds value out of a duration string like "30s"; null otherwise.
const parseSeconds = (v) => {
  if (typeof v === 'string') {
    const m = v.match(/^(\d+)\s*s$/i)
    if (m) return Number(m[1])
  }
  return null
}

/** Estimated seconds for one exercise; 0 for untimeable goals (steps, jog). */
export function exerciseSeconds(ex) {
  const sets = ex.sets || 1
  const rest = (sets - 1) * REST
  const hold = parseSeconds(ex.hold)
  if (hold != null) return sets * hold + rest
  if (typeof ex.reps === 'number') return sets * ex.reps * REP_TEMPO + rest
  const repHold = parseSeconds(ex.reps) // some stretches use reps: "30s"
  if (repHold != null) return sets * repHold + rest
  return 0
}

/**
 * Minutes for a list of exercises, rounded up to the nearest 5, or 0 when
 * nothing in the block can be timed. `exercises` is the plain ex objects for
 * the day's scheduled subset.
 */
export function estimateMinutes(exercises) {
  const total = exercises.reduce((sum, ex) => sum + exerciseSeconds(ex), 0)
  return total > 0 ? Math.ceil(total / 60 / 5) * 5 : 0
}

/**
 * Block estimate as { minutes, exact }. A block can opt out entirely with
 * `noEstimate: true` (e.g. Personal Goals, dominated by untimed steps/jog).
 * A numeric `block.minutes` override wins and is reported as exact (no "~");
 * otherwise it's computed.
 */
export function estimateBlock(block, scheduledExercises) {
  if (block?.noEstimate) return { minutes: 0, exact: false }
  if (typeof block?.minutes === 'number') return { minutes: block.minutes, exact: true }
  return { minutes: estimateMinutes(scheduledExercises), exact: false }
}
