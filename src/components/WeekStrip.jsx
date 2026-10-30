import { useTracker } from '../context/TrackerContext'
import { doneCount, parseKey } from '../lib/plan'

// Marks shown per day before the rest fold into a count.
const SHOWN = 3

// Written out in full so Tailwind's scanner sees every class.
const MARK = {
  strength: {
    full: 'border-purple-500 bg-purple-500',
    part: 'border-purple-500/40 bg-purple-500/40',
    open: 'border-purple-500'
  },
  light: {
    full: 'border-teal-500 bg-teal-500',
    part: 'border-teal-500/40 bg-teal-500/40',
    open: 'border-teal-500'
  }
}

/**
 * This week, Monday to Sunday: one mark per session each day. Everything done
 * is solid, some of it is faint, and none yet is an outline. Each day up to
 * today opens that day.
 */
export default function WeekStrip({ strip, today, shown, onSelect }) {
  const { darkMode } = useTracker()
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <section
      aria-label="This week"
      className={`rounded-xl p-3 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <ol className="grid grid-cols-7 gap-1">
        {strip.map(({ key, entries }) => {
          const date = parseKey(key)
          const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
          const isToday = key === today
          return (
            <li key={key}>
              <button
                type="button"
                disabled={key > today}
                onClick={() => onSelect(key)}
                aria-pressed={key === shown}
                aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long' })}: ${
                  entries.length
                    ? entries.map(({ session }) => session.name).join(', ')
                    : 'nothing yet'
                }`}
                className={`flex min-h-16 w-full flex-col items-center gap-1 rounded-md py-1.5 disabled:opacity-40 ${
                  key === shown
                    ? darkMode
                      ? 'bg-gray-700 ring-1 ring-gray-400'
                      : 'bg-gray-100 ring-1 ring-gray-400'
                    : darkMode
                      ? 'enabled:hover:bg-gray-700/50'
                      : 'enabled:hover:bg-gray-100'
                }`}
              >
                <span
                  className={`text-[11px] ${
                    isToday
                      ? `font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`
                      : muted
                  }`}
                >
                  {isToday ? 'Today' : weekday}
                </span>
                {entries.slice(0, SHOWN).map(({ session, entry }) => {
                  const count = doneCount(entry)
                  const fill = count >= entry.total ? 'full' : count > 0 ? 'part' : 'open'
                  return (
                    <span
                      key={session.id}
                      title={session.name}
                      className={`block h-3 w-4/5 rounded-sm border ${MARK[session.strength ? 'strength' : 'light'][fill]}`}
                    />
                  )
                })}
                {entries.length > SHOWN && (
                  <span className={`text-[10px] ${muted}`}>+{entries.length - SHOWN}</span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
      <p className={`mt-2 text-xs ${muted}`}>
        Tap a day to see or add to it. Purple is shoulder weights, a faint mark is part done.
      </p>
    </section>
  )
}
