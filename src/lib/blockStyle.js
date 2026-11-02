import { CircleDot } from 'lucide-react'
import { exercises } from '../data'

// Accent palette keyed by color token, not block name, so renaming a block
// never desyncs its styling. Blocks pick a token via `accent` in data.js; the
// class strings are written out in full so Tailwind's JIT scanner sees them.
const ACCENTS = {
  amber: {
    textLight: 'text-amber-600',
    textDark: 'text-amber-400'
  },
  yellow: {
    textLight: 'text-yellow-600',
    textDark: 'text-yellow-400'
  },
  purple: {
    textLight: 'text-purple-600',
    textDark: 'text-purple-400'
  },
  indigo: {
    textLight: 'text-indigo-600',
    textDark: 'text-indigo-400'
  },
  teal: {
    textLight: 'text-teal-600',
    textDark: 'text-teal-400'
  },
  red: {
    textLight: 'text-red-600',
    textDark: 'text-red-400'
  },
  blue: {
    textLight: 'text-blue-600',
    textDark: 'text-blue-400'
  }
}

const FALLBACK = {
  Icon: CircleDot,
  textLight: 'text-blue-600',
  textDark: 'text-blue-400'
}

/** Resolve a block's icon + accent classes from its data.js definition. */
export function getBlockStyle(category) {
  const block = exercises[category]
  const accent = block && ACCENTS[block.accent]
  if (!accent) return FALLBACK
  return { Icon: block.icon ?? CircleDot, ...accent }
}
