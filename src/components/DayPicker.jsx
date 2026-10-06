import { Star } from 'lucide-react'
import { useTracker } from '../context/TrackerContext'
import { getDateForDay } from '../lib/dates'
import { DAYS } from '../lib/schedule'
import DayLabel from './DayLabel'
import DayMoves from './DayMoves'

/**
 * Day selector. On phones it is the one piece of day navigation: a 7-up grid
 * of chips that also carry each day's progress (the header's week dots are
 * hidden there), with the day-moves button at the end of the row in day view.
 * From sm up it is the row of full day pills, shown in day view only. Today
 * gets a ring when it isn't the selected day.
 */
export default function DayPicker({ selectedDay, todayLabel, onSelect, weekSummary }) {
  const { darkMode, viewMode, schedule } = useTracker()
  const dayView = viewMode === 'day'
  const pctByDay = Object.fromEntries(weekSummary.map(({ day, pct }) => [day, pct]))

  const buttonClass = (day, base, idle) => {
    const isSelectedDay = dayView && selectedDay === day
    const state = isSelectedDay
      ? darkMode
        ? 'bg-blue-700 text-white border-blue-600'
        : 'bg-blue-600 text-white border-blue-700'
      : idle
    const todayRing = day === todayLabel && !isSelectedDay ? 'ring-1 ring-blue-400/70' : ''
    return `${base} rounded-lg border transition-all ${state} ${todayRing}`
  }

  return (
    <>
      <div
        className={`mb-3 grid gap-1 sm:hidden ${
          dayView ? 'grid-cols-[repeat(7,minmax(0,1fr))_auto]' : 'grid-cols-7'
        }`}
      >
        {DAYS.map((day) => {
          const isSelectedDay = dayView && selectedDay === day
          const pct = pctByDay[day] ?? 0
          return (
            <button
              type="button"
              key={day}
              onClick={() => onSelect(day)}
              aria-label={`${day}: ${pct}% done${day === todayLabel ? ' (today)' : ''}`}
              aria-current={isSelectedDay ? 'date' : undefined}
              className={buttonClass(
                day,
                'relative overflow-hidden pt-1.5 pb-2.5 text-center',
                darkMode
                  ? 'bg-gray-800 text-gray-200 border-gray-700'
                  : 'bg-white text-gray-700 border-gray-200'
              )}
            >
              <span className="block text-xs font-semibold">{day.slice(0, 3)}</span>
              <span
                className={`flex items-center justify-center h-[15px] text-[10px] ${
                  isSelectedDay ? 'text-white/80' : 'opacity-60'
                }`}
              >
                {pct === 100 ? (
                  <Star size={11} className="text-yellow-400 fill-yellow-400" />
                ) : (
                  getDateForDay(day).getDate()
                )}
              </span>
              {/* The day's progress, as the chip's bottom edge. */}
              {pct > 0 && (
                <span
                  className={`absolute left-0 bottom-0 h-1 ${
                    isSelectedDay ? 'bg-white/70' : pct === 100 ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}
            </button>
          )
        })}
        {dayView && <DayMoves day={selectedDay} blocks={schedule[selectedDay].blocks} chip />}
      </div>

      {dayView && (
        <div className="mb-4 hidden sm:flex gap-2 flex-wrap justify-center">
          {DAYS.map((day) => (
            <button
              type="button"
              key={day}
              onClick={() => onSelect(day)}
              className={buttonClass(
                day,
                'px-3 py-2 text-sm font-medium',
                darkMode
                  ? 'bg-gray-800 text-gray-200 border-gray-700 hover:border-blue-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
              )}
            >
              <DayLabel
                day={day}
                isSelectedDay={selectedDay === day}
                darkMode={darkMode}
                viewMode={viewMode}
              />
            </button>
          ))}
        </div>
      )}
    </>
  )
}
