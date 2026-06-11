import {
  Timer,
  Sparkles,
  Star,
  CalendarRange,
  ChevronDown,
  Sun,
  Moon,
  RotateCcw,
} from 'lucide-react';

/** Sticky top bar: title, today's stats chips, rotating quote, and controls. */
export default function Header({
  darkMode,
  toggleDarkMode,
  stats,
  pct,
  priorityStats,
  isStrengthDay,
  viewMode,
  cycleViewMode,
  toggleAllCategoriesCollapsed,
  resetDay,
  resetWeek,
  selectedDay,
}) {
  return (
    <div
      className="sticky top-0 z-50 backdrop-blur-sm p-6"
      style={{
        maskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 90%, transparent 100%)',
      }}
    >
      <div className="w-full">
        {/* Top Row: Title, Stats, Quote, and Controls */}
        <div className="flex items-baseline gap-4 flex-wrap">
          {/* Left: Title and Stats */}
          <div className="flex items-baseline gap-4 flex-shrink-0">
            {/* Title */}
            <h1
              className={`text-3xl font-bold flex-shrink-0 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}
            >
              <Timer size={28} className={`flex-shrink-0 translate-y-1`} />
              pt-tracker
            </h1>

            {/* Stats */}
            {stats.totalToday > 0 && (
              <div
                className={`flex items-center gap-2 flex-shrink-0 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                <Sparkles size={14} className={pct === 100 ? 'text-yellow-500' : ''} />
                <span className="text-sm whitespace-nowrap font-medium">
                  Today:{' '}
                  <span className={`font-bold ${pct === 100 ? 'text-green-500' : ''}`}>
                    {stats.completedToday}/{stats.totalToday}
                  </span>
                </span>
                {/* Progress bar */}
                <span
                  className={`h-1.5 w-16 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                >
                  <span
                    className={`block h-full rounded-full transition-all duration-300 ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                {/* Priority chip */}
                {priorityStats.total > 0 && (
                  <span
                    title="Priority exercises completed today"
                    className={`text-[11px] whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                      priorityStats.done === priorityStats.total
                        ? darkMode
                          ? 'border-green-700 text-green-300 bg-green-900/30'
                          : 'border-green-300 text-green-700 bg-green-50'
                        : darkMode
                          ? 'border-yellow-700/60 text-yellow-300 bg-yellow-900/20'
                          : 'border-yellow-300 text-yellow-700 bg-yellow-50'
                    }`}
                  >
                    <Star size={10} className="flex-shrink-0" />
                    {priorityStats.done}/{priorityStats.total}
                  </span>
                )}
                {/* Day-type badge */}
                <span
                  title={isStrengthDay ? 'Strength training day (M/W/F)' : 'Rest day'}
                  className={`text-[11px] whitespace-nowrap px-2 py-0.5 rounded-full border ${
                    isStrengthDay
                      ? darkMode
                        ? 'border-purple-700/60 text-purple-300 bg-purple-900/20'
                        : 'border-purple-300 text-purple-700 bg-purple-50'
                      : darkMode
                        ? 'border-gray-600 text-gray-400 bg-gray-800'
                        : 'border-gray-300 text-gray-500 bg-gray-50'
                  }`}
                >
                  {isStrengthDay ? 'Strength day' : 'Rest day'}
                </span>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="ml-auto flex gap-2 flex-shrink-0 flex-wrap">
            <button
              onClick={cycleViewMode}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all text-sm ${
                darkMode
                  ? 'bg-blue-900/50 text-blue-100 hover:bg-blue-800'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              } shadow-sm border ${darkMode ? 'border-blue-700' : 'border-blue-300'}`}
              title="Cycle views: week → day → 3-day"
            >
              <CalendarRange size={16} />
              {viewMode === 'week' && 'Week view'}
              {viewMode === 'day' && 'Day view'}
              {viewMode === 'three' && '3-day view'}
            </button>
            <button
              onClick={toggleAllCategoriesCollapsed}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all text-sm ${
                darkMode
                  ? 'bg-indigo-900/50 text-indigo-100 hover:bg-indigo-800'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              } shadow-sm border ${darkMode ? 'border-indigo-700' : 'border-indigo-300'}`}
              title="Collapse/uncollapse all categories"
            >
              <ChevronDown size={16} />
            </button>
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all text-sm ${
                darkMode
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } shadow-sm border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="inline-flex">
              <button
                onClick={() => resetDay(selectedDay)}
                className={`flex items-center gap-1 px-3 py-2 rounded-l-lg transition-all text-sm ${
                  darkMode
                    ? 'bg-orange-900/50 text-orange-200 hover:bg-orange-800'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                } shadow-sm border ${darkMode ? 'border-orange-700' : 'border-orange-300'}`}
                title="Reset selected day's checkboxes"
              >
                <RotateCcw size={16} />
                Day
              </button>
              <button
                onClick={resetWeek}
                className={`flex items-center gap-1 px-3 py-2 rounded-r-lg transition-all text-sm ${
                  darkMode
                    ? 'bg-red-900/50 text-red-200 hover:bg-red-800'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                } shadow-sm border ${darkMode ? 'border-red-700' : 'border-red-300'}`}
                title="Reset all checkboxes for the week"
              >
                <RotateCcw size={16} />
                Week
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
