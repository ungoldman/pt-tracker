import { useSyncExternalStore } from 'react'

// Tailwind's lg, where a tab has room for what a phone keeps a tap away.
const QUERY = '(min-width: 1024px)'

const subscribe = (notify) => {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

export const useWide = () => useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches)
