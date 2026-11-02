import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTracker } from '../context/TrackerContext'
import { useWide } from '../hooks/useWide'
import DayLog from './DayLog'
import ItemGroup from './ItemGroup'
import Pips from './Pips'
import SessionPicker from './SessionPicker'

/**
 * Today: the one thing to do next, large, with what else the day holds under
 * it. The full choice of sessions is one tap away on a phone, and simply there
 * on a screen with room for it.
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
  const wide = useWide()
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const card = darkMode ? 'bg-gray-800' : 'bg-white'
  const link = 'relative hit-44 underline underline-offset-2 hover:no-underline'

  const hero = {
    resume: { title: names[next.id], button: 'Resume', run: () => actions.open(next.id) },
    pass: { title: `Hand session ${next.pass}`, button: 'Start session', run: actions.pass },
    session: { title: names[next.id], button: 'Start', run: () => actions.start(next.id, 'full') },
    once: { title: 'Putty and band work', button: 'Start', run: actions.once },
    wait: { title: `Hand session ${next.pass}`, button: null },
    rest: { title: 'Nothing else due today', button: null }
  }[next.kind]

  return (
    // One column on phones. From lg up, what else the day holds sits beside it.
    <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-x-6 lg:gap-y-5 lg:space-y-0">
      <section
        aria-label="Up next"
        className={`rounded-2xl p-5 ring-1 ring-blue-400/40 lg:p-6 ${card}`}
      >
        <div className="lg:flex lg:items-center lg:gap-6">
          <div className="min-w-0 lg:flex-1">
            <p className={`text-sm ${muted}`}>Up next</p>
            <h2 className="font-display mt-1 text-2xl font-semibold leading-tight lg:text-3xl">
              {hero.title}
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>{nextDetail}</p>
          </div>
          {hero.button && (
            <button
              type="button"
              onClick={hero.run}
              className="mt-4 min-h-14 w-full shrink-0 rounded-xl bg-blue-600 px-8 text-lg font-semibold text-white hover:bg-blue-500 lg:mt-0 lg:min-h-12 lg:w-auto lg:text-base"
            >
              {hero.button}
            </button>
          )}
        </div>
        {next.kind === 'session' && (
          <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${muted}`}>
            <button type="button" onClick={() => actions.start(next.id, 'short')} className={link}>
              Short version
            </button>
            {next.others.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => actions.start(id, 'full')}
                className={link}
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
        className={`rounded-xl p-2 lg:col-start-2 lg:row-span-3 lg:row-start-1 ${card}`}
      >
        <button
          type="button"
          onClick={actions.handTab}
          className={`mb-1 flex min-h-11 w-full items-center gap-3 border-b px-2 pb-1 text-left text-sm font-medium ${
            darkMode ? 'border-gray-700/50' : 'border-gray-200'
          }`}
        >
          <span className="flex-1">Hand sessions</span>
          <Pips done={hand.done} of={hand.perDay} />
          <span className={`tabular-nums ${hand.done >= hand.perDay ? 'text-green-500' : muted}`}>
            {hand.done} of {hand.perDay}
          </span>
          <ChevronRight size={16} className={`shrink-0 ${muted}`} />
        </button>
        {goals.map(({ category, label, list }) => (
          <ItemGroup key={category} scope="daily" category={category} label={label} list={list} />
        ))}
      </section>

      <div className="lg:col-start-1">
        {!wide && (
          <button
            type="button"
            onClick={() => setPicking((v) => !v)}
            aria-expanded={picking}
            className={`flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-sm ${card}`}
          >
            {picking ? 'Hide the other sessions' : 'Pick something else'}
            <ChevronDown size={16} className={`${muted} ${picking ? 'rotate-180' : ''}`} />
          </button>
        )}
        {(picking || wide) && (
          <div className="mt-2 lg:mt-0">
            <SessionPicker ranked={ranked} sizes={sizes} onStart={actions.start} />
          </div>
        )}
      </div>
    </div>
  )
}
