import { Star } from 'lucide-react'
import { useTracker } from '../context/TrackerContext'
import { getBlockStyle } from '../lib/blockStyle'
import { getDateForDay } from '../lib/dates'
import { DAYS } from '../lib/schedule'
import { categoryStats, dayStats } from '../lib/stats'

/**
 * The week on a phone: one row per day, one progress bar per block under its
 * icon. Seven stacked day cards are a long scroll and no overview, so week
 * view swaps to this below sm. Tapping a day opens it in day view.
 */
export default function WeekOverview({ todayLabel, onSelectDay }) {
  const { darkMode, completed, schedule } = useTracker()

  return (
    <div
      className={`sm:hidden rounded-xl overflow-hidden divide-y ${
        darkMode
          ? 'bg-gray-800 divide-gray-700/60 shadow-md shadow-black/30'
          : 'bg-white divide-gray-200 border border-gray-200 shadow-xs'
      }`}
    >
      {DAYS.map((day) => {
        const { blocks } = schedule[day]
        const { completedToday, totalToday, pct } = dayStats(completed, blocks)
        const isToday = day === todayLabel
        return (
          <button
            type="button"
            key={day}
            onClick={() => onSelectDay(day)}
            aria-label={`${day}: ${completedToday} of ${totalToday} done${isToday ? ' (today)' : ''}`}
            className={`w-full flex items-center gap-3 px-3 py-3 text-left ${
              isToday ? (darkMode ? 'bg-blue-900/40' : 'bg-blue-50') : ''
            }`}
          >
            <span className="w-9 shrink-0">
              <span
                className={`block text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
              >
                {day.slice(0, 3)}
              </span>
              <span className={`block text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {getDateForDay(day).getDate()}
              </span>
            </span>
            <span className="flex-1 min-w-0 flex gap-1.5">
              {blocks.map(({ category, sourceDay, exercises: scheduled }) => {
                const style = getBlockStyle(category)
                const { completedCount, total } = categoryStats(
                  completed,
                  sourceDay,
                  category,
                  scheduled
                )
                const done = completedCount === total
                return (
                  <span key={sourceDay + category} className="flex-1 min-w-0 max-w-10">
                    <style.Icon
                      size={14}
                      className={`mx-auto mb-1 ${
                        done ? 'text-green-500' : darkMode ? style.textDark : style.textLight
                      }`}
                    />
                    <span
                      className={`block h-1 rounded-full overflow-hidden ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`block h-full ${done ? 'bg-green-500' : style.bar}`}
                        style={{ width: `${(completedCount / total) * 100}%` }}
                      />
                    </span>
                  </span>
                )
              })}
            </span>
            <span
              className={`w-11 shrink-0 flex justify-end text-xs tabular-nums ${
                pct === 100 ? 'text-green-500' : darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {pct === 100 ? (
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
              ) : (
                `${completedToday}/${totalToday}`
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
