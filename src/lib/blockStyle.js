import { CircleDot } from 'lucide-react'
import { exercises } from '../data'

// Accent palette keyed by color token, not block name, so renaming a block
// never desyncs its styling. Blocks pick a token via `accent` in data.js; the
// class strings are written out in full so Tailwind's JIT scanner sees them.
const ACCENTS = {
  amber: {
    textLight: 'text-amber-600',
    textDark: 'text-amber-400',
    bar: 'bg-amber-500/80',
    top: 'border-t-amber-400/80'
  },
  yellow: {
    textLight: 'text-yellow-600',
    textDark: 'text-yellow-400',
    bar: 'bg-yellow-500/80',
    top: 'border-t-yellow-400/80'
  },
  purple: {
    textLight: 'text-purple-600',
    textDark: 'text-purple-400',
    bar: 'bg-purple-500/80',
    top: 'border-t-purple-400/80'
  },
  indigo: {
    textLight: 'text-indigo-600',
    textDark: 'text-indigo-400',
    bar: 'bg-indigo-500/80',
    top: 'border-t-indigo-400/80'
  },
  teal: {
    textLight: 'text-teal-600',
    textDark: 'text-teal-400',
    bar: 'bg-teal-500/80',
    top: 'border-t-teal-400/80'
  }
}

const FALLBACK = {
  Icon: CircleDot,
  textLight: 'text-blue-600',
  textDark: 'text-blue-400',
  bar: 'bg-blue-500/70',
  top: 'border-t-blue-400/70'
}

/** Resolve a block's icon + accent classes from its data.js definition. */
export function getBlockStyle(category) {
  const block = exercises[category]
  const accent = block && ACCENTS[block.accent]
  if (!accent) return FALLBACK
  return { Icon: block.icon ?? CircleDot, ...accent }
}
