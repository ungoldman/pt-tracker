import { createContext, useContext } from 'react'

/**
 * Shared tracker state + handlers for the day/block/row tree, so DayCard and
 * CategoryBlock don't have to drill a dozen props each. ExerciseRow stays
 * prop-driven (and memoized) on purpose: it reads nothing from context, so its
 * note-keystroke re-renders stay scoped to the edited row.
 */
export const TrackerContext = createContext(null)

export function useTracker() {
  const ctx = useContext(TrackerContext)
  if (!ctx) throw new Error('useTracker must be used within a TrackerContext provider')
  return ctx
}
