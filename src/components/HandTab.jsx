import { Check } from 'lucide-react'
import { useTracker } from '../context/TrackerContext'
import ItemGroup from './ItemGroup'

// Spread any number of passes over the three parts of the day.
const when = (n, of) => ['morning', 'midday', 'evening'][Math.floor(((n - 1) * 3) / of)]

/**
 * The hand work for today: the passes in order, the once-a-day work, and what
 * is worn or used as needed. Only the next pass can be started, so the passes
 * stay spread through the day rather than run back to back.
 */
export default function HandTab({ hand, passMinutes, once, ambient, onPass, onOnce }) {
  const { darkMode } = useTracker()
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const card = `rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`
  const passes = Array.from({ length: hand.perDay }, (_, n) => n + 1)

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
      <ol
        aria-label="Hand sessions"
        className={`divide-y lg:row-span-2 ${card} ${
          darkMode ? 'divide-gray-700/50' : 'divide-gray-200'
        }`}
      >
        {passes.map((n) => {
          const done = n <= hand.done
          const next = n === hand.done + 1
          return (
            <li key={n} className="flex items-center gap-3 px-4 py-4">
              {done ? (
                <Check size={18} strokeWidth={3} className="shrink-0 text-green-500" />
              ) : (
                <span
                  className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                    next ? 'border-blue-500' : 'border-gray-500'
                  }`}
                />
              )}
              <span className={`flex-1 ${done || next ? '' : muted}`}>
                <span className="block text-base">Session {n}</span>
                <span className={`text-xs ${muted}`}>
                  {when(n, hand.perDay)}, {hand.size} exercises, about {passMinutes} min
                </span>
              </span>
              {next && (
                <button
                  type="button"
                  onClick={onPass}
                  className="relative hit-44 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Start
                </button>
              )}
            </li>
          )
        })}
      </ol>

      {once.count > 0 && (
        <section aria-label="Once a day" className={`flex items-center gap-3 px-4 py-4 ${card}`}>
          <span className="flex-1">
            <span className="block text-base">Putty and band work</span>
            <span className={`text-xs ${muted}`}>
              once a day, {once.done} of {once.count} done
            </span>
          </span>
          <button
            type="button"
            onClick={onOnce}
            className={`relative hit-44 rounded-lg px-4 py-2 text-sm ${
              darkMode ? 'border border-gray-600' : 'border border-gray-300'
            }`}
          >
            {once.done ? 'Open' : 'Start'}
          </button>
        </section>
      )}

      {ambient.map(({ category, list }) => (
        <section key={category} className={`p-2 ${card}`}>
          <ItemGroup scope="daily" category={category} label="Through the day" list={list} />
        </section>
      ))}
    </div>
  )
}
