import { useState } from 'react'
import { useTracker } from '../context/TrackerContext'
import DayLog from './DayLog'
import ItemGroup from './ItemGroup'
import SessionPicker from './SessionPicker'

/**
 * Today: the one thing to do next, large, with what else the day holds under
 * it. The full choice of sessions stays one tap away.
 */
export default function TodayTab({
  next,
  names,
  nextDetail,
  logged,
  hand,
  goals,
  ranked,
  sizes,
  actions
}) {
  const { darkMode } = useTracker()
  const [picking, setPicking] = useState(false)
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const card = darkMode ? 'bg-gray-800' : 'bg-white'

  const hero = {
    resume: { title: names[next.id], button: 'Resume', run: () => actions.open(next.id) },
    pass: { title: `Hand pass ${next.pass}`, button: 'Start pass', run: actions.pass },
    session: { title: names[next.id], button: 'Start', run: () => actions.start(next.id, 'full') },
    once: { title: 'Putty and band work', button: 'Start', run: actions.once },
    rest: { title: 'Nothing else due today', button: null }
  }[next.kind]

  return (
    // One column on phones. From lg up, what else the day holds sits beside it.
    <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-x-6 lg:gap-y-5 lg:space-y-0">
      <section
        aria-label="Up next"
        className={`rounded-2xl p-5 shadow-sm ring-1 ${card} ${
          next.kind === 'pass' ? 'ring-indigo-400/40' : 'ring-blue-400/40'
        }`}
      >
        <p className={`text-xs font-medium ${muted}`}>Up next</p>
        <h2 className="mt-1 text-xl font-semibold">{hero.title}</h2>
        <p className={`mt-1 text-sm ${muted}`}>{nextDetail}</p>
        {hero.button && (
          <button
            type="button"
            onClick={hero.run}
            className={`mt-4 w-full rounded-xl py-3 text-base font-medium text-white ${
              next.kind === 'pass' ? 'bg-indigo-500' : 'bg-blue-600'
            }`}
          >
            {hero.button}
          </button>
        )}
        {next.kind === 'session' && (
          <div className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${muted}`}>
            <button
              type="button"
              onClick={() => actions.start(next.id, 'short')}
              className="underline-offset-2 hover:underline"
            >
              Short version
            </button>
            {next.others.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => actions.start(id, 'full')}
                className="underline-offset-2 hover:underline"
              >
                or {names[id]}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="lg:col-start-1 empty:hidden">
        <DayLog title="Today so far" logged={logged} onOpen={actions.open} />
      </div>

      <section
        aria-label="Also today"
        className={`rounded-xl p-2 shadow-sm lg:col-start-2 lg:row-span-3 lg:row-start-1 ${card}`}
      >
        <button
          type="button"
          onClick={actions.handTab}
          className="flex w-full items-center justify-between px-2 py-2 text-left text-sm"
        >
          <span>Hand passes</span>
          <span className={`tabular-nums ${hand.done >= hand.perDay ? 'text-green-500' : muted}`}>
            {hand.done} of {hand.perDay}
          </span>
        </button>
        {goals.map(({ category, label, list }) => (
          <ItemGroup key={category} scope="daily" category={category} label={label} list={list} />
        ))}
      </section>

      <div className="lg:col-start-1">
        <button
          type="button"
          onClick={() => setPicking((v) => !v)}
          aria-expanded={picking}
          className={`px-1 text-sm underline-offset-2 hover:underline ${muted}`}
        >
          {picking ? 'Hide the other sessions' : 'Pick something else'}
        </button>
        {picking && (
          <div className="mt-2">
            <SessionPicker ranked={ranked} sizes={sizes} onStart={actions.start} />
          </div>
        )}
      </div>
    </div>
  )
}
