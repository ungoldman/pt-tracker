import { useEffect, useState } from 'react'
import { useTracker } from '../context/TrackerContext'
import { exercises } from '../data'
import { getBlockStyle } from '../lib/blockStyle'
import { getDateForDay } from '../lib/dates'
import CategoryBlock from './CategoryBlock'

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

/** One day's blocks, headlined and laid out in fixed lane columns. */
export default function DayView({ day, todayLabel, blocks }) {
  const { darkMode } = useTracker()
  const columnCount = useColumnCount()
  const isToday = day === todayLabel

  return (
    <div className="w-full max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto flex-1 min-h-0 flex flex-col">
      <div className="mb-3 px-1 flex items-baseline gap-3 flex-wrap">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {isToday ? 'Today' : day}
        </h2>
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {isToday ? `${day}, ` : ''}
          {getDateForDay(day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="flex-1 overflow-auto min-h-0 flex gap-4 items-start">
        {Array.from({ length: columnCount }, (_, col) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional columns (see laneFor); the index is their stable identity.
          <div key={col} className="flex-1 min-w-0 flex flex-col gap-4">
            {blocks
              .filter(({ category }) => Math.min(laneFor(category), columnCount - 1) === col)
              .map(({ category, exercises: exList }) => (
                <div
                  key={category}
                  className={`rounded-xl border-t-2 p-2 ${getBlockStyle(category).top} ${
                    darkMode
                      ? 'bg-gray-800 shadow-md shadow-black/30'
                      : 'bg-white border border-t-2 border-gray-200 shadow-sm'
                  }`}
                >
                  <CategoryBlock day={day} category={category} exList={exList} />
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
