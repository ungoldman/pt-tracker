import {
  CalendarRange,
  ChevronsDownUp,
  ChevronsUpDown,
  ListChecks,
  Moon,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
  Timer
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// Section-visibility cycle: what each mode shows and what a click does next.
const COLLAPSE_MODES = {
  done: { Icon: ListChecks, label: 'Done sections collapsed', next: 'collapse all' },
  all: { Icon: ChevronsDownUp, label: 'All sections collapsed', next: 'expand all' },
  none: { Icon: ChevronsUpDown, label: 'All sections expanded', next: 'collapse done' }
}

/**
 * Hover/focus tooltip below a control (the native title is too easy to miss).
 * `align` keeps the tooltip inside the viewport: 'right' for controls at the
 * right edge, 'left' for elements near the left edge, 'center' otherwise.
 */
const HINT_ALIGN = {
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
  left: 'left-0'
}
// Week-dot fill by day completion: no history stays neutral, then blue
// under halfway and green at/over halfway. A clean 100% gets a gold star
// instead of a dot (handled at the call site), so no 100% branch here.
function weekDotColor(pct, darkMode) {
  if (pct >= 50) return 'bg-green-500'
  if (pct > 0) return 'bg-blue-500'
  return darkMode ? 'bg-gray-600' : 'bg-gray-300'
}

function Hinted({ hint, darkMode, align = 'center', children }) {
  return (
    <div className="relative flex group">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full ${HINT_ALIGN[align]} mt-1.5 px-2 py-1 rounded-md text-xs whitespace-nowrap z-50 opacity-0 transition-opacity delay-200 group-hover:opacity-100 group-focus-within:opacity-100 ${
          darkMode
            ? 'bg-gray-800 text-gray-200 border border-gray-700'
            : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
        }`}
      >
        {hint}
      </span>
    </div>
  )
}

/**
 * Sticky top bar: title, today's stats chips, and controls. On small screens
 * (where the page itself scrolls) it collapses to just the stats line once
 * scrolled, iOS large-title style; on lg+ the content area scrolls internally
 * so the listener never fires and the full bar stays.
 */
export default function Header({
  darkMode,
  toggleDarkMode,
  stats,
  pct,
  priorityStats,
  isStrengthDay,
  weekSummary,
  todayLabel,
  onSelectDay,
  viewMode,
  cycleViewMode,
  collapseMode,
  cycleCollapseMode,
  resetDay,
  resetWeek,
  selectedDay
}) {
  const [scrolled, setScrolled] = useState(false)
  const [resetMenuOpen, setResetMenuOpen] = useState(false)
  const resetRef = useRef(null)

  useEffect(() => {
    // Hysteresis (collapse past 96px, expand under 24px) so the header's own
    // height change can't flutter the state around the threshold.
    const onScroll = () => setScrolled((prev) => (prev ? window.scrollY > 24 : window.scrollY > 96))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!resetMenuOpen) return undefined
    const onDown = (e) => {
      if (!resetRef.current?.contains(e.target)) setResetMenuOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setResetMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [resetMenuOpen])

  // One button language: ghost icon buttons throughout; destructive actions
  // reveal red only inside the reset menu (plus the confirm dialog).
  const ghostButton = `flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-sm ${
    darkMode
      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
  }`

  return (
    <div
      className={`sticky top-0 z-50 border-b ${
        scrolled ? 'px-3 py-1.5 sm:px-6 lg:py-3' : 'p-3 sm:px-6 sm:py-3'
      } ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}
    >
      {/* One row on lg+ (title, stats, controls); below that the stats drop to
          their own full-width line via order/w-full, controls stay by the title. */}
      <div className="w-full flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1
          className={`order-1 text-xl sm:text-2xl font-bold tracking-tight flex-shrink-0 items-center gap-2 ${
            scrolled ? 'hidden lg:flex' : 'flex'
          } ${darkMode ? 'text-white' : 'text-gray-800'}`}
        >
          <Timer
            size={22}
            className={`flex-shrink-0 translate-y-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
          />
          pt-tracker
        </h1>

        {/* Controls (min-w-0 so they wrap on narrow screens instead of overflowing) */}
        <div
          className={`order-2 lg:order-3 ml-auto gap-2 min-w-0 flex-wrap justify-end ${
            scrolled ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <Hinted hint="Cycle view: week → day → 3-day" darkMode={darkMode} align="right">
            <button
              type="button"
              onClick={cycleViewMode}
              className={ghostButton}
              aria-label="Cycle view: week, day, 3-day"
            >
              <CalendarRange size={16} />
              <span className="hidden sm:inline">
                {viewMode === 'week' && 'Week view'}
                {viewMode === 'day' && 'Day view'}
                {viewMode === 'three' && '3-day view'}
              </span>
            </button>
          </Hinted>
          <Hinted
            hint={`Sections: ${COLLAPSE_MODES[collapseMode].next}`}
            darkMode={darkMode}
            align="right"
          >
            <button
              type="button"
              onClick={cycleCollapseMode}
              className={ghostButton}
              aria-label={`Sections: ${COLLAPSE_MODES[collapseMode].next}`}
            >
              {(() => {
                const ModeIcon = COLLAPSE_MODES[collapseMode].Icon
                return <ModeIcon size={16} />
              })()}
            </button>
          </Hinted>
          <Hinted hint={darkMode ? 'Light mode' : 'Dark mode'} darkMode={darkMode} align="right">
            <button
              type="button"
              onClick={toggleDarkMode}
              className={ghostButton}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </Hinted>
          <div className="relative flex group" ref={resetRef}>
            <button
              type="button"
              onClick={() => setResetMenuOpen((open) => !open)}
              className={ghostButton}
              aria-label="Reset checkboxes"
              aria-haspopup="menu"
              aria-expanded={resetMenuOpen}
            >
              <RotateCcw size={16} />
            </button>
            {!resetMenuOpen && (
              <span
                role="tooltip"
                className={`pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md text-xs whitespace-nowrap z-50 opacity-0 transition-opacity delay-200 group-hover:opacity-100 ${
                  darkMode
                    ? 'bg-gray-800 text-gray-200 border border-gray-700'
                    : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
                }`}
              >
                Reset checkboxes…
              </span>
            )}
            {resetMenuOpen && (
              <div
                role="menu"
                className={`absolute right-0 top-full mt-1 min-w-[11rem] rounded-lg border shadow-lg overflow-hidden ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setResetMenuOpen(false)
                    resetDay(selectedDay)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${
                    darkMode ? 'text-red-400 hover:bg-red-900/40' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  Reset {selectedDay}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setResetMenuOpen(false)
                    resetWeek()
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${
                    darkMode ? 'text-red-400 hover:bg-red-900/40' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  Reset week
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Today's stats: own full-width line below lg, inline between title and controls at lg+ */}
        {stats.totalToday > 0 && (
          <div
            className={`order-3 w-full lg:order-2 lg:w-auto lg:flex-1 flex items-center gap-2 flex-wrap min-w-0 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              <Sparkles size={14} className={pct === 100 ? 'text-yellow-500' : ''} />
              <span className="text-sm font-medium">
                Today:{' '}
                <span className={`font-bold tabular-nums ${pct === 100 ? 'text-green-500' : ''}`}>
                  {stats.completedToday}/{stats.totalToday}
                </span>
              </span>
              {/* Progress bar */}
              <Hinted hint={`${pct}% of today's exercises done`} darkMode={darkMode}>
                <span
                  className={`h-1.5 w-16 self-center rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                >
                  <span
                    className={`block h-full rounded-full transition-all duration-300 ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </Hinted>
            </span>
            {/* Priority chip */}
            {priorityStats.total > 0 && (
              <Hinted hint="Priority exercises done today" darkMode={darkMode}>
                <span
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
              </Hinted>
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
            {/* Week progress dots: one per day, tap to jump there in day view */}
            {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is for form controls; this is a labelled group of day-navigation buttons. */}
            <span
              className="flex items-center gap-1.5 ml-1"
              role="group"
              aria-label="Week progress"
            >
              {weekSummary.map(({ day, pct: dayPct }) => {
                const isToday = day === todayLabel
                // In day view, ring the day the list is currently showing.
                const isSelected = viewMode === 'day' && day === selectedDay
                return (
                  <Hinted key={day} hint={`${day}: ${dayPct}% done`} darkMode={darkMode}>
                    <button
                      type="button"
                      onClick={(e) => {
                        // Drop focus so the focus-within tooltip doesn't linger
                        // and overlap a neighbor's hover tooltip after a click.
                        e.currentTarget.blur()
                        onSelectDay(day)
                      }}
                      aria-label={`${day}: ${dayPct}% done${isToday ? ' (today)' : ''}${
                        isSelected ? ' (selected)' : ''
                      }`}
                      className={`self-center flex items-center justify-center rounded-full ${
                        isSelected
                          ? `ring-2 ring-offset-2 ${
                              darkMode
                                ? 'ring-gray-400 ring-offset-gray-900'
                                : 'ring-gray-400 ring-offset-gray-50'
                            }`
                          : ''
                      }`}
                    >
                      {dayPct === 100 ? (
                        <Star
                          size={isToday ? 16 : 13}
                          className="text-yellow-400 fill-yellow-400"
                        />
                      ) : (
                        <span
                          className={`block rounded-full transition-colors ${
                            isToday ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'
                          } ${weekDotColor(dayPct, darkMode)}`}
                        />
                      )}
                    </button>
                  </Hinted>
                )
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
