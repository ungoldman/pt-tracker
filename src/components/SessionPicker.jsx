import { useState } from 'react'
import { useTracker } from '../context/TrackerContext'

const OFFERED = 3

// Only sessions not started on the shown day show this, so it is never zero.
const sinceText = (since) =>
  since === null ? 'not done yet' : since === 1 ? 'yesterday' : `${since} days ago`

/**
 * The day's choice: the top few sessions by what the week still owes, each in
 * a full or short size, with the rest one tap away. A session resting the
 * shoulder is held back from the offer but can still be picked from the list.
 * `dayName` is set when the shown day is an earlier one, to log after the fact.
 */
export default function SessionPicker({ ranked, sizes, onStart, dayName }) {
  const { darkMode } = useTracker()
  const [showAll, setShowAll] = useState(false)
  const started = ranked.some((r) => r.started)
  const available = ranked.filter((r) => !r.started && !r.resting)
  const offered = available.slice(0, OFFERED)
  const rest = ranked.filter((r) => !offered.includes(r) && !r.started)
  const resting = ranked.find((r) => r.resting)?.resting
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'

  const heading = dayName
    ? `Add a session to ${dayName}`
    : started
      ? 'Room for another?'
      : 'Pick today’s session'

  const option = (r, highlight) => (
    <li key={r.session.id} className="px-3 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          {r.session.name}
        </span>
        <span className={`shrink-0 text-xs ${muted}`}>
          {r.resting ? 'rest the shoulder' : sinceText(r.since)}, {r.credit} of {r.session.perWeek}{' '}
          this week
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {['full', 'short'].map((size) => {
          const { minutes, count } = sizes(r.session, size)
          const primary = highlight && size === 'full'
          return (
            <button
              key={size}
              type="button"
              onClick={() => onStart(r.session.id, size)}
              aria-label={`Start ${r.session.name}, ${size}, about ${minutes} minutes`}
              className={`rounded-md px-3 py-1.5 text-left text-sm ${
                primary
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : darkMode
                    ? 'border border-gray-600 text-gray-200 hover:bg-gray-700'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {minutes} min{size === 'short' ? ', short' : ''}
              <span className={`block text-[11px] ${primary ? 'text-blue-100' : muted}`}>
                {count} exercises
              </span>
            </button>
          )
        })}
      </div>
    </li>
  )

  const card = `rounded-xl shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`
  const title = `px-3 pt-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`

  if (!available.length && !rest.length) {
    return (
      <section aria-label="Pick a session" className={`${card} pb-3`}>
        <h2 className={title}>Every session is in</h2>
      </section>
    )
  }

  return (
    <section aria-label="Pick a session" className={card}>
      <h2 className={title}>{heading}</h2>
      <ul className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-200'}`}>
        {offered.map((r, n) => option(r, n === 0 && !started && !dayName))}
      </ul>
      {resting && !showAll && (
        <p className={`px-3 text-xs ${muted}`}>
          {resting === 'yesterday'
            ? 'Shoulder weights the day before, so this leans lighter.'
            : 'That’s enough shoulder weights for one day.'}
        </p>
      )}
      {rest.length > 0 && (
        <div className="px-3 pt-1 pb-3">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            className={`text-xs underline-offset-2 hover:underline ${muted}`}
          >
            {showAll ? 'Fewer sessions' : `All sessions (${rest.length} more)`}
          </button>
        </div>
      )}
      {showAll && (
        <ul
          className={`divide-y border-t ${
            darkMode ? 'divide-gray-700/50 border-gray-700' : 'divide-gray-200 border-gray-200'
          }`}
        >
          {rest.map((r) => option(r, false))}
        </ul>
      )}
    </section>
  )
}
