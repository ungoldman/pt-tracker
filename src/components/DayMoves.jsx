import { CalendarSync, TriangleAlert } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTracker } from '../context/TrackerContext'
import { exercises } from '../data'
import { DAYS, groupLabel, unfinishedGroups } from '../lib/schedule'
import Popover from './Popover'

/**
 * Day-level moves. Pulls unfinished blocks in from other days ("missed it
 * yesterday, doing it today"), a strength session at a time since one is
 * several blocks, and sends back what was moved here. Moves only ever go
 * toward the day being looked at or back home, which keeps one meaning per
 * button. Also flags a day whose strength work sits next to another strength
 * day. The panel is a popover on the button. `chip` is the phone day-picker variant, a button shaped
 * like the day chips beside it.
 */
export default function DayMoves({ day, blocks, chip = false }) {
  const { darkMode, viewMode, completed, schedule, moveBlock, strengthClash } = useTracker()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = useCallback(() => setOpen(false), [])

  // What sits here but belongs elsewhere, by the day it was scheduled on.
  const movedIn = DAYS.map((from) => ({
    from,
    list: blocks.filter(({ sourceDay }) => sourceDay === from && from !== day)
  })).filter(({ list }) => list.length > 0)
  const clash = strengthClash[day]
  const clashText =
    clash && `Strength back to back with ${clash.map((d) => d.slice(0, 3)).join(' and ')}`

  // Week columns are too narrow for the sentence, so there the button carries
  // the warning as its color and label.
  const compact = chip || viewMode === 'week'
  const amber = darkMode ? 'text-amber-400/80' : 'text-amber-600'
  const warn = clash && compact
  const label = `Move blocks to or from ${day}`

  const send = (list, to) => {
    for (const { sourceDay, category } of list) moveBlock(sourceDay, category, to)
    setOpen(false)
  }

  // What other days still owe: their unfinished movable blocks, nearest past
  // day first.
  const pullable = () => {
    const idx = DAYS.indexOf(day)
    const others = [...DAYS.slice(0, idx).reverse(), ...DAYS.slice(idx + 1)]
    return others
      .map((from) => ({
        from,
        groups: unfinishedGroups(exercises, schedule[from].blocks, completed)
      }))
      .filter(({ groups }) => groups.length > 0)
  }

  const muted = darkMode ? 'text-gray-500' : 'text-gray-400'
  const pullButton = `px-2 py-1 rounded transition-colors ${
    darkMode
      ? 'text-gray-200 hover:bg-blue-700 hover:text-white'
      : 'text-gray-700 hover:bg-blue-600 hover:text-white'
  } pointer-coarse:py-2.5`

  return (
    <>
      {clash && !compact && (
        // Plain inline text so it sits on the heading row's baseline with the date.
        <span className={`text-[11px] font-normal whitespace-nowrap ${amber}`}>
          <TriangleAlert size={12} className="inline align-[-2px] mr-1" />
          {clashText}
        </span>
      )}
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={warn ? `${label}. ${clashText}` : label}
        aria-expanded={open}
        title={warn ? `${clashText}. Move blocks` : 'Move blocks'}
        className={`relative hit-44 transition-colors ${
          chip
            ? `px-2.5 flex items-center rounded-lg border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`
            : `ml-auto self-center rounded ${compact ? 'p-0.5 -mr-1.5' : 'p-1'} ${
                darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-black/5'
              }`
        } ${
          warn
            ? amber
            : darkMode
              ? 'text-gray-500 hover:text-gray-200'
              : 'text-gray-400 hover:text-gray-700'
        }`}
      >
        <CalendarSync size={15} />
      </button>
      <Popover
        anchorRef={ref}
        open={open}
        onClose={close}
        darkMode={darkMode}
        label={`Move blocks, ${day}`}
      >
        {chip && clash && (
          <div className={`mb-1.5 px-1 flex items-center gap-1 ${amber}`}>
            <TriangleAlert size={12} className="shrink-0" />
            {clashText}
          </div>
        )}
        <div className={`mb-1 px-1 ${muted}`}>Pull in to {day}</div>
        <div
          className={`mb-1.5 p-1.5 rounded-lg border ${
            darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'
          }`}
        >
          {pullable().map(({ from, groups }) => (
            <div key={from} className="flex items-baseline gap-1">
              <span className={`w-7 shrink-0 px-1 font-semibold ${muted}`}>{from.slice(0, 2)}</span>
              <span className="flex flex-wrap gap-x-1">
                {groups.map((group) => {
                  const text = groupLabel(exercises, group, from)
                  return (
                    <button
                      type="button"
                      key={group[0].sourceDay + group[0].category}
                      onClick={() => send(group, day)}
                      aria-label={`Pull ${text} from ${from}`}
                      className={pullButton}
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
        {movedIn.length > 0 && (
          <>
            <div className={`mb-1 px-1 ${muted}`}>Moved to {day}</div>
            <div
              className={`mb-1.5 p-1.5 rounded-lg border ${
                darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'
              }`}
            >
              {movedIn.map(({ from, list }) => (
                <div key={from} className="flex items-baseline justify-between gap-2">
                  <span className={`px-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {list.length === 1 ? '1 block' : `${list.length} blocks`} from {from}
                  </span>
                  <button
                    type="button"
                    onClick={() => send(list, null)}
                    aria-label={`Send back to ${from}`}
                    className={pullButton}
                  >
                    Send back
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </Popover>
    </>
  )
}
