import { useCallback, useRef } from 'react'

// Long enough to cover a double tap, short enough that a deliberate undo lands.
const DOUBLE_TAP_MS = 350

/**
 * For a tap that toggles. Returns a check that is false for the second tap of
 * a double tap, which would otherwise undo what the first one did.
 */
export function useSingleTap() {
  const last = useRef(-DOUBLE_TAP_MS)
  return useCallback(() => {
    const now = Date.now()
    if (now - last.current < DOUBLE_TAP_MS) return false
    last.current = now
    return true
  }, [])
}
