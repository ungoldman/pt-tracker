import { CalendarSync, TriangleAlert } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTracker } from '../context/TrackerContext'
import { exercises } from '../data'
import { useDismiss } from '../hooks/useDismiss'
import { DAYS, isGated } from '../lib/schedule'
import { categoryStats } from '../lib/stats'
import MovePanel from './MovePanel'

const isStrength = ({ category }) => exercises[category]?.strength
const nameOf = ({ category }) => exercises[category]?.displayName || category

/**
 * Day-level moves, in both directions. Sends every strength block on `day`
 * somewhere else in one go, since a strength session is several blocks, and
 * pulls unfinished blocks in from other days ("missed it yesterday, doing it
 * today"). Also flags a day whose strength work sits next to another strength
 * day. The parent must be a wrapping flex row: the panel takes a full line
 * below it.
 */
export default function DayMoves({ day, blocks }) {
  const { darkMode, viewMode, completed, schedule, moveBlock, strengthClash } = useTracker()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  const session = blocks.filter(isStrength)
  const moved = session.filter(({ sourceDay }) => sourceDay !== day)
  const clash = strengthClash[day]
  const clashText =
    clash && `Strength back to back with ${clash.map((d) => d.slice(0, 3)).join(' and ')}`

  // Week columns are too narrow for the sentence, so there the button carries
  // the warning as its color and label.
  const compact = viewMode === 'week'
  const amber = darkMode ? 'text-amber-400/80' : 'text-amber-600'
  const warn = clash && compact
  const label = `Move blocks to or from ${day}`

  const send = (list, to) => {
    for (const { sourceDay, category } of list) moveBlock(sourceDay, category, to)
    setOpen(false)
  }

  // What other days still owe: their unfinished movable blocks, nearest past
  // day first. A day's strength blocks pull as one session.
  const pullable = () => {
    const idx = DAYS.indexOf(day)
    const others = [...DAYS.slice(0, idx).reverse(), ...DAYS.slice(idx + 1)]
    return others
      .map((from) => {
        const unfinished = schedule[from].blocks.filter((block) => {
          const { completedCount, total } = categoryStats(
            completed,
            block.sourceDay,
            block.category,
            block.exercises
          )
          return completedCount < total && isGated(exercises[block.category], block.exercises)
        })
        const strength = unfinished.filter(isStrength)
        const groups = unfinished.filter((block) => !isStrength(block)).map((block) => [block])
        if (strength.length > 0) groups.unshift(strength)
        return { from, groups }
      })
      .filter(({ groups }) => groups.length > 0)
  }

  const muted = darkMode ? 'text-gray-500' : 'text-gray-400'
  const chip = `px-2 py-1 rounded transition-colors ${
    darkMode
      ? 'text-gray-200 hover:bg-blue-700 hover:text-white'
      : 'text-gray-700 hover:bg-blue-600 hover:text-white'
  }`

  return (
    <div ref={ref} className="contents">
      {clash && !compact && (
        <span className={`self-center flex items-center gap-1 text-[11px] font-normal ${amber}`}>
          <TriangleAlert size={12} className="flex-shrink-0" />
          {clashText}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={warn ? `${label}. ${clashText}` : label}
        aria-expanded={open}
        title={warn ? `${clashText}. Move blocks` : 'Move blocks'}
        className={`ml-auto self-center rounded transition-colors ${
          compact ? 'p-0.5 -mr-1.5' : 'p-1'
        } ${
          warn
            ? amber
            : darkMode
              ? 'text-gray-500 hover:text-gray-200'
              : 'text-gray-400 hover:text-gray-700'
        } ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-black/5'}`}
      >
        <CalendarSync size={15} />
      </button>
      {open && (
        <div className="w-full flex justify-end">
          {/* Day view's heading sits on the wallpaper, so the panel brings its own surface. */}
          <div
            className={`w-full max-w-sm text-[11px] font-normal ${
              viewMode === 'day'
                ? `mb-2 p-2 rounded-xl ${darkMode ? 'bg-gray-800 shadow-md shadow-black/30' : 'bg-white border border-gray-200 shadow-sm'}`
                : ''
            }`}
          >
            <div className={`mb-1 px-1 ${muted}`}>Pull in to {day}</div>
            <div
              className={`mb-1.5 p-1.5 rounded-lg border ${
                darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'
              }`}
            >
              {pullable().map(({ from, groups }) => (
                <div key={from} className="flex items-baseline gap-1">
                  <span className={`w-7 flex-shrink-0 px-1 font-semibold ${muted}`}>
                    {from.slice(0, 2)}
                  </span>
                  <span className="flex flex-wrap gap-x-1">
                    {groups.map((group) => {
                      const text =
                        group.length > 1 ? `Strength (${group.length})` : nameOf(group[0])
                      return (
                        <button
                          type="button"
                          key={group[0].sourceDay + group[0].category}
                          onClick={() => send(group, day)}
                          aria-label={`Pull ${text} from ${from}`}
                          className={chip}
                        >
                          {text}
                        </button>
                      )
                    })}
                  </span>
                </div>
              ))}
              {pullable().length === 0 && (
                <div className={`px-1 py-1 ${muted}`}>Nothing unfinished on other days</div>
              )}
            </div>
            {session.length > 0 && (
              <>
                <div className={`mb-1 px-1 ${muted}`}>Send {day}'s strength to</div>
                <MovePanel
                  darkMode={darkMode}
                  shownDay={day}
                  moved={moved.length > 0}
                  onPick={(to) => send(session, to)}
                  onBack={() => send(moved, null)}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
