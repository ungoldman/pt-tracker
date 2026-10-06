import { getDateForDay, getTodayLabel } from '../lib/dates'
import { DAYS, SKIP } from '../lib/schedule'

/**
 * Destination picker for one block, shown in its Popover: a row of day chips,
 * plus skip and move back. `shownDay` is where the block sits now, `moved`
 * adds the way back, and `showDays` is off for daily blocks, which can only be
 * skipped.
 */
export default function MovePanel({ darkMode, shownDay, moved, showDays = true, onPick, onBack }) {
  const todayLabel = getTodayLabel()
  const action = `px-2 py-1 pointer-coarse:py-2.5 rounded text-[11px] transition-colors ${
    darkMode
      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
  }`

  return (
    <div>
      {showDays && (
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((day) => {
            const isHere = day === shownDay
            return (
              <button
                type="button"
                key={day}
                disabled={isHere}
                onClick={() => onPick(day)}
                aria-label={`Move to ${day}`}
                className={`py-1 pointer-coarse:py-2 rounded text-center leading-tight transition-colors ${
                  isHere
                    ? darkMode
                      ? 'bg-gray-700 text-gray-500'
                      : 'bg-gray-200 text-gray-400'
                    : darkMode
                      ? 'text-gray-200 hover:bg-blue-700 hover:text-white'
                      : 'text-gray-700 hover:bg-blue-600 hover:text-white'
                } ${day === todayLabel ? 'ring-1 ring-blue-400/70' : ''}`}
              >
                <span className="block font-semibold">{day.slice(0, 2)}</span>
                <span className="block text-[10px] opacity-60">{getDateForDay(day).getDate()}</span>
              </button>
            )
          })}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => onPick(SKIP)} className={action}>
          Skip
        </button>
        {moved && (
          <button type="button" onClick={onBack} className={action}>
            Move back
          </button>
        )}
      </div>
    </div>
  )
}
