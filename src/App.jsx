import { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { exercises } from './data';
import { usePersistentState } from './hooks/usePersistentState';
import {
  DAYS as days,
  getExercisesForDay as scheduleForDay,
  isStrengthDay as computeIsStrengthDay,
} from './lib/schedule';
import Footer from './components/Footer';
import ExerciseRow from './components/ExerciseRow';
import Header from './components/Header';
import { categoryStats, completionKey, dayStats, isCompleted as isDone } from './lib/stats';
import { getBlockStyle } from './lib/blockStyle';
import { estimateBlock } from './lib/duration';

// The exercise data never changes at runtime, so resolve each day's schedule
// once at module load instead of re-filtering on every render.
const SCHEDULE_BY_DAY = Object.fromEntries(
  days.map((day) => [day, scheduleForDay(exercises, day)])
);

// First-run defaults (localStorage wins once the user has a saved value):
// follow the OS theme, and start phones in day view rather than a 7-up week.
const PREFERS_DARK = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
const DEFAULT_VIEW = window.innerWidth < 640 ? 'day' : 'week';

// Day-view column count by width (matches the lg/xl Tailwind breakpoints).
// Used to assign each block a fixed column so collapsing a section never
// reflows blocks across columns the way CSS `columns` masonry does.
const columnCountForWidth = (w) => (w >= 1280 ? 3 : w >= 1024 ? 2 : 1);

// Fixed semantic lane per section for the 3-column day view:
//   0 = Wake-Up + Priority, 1 = the day's strength session (Strength +
//   Resistance, or Isometrics — never both on a day), 2 = Wind-Down +
//   Personal Goals. At narrower widths, lanes beyond the last column
//   collapse into it.
const CATEGORY_LANE = {
  'Wake-Up': 0,
  Priority: 0,
  'Strength (M/W/F)': 1,
  'Resistance (M/W/F)': 1,
  'Isometrics (End of Day)': 1,
  'Wind-Down': 2,
  'Personal Goals (non-PT)': 2,
};
const laneFor = (category) => CATEGORY_LANE[category] ?? 1;

function useColumnCount() {
  const [count, setCount] = useState(() => columnCountForWidth(window.innerWidth));
  useEffect(() => {
    const onResize = () => setCount(columnCountForWidth(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return count;
}

const App = () => {
  // localStorage-backed state (init from storage, persist on change via the hook)
  const [darkMode, setDarkMode] = usePersistentState('ptTrackerDarkMode', PREFERS_DARK);
  const [completed, setCompleted] = usePersistentState('ptTrackerCompleted', {});
  const [notes, setNotes] = usePersistentState('ptTrackerNotes', {});
  const [viewMode, setViewMode] = usePersistentState('ptTrackerViewMode', DEFAULT_VIEW);
  const [collapsedCategories, setCollapsedCategories] = usePersistentState(
    'ptTrackerCollapsedCategories',
    {}
  );

  const [confettiKey, setConfettiKey] = useState(null);
  const [justCompleted, setJustCompleted] = useState(new Set());
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(todayLabel);
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const columnCount = useColumnCount();

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    // Keyboard shortcuts for view switching
    const handleKeyPress = (e) => {
      // Only trigger if not typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'w':
          setViewMode('week');
          break;
        case 'd':
          setViewMode('day');
          break;
        case 't':
          setViewMode('three');
          break;
        default:
          return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setViewMode]);

  const toggleComplete = useCallback(
    (day, category, exerciseIndex) => {
      const key = completionKey(day, category, exerciseIndex);
      const isCurrentlyCompleted = completed[key];

      setCompleted((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));

      // Trigger confetti only when completing (not uncompleting)
      if (!isCurrentlyCompleted) {
        setConfettiKey(key);
        setJustCompleted((prev) => new Set(prev).add(key));

        // Remove the "just completed" state after animation
        setTimeout(() => {
          setJustCompleted((prev) => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        }, 1000);
      }
    },
    [completed, setCompleted]
  );

  const clearConfetti = useCallback(() => setConfettiKey(null), []);

  const isCompleted = (day, category, exerciseIndex) =>
    isDone(completed, day, category, exerciseIndex);

  const wasJustCompleted = (day, category, exerciseIndex) => {
    const key = `${day}-${category}-${exerciseIndex}`;
    return justCompleted.has(key);
  };

  const getNote = (day, category, exerciseIndex) => {
    const key = `${day}-${category}-${exerciseIndex}`;
    return notes[key] || '';
  };

  const handleNoteChange = useCallback(
    (day, category, exerciseIndex, value) => {
      const key = completionKey(day, category, exerciseIndex);
      setNotes((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [setNotes]
  );

  const openNotes = useCallback((key) => {
    setExpandedNotes((prev) => new Set(prev).add(key));
  }, []);

  const closeNotes = useCallback((key) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  // A fully-completed block defaults to collapsed (done work stops costing
  // space); an explicit user toggle always wins over the default, so the
  // toggle flips the *effective* state rather than the stored one.
  const toggleCategoryCollapse = (day, category, currentlyCollapsed) => {
    const key = `${day}-${category}`;
    setCollapsedCategories((prev) => ({
      ...prev,
      [key]: !currentlyCollapsed,
    }));
  };

  const isCategoryCollapsed = (day, category, defaultCollapsed = false) => {
    const key = `${day}-${category}`;
    return collapsedCategories[key] ?? defaultCollapsed;
  };

  const getCategoryStats = (day, category, scheduled) =>
    categoryStats(completed, day, category, scheduled);

  const discardNote = useCallback(
    (key) => {
      setNotes((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      closeNotes(key);
    },
    [setNotes, closeNotes]
  );

  const resetWeek = () => {
    if (window.confirm('Are you sure you want to reset all checkboxes for the week?')) {
      setCompleted({});
      setJustCompleted(new Set());
      setNotes({});
    }
  };

  const resetDay = (day) => {
    if (window.confirm(`Are you sure you want to reset all checkboxes for ${day}?`)) {
      setCompleted((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (key.startsWith(day + '-')) {
            delete updated[key];
          }
        });
        return updated;
      });
      setJustCompleted(new Set());
      setNotes((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (key.startsWith(day + '-')) {
            delete updated[key];
          }
        });
        return updated;
      });
    }
  };

  const getExercisesForDay = (day) => SCHEDULE_BY_DAY[day];

  const getDateForDay = (day) => {
    const today = new Date();
    const todayIdx = days.indexOf(todayLabel);
    const targetIdx = days.indexOf(day);
    const diff = targetIdx - todayIdx;
    const result = new Date(today);
    result.setDate(today.getDate() + diff);
    return result;
  };

  const formatDateLabel = (date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const renderDayLabel = (day, isSelectedDay = false) => {
    const emphasizeSelectedDate = isSelectedDay && viewMode === 'day';
    const dateColor = emphasizeSelectedDate
      ? darkMode
        ? 'text-blue-300'
        : 'text-white/80'
      : darkMode
        ? 'text-gray-400'
        : 'text-gray-500';

    return (
      <span className="flex items-baseline justify-between w-full gap-2">
        <span>{day}</span>
        <span className={`text-[11px] ${dateColor}`}>{formatDateLabel(getDateForDay(day))}</span>
        {/* <span className={`text-[11px] italic ${dateColor} align`}>({focus[day]})</span> */}
      </span>
    );
  };

  const cycleViewMode = () => {
    setViewMode((prev) => {
      if (prev === 'week') return 'day';
      if (prev === 'day') return 'three';
      return 'week';
    });
  };

  // Global section visibility cycles through three modes:
  //   done (default) — only fully-completed blocks collapse, via the
  //     per-block default, so the override map is simply cleared;
  //   all  — every block on every day collapsed (explicit overrides);
  //   none — every block expanded (explicit overrides beat the done-default).
  const [collapseMode, setCollapseMode] = useState('done');

  const cycleCollapseMode = () => {
    const next = { done: 'all', all: 'none', none: 'done' }[collapseMode];
    setCollapseMode(next);
    if (next === 'done') {
      setCollapsedCategories({});
    } else {
      const overrides = {};
      days.forEach((day) => {
        getExercisesForDay(day).forEach(({ category }) => {
          overrides[`${day}-${category}`] = next === 'all';
        });
      });
      setCollapsedCategories(overrides);
    }
  };

  const getThreeDayWindow = () => {
    const todayIdx = days.indexOf(todayLabel);
    const prevIdx = (todayIdx - 1 + days.length) % days.length;
    const nextIdx = (todayIdx + 1) % days.length;
    return [days[prevIdx], days[todayIdx], days[nextIdx]];
  };

  const todayBlocks = getExercisesForDay(todayLabel);
  const stats = dayStats(completed, todayBlocks, todayLabel);
  const pct = stats.pct;
  const isStrengthDay = computeIsStrengthDay(todayBlocks);
  const priorityStats = { done: stats.priorityDone, total: stats.priorityTotal };
  const threeDayWindow = getThreeDayWindow();
  const weekSummary = days.map((day) => ({
    day,
    pct: dayStats(completed, SCHEDULE_BY_DAY[day], day).pct,
  }));

  const jumpToDay = useCallback(
    (day) => {
      setSelectedDay(day);
      setViewMode('day');
    },
    [setViewMode]
  );

  // One block: accent-colored header with phase icon, progress bar, rows.
  // Shared by the day-view block cards and the week/3-day day cards.
  const renderBlock = (day, category, exList) => {
    const stats = getCategoryStats(day, category, exList);
    const isComplete = stats.total > 0 && stats.completedCount === stats.total;
    const isCollapsed = isCategoryCollapsed(day, category, isComplete);
    const blockStyle = getBlockStyle(category);
    const BlockIcon = blockStyle.Icon;
    const { minutes, exact } = estimateBlock(
      exercises[category],
      exList.map(({ ex }) => ex)
    );
    return (
      <div key={category}>
        <button
          onClick={() => toggleCategoryCollapse(day, category, isCollapsed)}
          className={`w-full flex items-center gap-2 font-semibold text-xs uppercase tracking-wide mb-1 px-2 py-1 rounded transition-colors ${
            darkMode
              ? `${blockStyle.textDark} hover:bg-gray-700/50`
              : `${blockStyle.textLight} hover:bg-black/5`
          }`}
        >
          <ChevronDown
            size={16}
            className={`flex-shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
          />
          <BlockIcon size={14} className="flex-shrink-0" />
          {category}
          {minutes > 0 && (
            <span
              className={`ml-auto text-[11px] font-normal normal-case tabular-nums ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              {exact ? '' : '~'}
              {minutes} min
            </span>
          )}
          <span
            className={`${minutes > 0 ? 'ml-2' : 'ml-auto'} text-xs font-normal tabular-nums ${
              isComplete ? 'text-green-500' : darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {stats.completedCount}/{stats.total}
          </span>
        </button>
        <div
          className={`h-1 mx-2 mb-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700/60' : 'bg-gray-200'}`}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isComplete ? 'bg-green-500' : blockStyle.bar
            }`}
            style={{
              width: `${stats.total > 0 ? (stats.completedCount / stats.total) * 100 : 0}%`,
            }}
          />
        </div>
        {!isCollapsed && (
          <div className={`divide-y ${darkMode ? 'divide-gray-700/40' : 'divide-gray-200'}`}>
            {exList.map(({ ex, index: exIndex }) => {
              const exerciseKey = `${day}-${category}-${exIndex}`;
              const noteText = getNote(day, category, exIndex);
              return (
                <ExerciseRow
                  key={exIndex}
                  ex={ex}
                  exIndex={exIndex}
                  day={day}
                  category={category}
                  exerciseKey={exerciseKey}
                  completed={isCompleted(day, category, exIndex)}
                  justCompleted={wasJustCompleted(day, category, exIndex)}
                  noteText={noteText}
                  isExpanded={expandedNotes.has(exerciseKey)}
                  hasNote={!!noteText}
                  darkMode={darkMode}
                  viewMode={viewMode}
                  showConfetti={confettiKey === exerciseKey}
                  onConfettiComplete={clearConfetti}
                  toggleComplete={toggleComplete}
                  openNotes={openNotes}
                  closeNotes={closeNotes}
                  discardNote={discardNote}
                  handleNoteChange={handleNoteChange}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Whole-day card used by the week and 3-day views.
  const renderDayCard = (day, highlightToday = false) => {
    const isToday = highlightToday && day === todayLabel;
    const dayExercises = getExercisesForDay(day);

    return (
      <div
        key={day}
        className={`h-full flex flex-col min-h-0 rounded-xl border p-2 ${
          darkMode
            ? 'bg-gray-800 border-transparent shadow-md shadow-black/30'
            : 'bg-white border-gray-200 shadow-sm'
        } ${
          isToday
            ? darkMode
              ? 'border-blue-500/70 bg-blue-900'
              : 'border-blue-300 bg-blue-50'
            : ''
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
            {renderDayLabel(day)}
          </h2>
        </div>

        <div className="flex-1 overflow-auto min-h-0 space-y-3">
          {dayExercises.map(({ category, exercises: exList }) =>
            renderBlock(day, category, exList)
          )}
        </div>
      </div>
    );
  };

  return (
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

      {/* Main Content */}
      <div className="w-full p-3 sm:p-6 flex-1 min-h-0 flex flex-col lg:overflow-hidden">
        {viewMode === 'day' && (
          <>
            {/* Compact 7-up day grid (small screens) */}
            <div className="mb-3 grid grid-cols-7 gap-1 sm:hidden">
              {days.map((day) => {
                const isSelectedDay = selectedDay === day;
                return (
                  <button
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
                );
              })}
            </div>

            {/* Full day pills (larger screens) */}
            <div className="mb-4 hidden sm:flex gap-2 flex-wrap justify-center">
              {days.map((day) => {
                const isSelectedDay = selectedDay === day;
                return (
                  <button
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
                    {renderDayLabel(day, isSelectedDay)}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'week' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 lg:gap-1 flex-1 min-h-0">
            {days.map((day) => renderDayCard(day, true))}
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
                  day: 'numeric',
                })}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full border self-center ${
                  computeIsStrengthDay(getExercisesForDay(selectedDay))
                    ? darkMode
                      ? 'border-purple-700/60 text-purple-300 bg-purple-900/20'
                      : 'border-purple-300 text-purple-700 bg-purple-50'
                    : darkMode
                      ? 'border-gray-600 text-gray-400 bg-gray-800'
                      : 'border-gray-300 text-gray-500 bg-gray-50'
                }`}
              >
                {computeIsStrengthDay(getExercisesForDay(selectedDay))
                  ? 'Strength day'
                  : 'Rest day'}
              </span>
            </div>

            {/* Blocks in fixed columns: each block is assigned a column by
                index (round-robin), so collapsing a section only shrinks its
                own column and never reflows blocks across columns. */}
            <div className="flex-1 overflow-auto min-h-0 flex gap-4 items-start">
              {Array.from({ length: columnCount }, (_, col) => (
                <div key={col} className="flex-1 min-w-0 flex flex-col gap-4">
                  {getExercisesForDay(selectedDay)
                    .filter(({ category }) => Math.min(laneFor(category), columnCount - 1) === col)
                    .map(({ category, exercises: exList }) => (
                      <div
                        key={category}
                        className={`rounded-xl border-t-2 p-2 ${getBlockStyle(category).top} ${
                          darkMode
                            ? 'bg-gray-800 shadow-md shadow-black/30'
                            : 'bg-white border border-t-2 border-gray-200 shadow-sm'
                        }`}
                      >
                        {renderBlock(selectedDay, category, exList)}
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
                {renderDayCard(day)}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default App;
