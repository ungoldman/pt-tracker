import { Check } from 'lucide-react'
import { useTracker } from '../context/TrackerContext'

/**
 * The sessions started on the shown day, open ones first, each with how far
 * it got and a way back in: Resume for one in progress, Open for one finished,
 * whether all done or stopped early. `quiet` drops the heading where the
 * page already names the day.
 */
export default function DayLog({ title, logged, onOpen, quiet = false }) {
  const { darkMode } = useTracker()
  if (!logged.length) return null
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <section aria-label={title} className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {!quiet && (
        <h2
          className={`px-3 pt-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
        >
          {title}
        </h2>
      )}
      <ul className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-200'}`}>
        {logged.map(({ session, entry, count }) => (
          <li key={session.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p
                className={`flex items-center gap-1.5 text-sm font-medium ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}
              >
                {entry.finished && count >= entry.total && (
                  <Check size={14} strokeWidth={3} className="shrink-0 text-green-500" />
                )}
                <span>
                  {session.name}
                  {entry.size === 'short' && <span className={muted}> (short)</span>}
                </span>
              </p>
              {entry.finished ? (
                <p className={`mt-0.5 text-xs tabular-nums ${muted}`}>
                  {count >= entry.total ? 'All done' : `Stopped at ${count} of ${entry.total}`}
                </p>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-1.5 flex-1 overflow-hidden rounded-full ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className="block h-full rounded-full bg-blue-500"
                      style={{ width: `${(count / entry.total) * 100}%` }}
                    />
                  </span>
                  <span className={`shrink-0 text-xs tabular-nums ${muted}`}>
                    {count} of {entry.total}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpen(session.id)}
              aria-label={`${entry.finished ? 'Open' : 'Resume'} ${session.name}`}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${
                entry.finished
                  ? darkMode
                    ? 'border border-gray-600 text-gray-200 hover:bg-gray-700'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {entry.finished ? 'Open' : 'Resume'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
