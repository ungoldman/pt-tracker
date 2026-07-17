import { useTracker } from '../context/TrackerContext'
import { getTodayLabel } from '../lib/dates'
import CategoryBlock from './CategoryBlock'
import DayLabel from './DayLabel'

/**
 * A whole day as a scrollable card of blocks, used by the week and 3-day views.
 * `highlightToday` tints the card when `day` is today.
 */
export default function DayCard({ day, blocks, highlightToday = false }) {
  const { darkMode, viewMode } = useTracker()
  const isToday = highlightToday && day === getTodayLabel()

  return (
    <div
      className={`h-full flex flex-col min-h-0 rounded-xl border p-2 ${
        darkMode
          ? 'bg-gray-800 border-transparent shadow-md shadow-black/30'
          : 'bg-white border-gray-200 shadow-sm'
      } ${
        isToday ? (darkMode ? 'border-blue-500/70 bg-blue-900' : 'border-blue-300 bg-blue-50') : ''
      }`}
    >
      <div
        className={`mb-2 -mx-2 px-4 pb-2 border-b flex items-baseline justify-between ${
          isToday
            ? darkMode
              ? 'border-blue-500/70'
              : 'border-blue-300'
            : darkMode
              ? 'border-gray-700'
              : 'border-gray-200'
        }`}
      >
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <DayLabel day={day} darkMode={darkMode} viewMode={viewMode} />
        </h2>
      </div>

      <div className="flex-1 overflow-auto min-h-0 space-y-3">
        {blocks.map(({ category, exercises: exList }) => (
          <CategoryBlock key={category} day={day} category={category} exList={exList} />
        ))}
      </div>
    </div>
  )
}
