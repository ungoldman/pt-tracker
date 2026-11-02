import { useState } from 'react'
import { useTracker } from '../context/TrackerContext'
import DayLog from './DayLog'
import Pips from './Pips'
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
  const card = `rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`
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

      <div className="space-y-2">
        <section aria-label={`${title} in detail`} className={`${card} py-3`}>
          <div className="flex items-baseline justify-between gap-3 px-3">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className={`text-sm tabular-nums ${muted}`}>
              Hand sessions: {hand.done} of {hand.perDay}
            </p>
          </div>
          {logged.length === 0 && (
            <p className={`mt-2 px-3 text-sm ${muted}`}>No shoulder or leg work.</p>
          )}
          <DayLog title={`${title}’s sessions`} logged={logged} onOpen={actions.open} quiet />
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            aria-expanded={adding}
            className={`relative hit-44 mt-2 px-3 text-sm underline-offset-2 hover:underline ${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            }`}
          >
            {adding ? 'Never mind' : `Add shoulder or leg work to ${dayName ?? 'today'}`}
          </button>
        </section>
        {adding && (
          <SessionPicker ranked={ranked} sizes={sizes} onStart={actions.start} dayName={dayName} />
        )}
      </div>

      <section aria-label="Left this week" className={`${card} p-3`}>
        <h2 className="text-base font-semibold">Left this week</h2>
        {left.length ? (
          <ul className="mt-2 space-y-2.5 text-sm">
            {left.map(({ name, credit, target, remaining }) => (
              <li key={name} className="flex items-center gap-3">
                <span className="min-w-0 flex-1">{name}</span>
                <Pips done={credit} of={target} />
                <span className={`w-12 shrink-0 text-right tabular-nums ${muted}`}>
                  {remaining}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={`mt-2 text-sm ${muted}`}>The week’s sessions are covered.</p>
        )}
      </section>
    </div>
  )
}
