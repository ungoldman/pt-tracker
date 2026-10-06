import { useTracker } from '../context/TrackerContext'
import { getTodayLabel } from '../lib/dates'
import AwayBlock from './AwayBlock'
import CategoryBlock from './CategoryBlock'
import DayLabel from './DayLabel'
import DayMoves from './DayMoves'

/**
 * A whole day as a scrollable card of blocks, used by the week and 3-day views.
 * `highlightToday` tints the card when `day` is today. `away` is what was moved
 * off or skipped, shown as placeholders under the blocks.
 */
export default function DayCard({ day, blocks, away, highlightToday = false }) {
  const { darkMode, viewMode } = useTracker()
  const isToday = highlightToday && day === getTodayLabel()

  return (
    <div
      className={`h-full flex flex-col min-h-0 rounded-xl border p-2 ${
        darkMode
          ? 'bg-gray-800 border-transparent shadow-md shadow-black/30'
          : 'bg-white border-gray-200 shadow-xs'
      } ${
        isToday ? (darkMode ? 'border-blue-500/70 bg-blue-900' : 'border-blue-300 bg-blue-50') : ''
      }`}
    >
      <div
        className={`mb-2 -mx-2 px-4 pb-2 border-b flex flex-wrap items-baseline justify-between gap-x-1 ${
          isToday
            ? darkMode
              ? 'border-blue-500/70'
              : 'border-blue-300'
            : darkMode
              ? 'border-gray-700'
              : 'border-gray-200'
        }`}
      >
        <h2
          className={`flex-1 min-w-0 text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}
        >
          <DayLabel day={day} darkMode={darkMode} viewMode={viewMode} />
        </h2>
        <DayMoves day={day} blocks={blocks} />
      </div>

      <div className="flex-1 overflow-auto min-h-0 space-y-3">
        {blocks.map(({ category, sourceDay, exercises: exList }) => (
          <CategoryBlock
            key={`${sourceDay}-${category}`}
            day={sourceDay}
            shownDay={day}
            category={category}
            exList={exList}
          />
        ))}
        {away.map(({ category, sourceDay, to }) => (
          <AwayBlock key={category} category={category} sourceDay={sourceDay} to={to} />
        ))}
      </div>
    </div>
  )
}
