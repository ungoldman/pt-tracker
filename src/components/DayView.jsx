import { useEffect, useRef, useState } from 'react'
import { useTracker } from '../context/TrackerContext'
import { exercises } from '../data'
import { getBlockStyle } from '../lib/blockStyle'
import { getDateForDay } from '../lib/dates'
import { categoryStats } from '../lib/stats'
import AwayBlock from './AwayBlock'
import CategoryBlock from './CategoryBlock'
import DayMoves from './DayMoves'
import MissedYesterday from './MissedYesterday'

// Day-view column count by width (matches the lg/xl Tailwind breakpoints).
const columnCountForWidth = (w) => (w >= 1280 ? 3 : w >= 1024 ? 2 : 1)

// Each block's fixed day-view lane (column) is declared on the block in data.js,
// so it can't desync from the block name and collapsing a section never reflows
// blocks across columns. Lanes past the last visible column collapse into it.
const laneFor = (category) => exercises[category]?.lane ?? 1

function useColumnCount() {
  const [count, setCount] = useState(() => columnCountForWidth(window.innerWidth))
  useEffect(() => {
    const onResize = () => setCount(columnCountForWidth(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return count
}

/**
 * One day's blocks, headlined and laid out in fixed lane columns. `away` is
 * what was moved off or skipped, shown as placeholders at the foot of its lane.
 */
export default function DayView({ day, todayLabel, blocks, away }) {
  const { darkMode, completed } = useTracker()
  const columnCount = useColumnCount()
  const isToday = day === todayLabel
  const rootRef = useRef(null)
  const seenRef = useRef(null)

  // Finishing a block brings the next unfinished one up, so a session reads
  // as one run down the list. Only a block that was already on screen and
  // just became complete counts, not a day switch or a block moved in done.
  useEffect(() => {
    const keyOf = ({ sourceDay, category }) => `${sourceDay}-${category}`
    const done = new Set(
      blocks
        .filter(({ sourceDay, category, exercises: scheduled }) => {
          const { completedCount, total } = categoryStats(completed, sourceDay, category, scheduled)
          return completedCount === total
        })
        .map(keyOf)
    )
    const seen = seenRef.current
    seenRef.current = { day, done, keys: new Set(blocks.map(keyOf)) }
    if (!seen || seen.day !== day) return undefined
    const at = blocks.findIndex(
      (block) =>
        done.has(keyOf(block)) && seen.keys.has(keyOf(block)) && !seen.done.has(keyOf(block))
    )
    if (at === -1) return undefined
    const next = [...blocks.slice(at + 1), ...blocks.slice(0, at)].find(
      (block) => !done.has(keyOf(block))
    )
    if (!next) return undefined
    // Wait out the collapse of the finished block so the target has settled.
    const timer = setTimeout(() => {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const columns = window.matchMedia('(min-width: 1024px)').matches
      rootRef.current?.querySelector(`[data-block="${keyOf(next)}"]`)?.scrollIntoView({
        behavior: calm ? 'auto' : 'smooth',
        block: columns ? 'nearest' : 'start'
      })
    }, 350)
    return () => clearTimeout(timer)
  }, [blocks, completed, day])
  const inColumn =
    (col) =>
    ({ category }) =>
      Math.min(laneFor(category), columnCount - 1) === col

  return (
    <div
      ref={rootRef}
      className="w-full max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto flex-1 min-h-0 flex flex-col"
    >
      {/* Phones drop the headline: the day picker's chips already say it. */}
      <div className="mb-3 px-1 hidden sm:flex items-baseline gap-3 flex-wrap">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {isToday ? 'Today' : day}
        </h2>
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {isToday ? `${day}, ` : ''}
          {getDateForDay(day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </span>
        <DayMoves day={day} blocks={blocks} />
      </div>

      {isToday && <MissedYesterday day={day} />}

      {/* Below lg the page itself scrolls. Making this a scroll container
          there would stop the sticky block headers from reaching the viewport. */}
      <div className="flex-1 lg:overflow-auto min-h-0 flex gap-4 items-start">
        {Array.from({ length: columnCount }, (_, col) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional columns (see laneFor); the index is their stable identity.
          <div key={col} className="flex-1 min-w-0 flex flex-col gap-4">
            {blocks.filter(inColumn(col)).map(({ category, sourceDay, exercises: exList }) => (
              <div
                key={`${sourceDay}-${category}`}
                data-block={`${sourceDay}-${category}`}
                className={`scroll-mt-[calc(var(--header-h,0px)+8px)] lg:scroll-mt-2 rounded-xl border-t-2 p-2 ${getBlockStyle(category).top} ${
                  darkMode
                    ? 'bg-gray-800 shadow-md shadow-black/30'
                    : 'bg-white border border-t-2 border-gray-200 shadow-sm'
                }`}
              >
                <CategoryBlock
                  day={sourceDay}
                  shownDay={day}
                  category={category}
                  exList={exList}
                  stickyHeader
                />
              </div>
            ))}
            {away.filter(inColumn(col)).map(({ category, sourceDay, to }) => (
              <AwayBlock key={category} category={category} sourceDay={sourceDay} to={to} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
