/**
 * Background gradient keyed to the actual time of day, reinforcing the app's
 * day-phase structure (and replacing the old random gradient roulette).
 * Phases run from `from` o'clock until the next phase; night wraps past
 * midnight. Each has a light- and dark-mode palette.
 */
const TIME_PHASES = [
  {
    from: 5, // dawn
    light: 'from-rose-100 via-amber-100 to-sky-100',
    dark: 'from-slate-900 via-rose-900 to-slate-900',
  },
  {
    from: 8, // morning
    light: 'from-sky-100 via-amber-50 to-blue-100',
    dark: 'from-gray-900 via-sky-900 to-gray-900',
  },
  {
    from: 11, // midday
    light: 'from-sky-100 via-cyan-100 to-blue-100',
    dark: 'from-gray-900 via-blue-900 to-gray-900',
  },
  {
    from: 15, // afternoon
    light: 'from-amber-100 via-orange-50 to-sky-100',
    dark: 'from-slate-900 via-indigo-900 to-slate-900',
  },
  {
    from: 18, // dusk
    light: 'from-orange-100 via-rose-100 to-violet-100',
    dark: 'from-slate-900 via-purple-900 to-slate-900',
  },
  {
    from: 21, // night
    light: 'from-indigo-100 via-slate-100 to-blue-100',
    dark: 'from-gray-950 via-indigo-950 to-gray-950',
  },
];

export function gradientForHour(hour, dark) {
  // Hours before dawn fall through to the night palette.
  const phase = TIME_PHASES.findLast((p) => hour >= p.from) ?? TIME_PHASES[TIME_PHASES.length - 1];
  return dark ? phase.dark : phase.light;
}
