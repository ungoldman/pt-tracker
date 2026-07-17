import { useCallback, useEffect, useState } from 'react'
import CategoryBlock from './components/CategoryBlock'
import DayCard from './components/DayCard'
import DayLabel from './components/DayLabel'
import Footer from './components/Footer'
import Header from './components/Header'
import { TrackerContext } from './context/TrackerContext'
import { exercises } from './data'
import { usePersistentState } from './hooks/usePersistentState'
import { getBlockStyle } from './lib/blockStyle'
import { getDateForDay, getTodayLabel } from './lib/dates'
import {
  isStrengthDay as computeIsStrengthDay,
  DAYS as days,
  getExercisesForDay as scheduleForDay
} from './lib/schedule'
import { completionKey, dayStats } from './lib/stats'

// The exercise data never changes at runtime, so resolve each day's schedule
// once at module load instead of re-filtering on every render.
const SCHEDULE_BY_DAY = Object.fromEntries(days.map((day) => [day, scheduleForDay(exercises, day)]))

// First-run defaults (localStorage wins once the user has a saved value):
// follow the OS theme, and start phones in day view rather than a 7-up week.
const PREFERS_DARK = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
const DEFAULT_VIEW = 'day'

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

const App = () => {
  // localStorage-backed state (init from storage, persist on change via the hook)
  const [darkMode, setDarkMode] = usePersistentState('ptTrackerDarkMode', PREFERS_DARK)
  const [completed, setCompleted] = usePersistentState('ptTrackerCompleted', {})
  const [notes, setNotes] = usePersistentState('ptTrackerNotes', {})
  const [viewMode, setViewMode] = usePersistentState('ptTrackerViewMode', DEFAULT_VIEW)
  // Collapse overrides live only in memory. The intrinsic rule (a completed
  // block collapses, everything else is open) is always the baseline; an
  // override is a deliberate deviation from it — a manual peek or a bulk
  // action. Persisting them is what used to let stale entries silently shadow
  // the intrinsic rule, so they reset on reload and whenever a block's
  // completion changes (see toggleComplete).
  const [collapsedCategories, setCollapsedCategories] = useState({})

  const [confettiKey, setConfettiKey] = useState(null)
  const [justCompleted, setJustCompleted] = useState(new Set())
  const todayLabel = getTodayLabel()
  const [selectedDay, setSelectedDay] = useState(todayLabel)
  const [expandedNotes, setExpandedNotes] = useState(new Set())
  // Which bulk action the header control offers next. Cosmetic and momentary:
  // the modes are actions, not a persisted rule, so this resets on reload.
  const [collapseMode, setCollapseMode] = useState('done')
  const columnCount = useColumnCount()

  const toggleDarkMode = () => setDarkMode(!darkMode)

  useEffect(() => {
    // Keyboard shortcuts for view switching (ignored while typing a note).
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.key.toLowerCase()) {
        case 'w':
          setViewMode('week')
          break
        case 'd':
          setViewMode('day')
          break
        case 't':
          setViewMode('three')
          break
        default:
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [setViewMode])

  const toggleComplete = useCallback(
    (day, category, id) => {
      const key = completionKey(day, category, id)
      const isCurrentlyCompleted = completed[key]

      setCompleted((prev) => ({ ...prev, [key]: !prev[key] }))

      // A completion change re-derives this block's collapse from scratch: drop
      // any override so finishing it always collapses and reopening it always
      // expands, no matter what bulk action was last applied.
      setCollapsedCategories((prev) => {
        const catKey = `${day}-${category}`
        if (!(catKey in prev)) return prev
        const next = { ...prev }
        delete next[catKey]
        return next
      })

      // Confetti only when completing (not uncompleting), cleared after the burst.
      if (!isCurrentlyCompleted) {
        setConfettiKey(key)
        setJustCompleted((prev) => new Set(prev).add(key))
        setTimeout(() => {
          setJustCompleted((prev) => {
            const next = new Set(prev)
            next.delete(key)
            return next
          })
        }, 1000)
      }
    },
    [completed, setCompleted]
  )

  const clearConfetti = useCallback(() => setConfettiKey(null), [])

  const handleNoteChange = useCallback(
    (day, category, id, value) => {
      const key = completionKey(day, category, id)
      setNotes((prev) => ({ ...prev, [key]: value }))
    },
    [setNotes]
  )

  const openNotes = useCallback((key) => {
    setExpandedNotes((prev) => new Set(prev).add(key))
  }, [])

  const closeNotes = useCallback((key) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [])

  const discardNote = useCallback(
    (key) => {
      setNotes((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      closeNotes(key)
    },
    [setNotes, closeNotes]
  )

  // Effective collapse = an explicit override, else the intrinsic rule: a
  // fully-completed block is collapsed, everything else is open. Bulk actions
  // and manual toggles set overrides; completion clears them (toggleComplete),
  // so finishing a block always collapses it whatever the last bulk action was.
  const toggleCategoryCollapse = (day, category, currentlyCollapsed) => {
    setCollapsedCategories((prev) => ({ ...prev, [`${day}-${category}`]: !currentlyCollapsed }))
  }

  const isCategoryCollapsed = (day, category, isComplete = false) =>
    collapsedCategories[`${day}-${category}`] ?? isComplete

  const resetWeek = () => {
    if (window.confirm('Are you sure you want to reset all checkboxes for the week?')) {
      setCompleted({})
      setJustCompleted(new Set())
      setNotes({})
    }
  }

  const resetDay = (day) => {
    if (window.confirm(`Are you sure you want to reset all checkboxes for ${day}?`)) {
      const stripDay = (map) =>
        Object.fromEntries(Object.entries(map).filter(([key]) => !key.startsWith(`${day}-`)))
      setCompleted(stripDay)
      setNotes(stripDay)
      setJustCompleted(new Set())
    }
  }

  const getExercisesForDay = (day) => SCHEDULE_BY_DAY[day]

  const cycleViewMode = () => {
    setViewMode((prev) => (prev === 'week' ? 'day' : prev === 'day' ? 'three' : 'week'))
  }

  // The header control cycles through three momentary bulk actions:
  //   all  — collapse every block now (override every block closed);
  //   none — expand every block now (override every block open);
  //   done — reset to the intrinsic rule (clear overrides: completed collapse).
  // These arrange things once; they don't persist and don't override the
  // completion rule — finishing a block still collapses it (toggleComplete).
  const cycleCollapseMode = () => {
    const next = { done: 'all', all: 'none', none: 'done' }[collapseMode]
    setCollapseMode(next)
    if (next === 'done') {
      setCollapsedCategories({})
    } else {
      const overrides = {}
      days.forEach((day) => {
        getExercisesForDay(day).forEach(({ category }) => {
          overrides[`${day}-${category}`] = next === 'all'
        })
      })
      setCollapsedCategories(overrides)
    }
  }

  const getThreeDayWindow = () => {
    const todayIdx = days.indexOf(todayLabel)
    const prevIdx = (todayIdx - 1 + days.length) % days.length
    const nextIdx = (todayIdx + 1) % days.length
    return [days[prevIdx], days[todayIdx], days[nextIdx]]
  }

  const todayBlocks = getExercisesForDay(todayLabel)
  const stats = dayStats(completed, todayBlocks, todayLabel)
  const pct = stats.pct
  const isStrengthDay = computeIsStrengthDay(todayBlocks)
  const priorityStats = { done: stats.priorityDone, total: stats.priorityTotal }
  const threeDayWindow = getThreeDayWindow()
  const weekSummary = days.map((day) => ({
    day,
    pct: dayStats(completed, SCHEDULE_BY_DAY[day], day).pct
  }))

  const jumpToDay = useCallback(
    (day) => {
      setSelectedDay(day)
      setViewMode('day')
    },
    [setViewMode]
  )

  // Shared state + handlers for the day/block/row tree (see TrackerContext).
  const tracker = {
    darkMode,
    viewMode,
    completed,
    notes,
    expandedNotes,
    confettiKey,
    justCompleted,
    isCategoryCollapsed,
    toggleCategoryCollapse,
    toggleComplete,
    clearConfetti,
    openNotes,
    closeNotes,
    discardNote,
    handleNoteChange
  }

  return (
    <TrackerContext.Provider value={tracker}>
      <div className={`flex flex-col min-h-screen ${darkMode ? 'app-bg-dark' : 'app-bg-light'}`}>
        <Header
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          stats={stats}
          pct={pct}
          priorityStats={priorityStats}
          isStrengthDay={isStrengthDay}
          weekSummary={weekSummary}
          todayLabel={todayLabel}
          onSelectDay={jumpToDay}
          viewMode={viewMode}
          cycleViewMode={cycleViewMode}
          collapseMode={collapseMode}
          cycleCollapseMode={cycleCollapseMode}
          resetDay={resetDay}
          resetWeek={resetWeek}
          selectedDay={selectedDay}
        />

        <div className="w-full p-3 sm:p-6 flex-1 min-h-0 flex flex-col lg:overflow-hidden">
          {viewMode === 'day' && (
            <>
              {/* Compact 7-up day grid (small screens) */}
              <div className="mb-3 grid grid-cols-7 gap-1 sm:hidden">
                {days.map((day) => {
                  const isSelectedDay = selectedDay === day
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`py-1.5 rounded-lg border text-center transition-all ${
                        isSelectedDay
                          ? darkMode
                            ? 'bg-blue-700 text-white border-blue-600'
                            : 'bg-blue-600 text-white border-blue-700'
                          : darkMode
                            ? 'bg-gray-800 text-gray-200 border-gray-700'
                            : 'bg-white text-gray-700 border-gray-200'
                      } ${day === todayLabel && !isSelectedDay ? 'ring-1 ring-blue-400/70' : ''}`}
                    >
                      <span className="block text-xs font-semibold">{day.slice(0, 3)}</span>
                      <span
                        className={`block text-[10px] ${isSelectedDay ? 'text-white/80' : 'opacity-60'}`}
                      >
                        {getDateForDay(day).getDate()}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Full day pills (larger screens) */}
              <div className="mb-4 hidden sm:flex gap-2 flex-wrap justify-center">
                {days.map((day) => {
                  const isSelectedDay = selectedDay === day
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        isSelectedDay
                          ? darkMode
                            ? 'bg-blue-700 text-white border-blue-600'
                            : 'bg-blue-600 text-white border-blue-700'
                          : darkMode
                            ? 'bg-gray-800 text-gray-200 border-gray-700 hover:border-blue-500'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      } ${day === todayLabel && !isSelectedDay ? 'ring-1 ring-blue-400/70' : ''}`}
                    >
                      <DayLabel
                        day={day}
                        isSelectedDay={isSelectedDay}
                        darkMode={darkMode}
                        viewMode={viewMode}
                      />
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {viewMode === 'week' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 lg:gap-1 flex-1 min-h-0">
              {days.map((day) => (
                <DayCard key={day} day={day} blocks={getExercisesForDay(day)} highlightToday />
              ))}
            </div>
          ) : viewMode === 'day' ? (
            <div className="w-full max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto flex-1 min-h-0 flex flex-col">
              {/* Day headline */}
              <div className="mb-3 px-1 flex items-baseline gap-3 flex-wrap">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {selectedDay === todayLabel ? 'Today' : selectedDay}
                </h2>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedDay === todayLabel ? `${selectedDay}, ` : ''}
                  {getDateForDay(selectedDay).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {/* Blocks in fixed columns: each block is assigned a semantic lane
                  (see CATEGORY_LANE), so collapsing a section only shrinks its
                  own column and never reflows blocks across columns. */}
              <div className="flex-1 overflow-auto min-h-0 flex gap-4 items-start">
                {Array.from({ length: columnCount }, (_, col) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional columns (CATEGORY_LANE); the index is their stable identity.
                  <div key={col} className="flex-1 min-w-0 flex flex-col gap-4">
                    {getExercisesForDay(selectedDay)
                      .filter(
                        ({ category }) => Math.min(laneFor(category), columnCount - 1) === col
                      )
                      .map(({ category, exercises: exList }) => (
                        <div
                          key={category}
                          className={`rounded-xl border-t-2 p-2 ${getBlockStyle(category).top} ${
                            darkMode
                              ? 'bg-gray-800 shadow-md shadow-black/30'
                              : 'bg-white border border-t-2 border-gray-200 shadow-sm'
                          }`}
                        >
                          <CategoryBlock day={selectedDay} category={category} exList={exList} />
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row w-full gap-4 flex-1 min-h-0 items-stretch">
              {threeDayWindow.map((day) => (
                <div key={day} className="flex-1 min-w-0 h-full">
                  <DayCard day={day} blocks={getExercisesForDay(day)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <Footer darkMode={darkMode} />
      </div>
    </TrackerContext.Provider>
  )
}

export default App
