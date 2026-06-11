import { Sunrise, Star, Dumbbell, Timer, Moon, Target, CircleDot } from 'lucide-react';

/**
 * Per-block visual identity, keyed to the day-phase each block represents.
 * Class strings are written out in full so Tailwind's JIT scanner sees them.
 */
const BLOCK_STYLES = {
  'Wake-Up': {
    Icon: Sunrise,
    textLight: 'text-amber-600',
    textDark: 'text-amber-400',
    bar: 'bg-amber-500/80',
    top: 'border-t-amber-400/80',
  },
  Priority: {
    Icon: Star,
    textLight: 'text-yellow-600',
    textDark: 'text-yellow-400',
    bar: 'bg-yellow-500/80',
    top: 'border-t-yellow-400/80',
  },
  'Strength (M/W/F)': {
    Icon: Dumbbell,
    textLight: 'text-purple-600',
    textDark: 'text-purple-400',
    bar: 'bg-purple-500/80',
    top: 'border-t-purple-400/80',
  },
  'Isometrics (End of Day)': {
    Icon: Timer,
    textLight: 'text-sky-600',
    textDark: 'text-sky-400',
    bar: 'bg-sky-500/80',
    top: 'border-t-sky-400/80',
  },
  'Wind-Down': {
    Icon: Moon,
    textLight: 'text-indigo-600',
    textDark: 'text-indigo-400',
    bar: 'bg-indigo-500/80',
    top: 'border-t-indigo-400/80',
  },
  'Personal Goals (non-PT)': {
    Icon: Target,
    textLight: 'text-teal-600',
    textDark: 'text-teal-400',
    bar: 'bg-teal-500/80',
    top: 'border-t-teal-400/80',
  },
};

const FALLBACK = {
  Icon: CircleDot,
  textLight: 'text-blue-600',
  textDark: 'text-blue-400',
  bar: 'bg-blue-500/70',
  top: 'border-t-blue-400/70',
};

export function getBlockStyle(category) {
  return BLOCK_STYLES[category] ?? FALLBACK;
}
