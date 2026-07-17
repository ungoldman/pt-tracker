import { formatDateLabel, getDateForDay } from '../lib/dates'

/**
 * A day's name with its short date. The date brightens for the selected day in
 * day view (where it sits on a colored pill); otherwise it stays muted.
 */
export default function DayLabel({ day, isSelectedDay = false, darkMode, viewMode }) {
  const emphasize = isSelectedDay && viewMode === 'day'
  const dateColor = emphasize
    ? darkMode
      ? 'text-blue-300'
      : 'text-white/80'
    : darkMode
      ? 'text-gray-400'
      : 'text-gray-500'

  return (
    <span className="flex items-baseline justify-between w-full gap-2">
      <span>{day}</span>
      <span className={`text-[11px] ${dateColor}`}>{formatDateLabel(getDateForDay(day))}</span>
    </span>
  )
}
