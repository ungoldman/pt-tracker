// Rough time estimate for a list of exercises, in minutes. A heuristic, not exact.
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

// Shorter holds are part of the rep's tempo, not something to run a timer on.
const MIN_TIMED_HOLD = 10

/**
 * Hold-timer plan for an exercise built on timed holds, as { seconds, count },
 * or null when it has none worth timing. `count` is the number of holds.
 */
export function holdPlan(ex) {
  const sets = ex.sets || 1
  const hold = parseSeconds(ex.hold)
  const seconds = hold ?? parseSeconds(ex.reps)
  if (seconds == null || seconds < MIN_TIMED_HOLD) return null
  const count = hold != null && typeof ex.reps === 'number' ? sets * ex.reps : sets
  return { seconds, count }
}

/** Estimated seconds for one exercise; 0 for untimeable goals (steps, jog). */
export function exerciseSeconds(ex) {
  const sets = ex.sets || 1
  const rest = (sets - 1) * REST
  const hold = parseSeconds(ex.hold)
  if (hold != null && typeof ex.reps === 'number') return sets * ex.reps * hold + rest
  if (hold != null) return sets * hold + rest
  if (typeof ex.reps === 'number') return sets * ex.reps * REP_TEMPO + rest
  const repHold = parseSeconds(ex.reps) // some stretches use reps: "30s"
  if (repHold != null) return sets * repHold + rest
  return 0
}

/**
 * Minutes for a list of exercises, rounded up to the nearest 5, or 0 when
 * nothing in the list can be timed.
 */
export function estimateMinutes(exercises) {
  const total = exercises.reduce((sum, ex) => sum + exerciseSeconds(ex), 0)
  return total > 0 ? Math.ceil(total / 60 / 5) * 5 : 0
}
