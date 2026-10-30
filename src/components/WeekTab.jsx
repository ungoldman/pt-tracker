import { useState } from 'react'
import { useTracker } from '../context/TrackerContext'
import DayLog from './DayLog'
import SessionPicker from './SessionPicker'
import WeekStrip from './WeekStrip'

/**
 * The week: the strip, the chosen day's detail with a way to add to it, and
 * what the week still has room for.
 */
export default function WeekTab({
  strip,
  today,
  shown,
  dayName,
  logged,
  hand,
  ranked,
  sizes,
  left,
  actions
}) {
  const { darkMode } = useTracker()
  const [adding, setAdding] = useState(false)
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const title = dayName ?? 'Today'

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6 lg:gap-y-5 lg:space-y-0">
      <div className="lg:col-span-2">
        <WeekStrip
          strip={strip}
          today={today}
          shown={shown}
          onSelect={(key) => {
            setAdding(false)
            actions.select(key)
          }}
        />
      </div>

      <section aria-label={`${title} in detail`}>
        <h2 className="px-1 text-base font-semibold">{title}</h2>
        <p className={`px-1 text-sm ${muted}`}>
          Hand passes: {hand.done} of {hand.perDay}
        </p>
        {logged.length === 0 && <p className={`mt-2 px-1 text-sm ${muted}`}>No sessions.</p>}
        <div className="mt-2">
          <DayLog title={`${title}’s sessions`} logged={logged} onOpen={actions.open} quiet />
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          aria-expanded={adding}
          className="mt-3 px-1 text-sm text-blue-500 underline-offset-2 hover:underline"
        >
          {adding ? 'Never mind' : `Add a session to ${dayName ?? 'today'}`}
        </button>
        {adding && (
          <div className="mt-2">
            <SessionPicker
              ranked={ranked}
              sizes={sizes}
              onStart={actions.start}
              dayName={dayName}
            />
          </div>
        )}
      </section>

      <section aria-label="Left this week">
        <h2 className="px-1 text-base font-semibold">Left this week</h2>
        {left.length ? (
          <ul
            className={`mt-2 space-y-1.5 px-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            {left.map(({ name, remaining }) => (
              <li key={name}>
                {name}, {remaining}
              </li>
            ))}
          </ul>
        ) : (
          <p className={`mt-2 px-1 text-sm ${muted}`}>The week’s sessions are covered.</p>
        )}
      </section>
    </div>
  )
}
