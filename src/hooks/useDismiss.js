import { useEffect } from 'react'

/**
 * Calls `onDismiss` on Escape or a pointer press outside `refs`, while `open`.
 * `refs` is one ref or a list, for a control whose panel is portaled elsewhere.
 * Pass a stable value (a ref, or refs that never change identity).
 */
export function useDismiss(refs, open, onDismiss) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: refs are read at event time; a list literal is new every render and would resubscribe for nothing.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      const inside = [refs].flat().some((ref) => ref.current?.contains(e.target))
      if (!inside) onDismiss()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onDismiss])
}
