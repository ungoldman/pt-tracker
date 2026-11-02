import { useEffect } from 'react'

/**
 * Keep the screen awake while `active`. The lock drops whenever the tab is
 * hidden, so take it again on return.
 */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !navigator.wakeLock) return undefined
    let lock = null
    let released = false
    const acquire = async () => {
      try {
        const next = await navigator.wakeLock.request('screen')
        if (released) next.release()
        else lock = next
      } catch {
        // Denied or unsupported (low battery, insecure origin): run without it.
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release()
    }
  }, [active])
}
