import { useTracker } from '../context/TrackerContext'
import { getDateForDay } from '../lib/dates'
import { DAYS } from '../lib/schedule'
import DayLabel from './DayLabel'

/**
 * Day-view day selector: a compact 7-up grid on small screens, full day pills
 * from sm up. Today gets a ring when it isn't the selected day.
 */
export default function DayPicker({ selectedDay, todayLabel, onSelect }) {
  const { darkMode, viewMode } = useTracker()

  const buttonClass = (day, base, idle) => {
    const isSelectedDay = selectedDay === day
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
      <div className="mb-3 grid grid-cols-7 gap-1 sm:hidden">
        {DAYS.map((day) => (
          <button
            type="button"
            key={day}
            onClick={() => onSelect(day)}
            className={buttonClass(
              day,
              'py-1.5 text-center',
              darkMode
                ? 'bg-gray-800 text-gray-200 border-gray-700'
                : 'bg-white text-gray-700 border-gray-200'
            )}
          >
            <span className="block text-xs font-semibold">{day.slice(0, 3)}</span>
            <span
              className={`block text-[10px] ${selectedDay === day ? 'text-white/80' : 'opacity-60'}`}
            >
              {getDateForDay(day).getDate()}
            </span>
          </button>
        ))}
      </div>

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
    </>
  )
}
