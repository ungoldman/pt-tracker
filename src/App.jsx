import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DayCard from './components/DayCard'
import DayPicker from './components/DayPicker'
import DayView from './components/DayView'
import Footer from './components/Footer'
import Header from './components/Header'
import WeekOverview from './components/WeekOverview'
import { TrackerContext } from './context/TrackerContext'
import { exercises } from './data'
import { usePersistentState } from './hooks/usePersistentState'
import { getTodayLabel } from './lib/dates'
import {
  DAYS,
  getExercisesForDay,
  isStrengthDay,
  moveKey,
  resolveSchedule,
  strengthClashes
} from './lib/schedule'
import { completionKey, dayStats } from './lib/stats'

// The exercise data never changes at runtime, so resolve each day's schedule
// once at module load instead of re-filtering on every render. This is the
// schedule as prescribed. Moves are applied on top of it (see `schedule`).
const SCHEDULE_BY_DAY = Object.fromEntries(
  DAYS.map((day) => [day, getExercisesForDay(exercises, day)])
)
const CATEGORY_ORDER = Object.keys(exercises)

// First-run defaults (localStorage wins once the user has a saved value):
// follow the OS theme, and start phones in day view rather than a 7-up week.
const PREFERS_DARK = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
const DEFAULT_VIEW = 'day'

// Collapse overrides are per block per day, independent of completion keys.
const collapseKey = (day, category) => `${day}-${category}`

const App = () => {
  // localStorage-backed state (init from storage, persist on change via the hook)
  const [darkMode, setDarkMode] = usePersistentState('ptTrackerDarkMode', PREFERS_DARK)
  const [completed, setCompleted] = usePersistentState('ptTrackerCompleted', {})
  const [notes, setNotes] = usePersistentState('ptTrackerNotes', {})
  const [viewMode, setViewMode] = usePersistentState('ptTrackerViewMode', DEFAULT_VIEW)
  // Blocks moved to another day or skipped, { [moveKey]: day | SKIP }. Persisted
  // because a move has to outlive a reload, which makes it the same hazard the
  // collapse overrides were. So a move is always visible (a "from" tag where
  // the block lands, a placeholder where it left) and resetWeek clears them all.
  const [moves, setMoves] = usePersistentState('ptTrackerMoves', {})
  const schedule = useMemo(() => resolveSchedule(SCHEDULE_BY_DAY, moves, CATEGORY_ORDER), [moves])
  const strengthClash = useMemo(() => strengthClashes(exercises, schedule), [schedule])
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
        const catKey = collapseKey(day, category)
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

  // The hold timer lives in Footer so its ticking never re-renders the list.
  // Rows start it through this handle. When a counted run finishes it checks
  // the exercise off, reading the latest state since the run outlives a render.
  const timerRef = useRef(null)
  const latest = useRef({})
  useEffect(() => {
    latest.current = { completed, toggleComplete }
  })
  const startHold = useCallback((day, category, id, plan, label) => {
    timerRef.current?.start(plan.seconds, {
      count: plan.count,
      label,
      onDone: () => {
        const { completed: now, toggleComplete: toggle } = latest.current
        if (!now[completionKey(day, category, id)]) toggle(day, category, id)
      }
    })
  }, [])

  // `to` is a day or SKIP. Null, or the block's own day, puts it back.
  const moveBlock = useCallback(
    (sourceDay, category, to) => {
      setMoves((prev) => {
        const next = { ...prev }
        if (!to || to === sourceDay) delete next[moveKey(sourceDay, category)]
        else next[moveKey(sourceDay, category)] = to
        return next
      })
    },
    [setMoves]
  )

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
    setCollapsedCategories((prev) => ({
      ...prev,
      [collapseKey(day, category)]: !currentlyCollapsed
    }))
  }

  const isCategoryCollapsed = (day, category, isComplete = false) =>
    collapsedCategories[collapseKey(day, category)] ?? isComplete

  const resetWeek = () => {
    if (window.confirm('Are you sure you want to reset all checkboxes for the week?')) {
      setCompleted({})
      setJustCompleted(new Set())
      setNotes({})
      setMoves({})
    }
  }

  const resetDay = (day) => {
    if (window.confirm(`Are you sure you want to reset all checkboxes for ${day}?`)) {
      // Clears what the day shows, which after a move is not what its name prefixes.
      const prefixes = schedule[day].blocks.map(({ sourceDay, category }) =>
        completionKey(sourceDay, category, '')
      )
      const stripDay = (map) =>
        Object.fromEntries(
          Object.entries(map).filter(([key]) => !prefixes.some((prefix) => key.startsWith(prefix)))
        )
      setCompleted(stripDay)
      setNotes(stripDay)
      setJustCompleted(new Set())
    }
  }

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
      DAYS.forEach((day) => {
        schedule[day].blocks.forEach(({ sourceDay, category }) => {
          overrides[collapseKey(sourceDay, category)] = next === 'all'
        })
      })
      setCollapsedCategories(overrides)
    }
  }

  const getThreeDayWindow = () => {
    const todayIdx = DAYS.indexOf(todayLabel)
    const prevIdx = (todayIdx - 1 + DAYS.length) % DAYS.length
    const nextIdx = (todayIdx + 1) % DAYS.length
    return [DAYS[prevIdx], DAYS[todayIdx], DAYS[nextIdx]]
  }

  const todayBlocks = schedule[todayLabel].blocks
  const stats = dayStats(completed, todayBlocks)
  const threeDayWindow = getThreeDayWindow()
  const weekSummary = DAYS.map((day) => ({
    day,
    pct: dayStats(completed, schedule[day].blocks).pct
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
    handleNoteChange,
    schedule,
    startHold,
    moveBlock,
    strengthClash
  }

  return (
    <TrackerContext.Provider value={tracker}>
      <div className={`flex flex-col min-h-screen ${darkMode ? 'app-bg-dark' : 'app-bg-light'}`}>
        <Header
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          stats={stats}
          isStrengthDay={isStrengthDay(exercises, todayBlocks)}
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
          {viewMode !== 'week' && (
            <DayPicker
              selectedDay={selectedDay}
              todayLabel={todayLabel}
              onSelect={jumpToDay}
              weekSummary={weekSummary}
            />
          )}
          {viewMode === 'week' ? (
            <>
              <WeekOverview todayLabel={todayLabel} onSelectDay={jumpToDay} />
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 lg:gap-1 flex-1 min-h-0">
                {DAYS.map((day) => (
                  <DayCard
                    key={day}
                    day={day}
                    blocks={schedule[day].blocks}
                    away={schedule[day].away}
                    highlightToday
                  />
                ))}
              </div>
            </>
          ) : viewMode === 'day' ? (
            <DayView
              day={selectedDay}
              todayLabel={todayLabel}
              blocks={schedule[selectedDay].blocks}
              away={schedule[selectedDay].away}
            />
          ) : (
            <div className="flex flex-col md:flex-row w-full gap-4 flex-1 min-h-0 items-stretch">
              {threeDayWindow.map((day) => (
                <div key={day} className="flex-1 min-w-0 h-full">
                  <DayCard day={day} blocks={schedule[day].blocks} away={schedule[day].away} />
                </div>
              ))}
            </div>
          )}
        </div>

        <Footer darkMode={darkMode} ref={timerRef} />
      </div>
    </TrackerContext.Provider>
  )
}

export default App
