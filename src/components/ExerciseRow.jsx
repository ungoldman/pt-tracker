import { BellRing, Check, FileText, Timer } from 'lucide-react'
import { memo } from 'react'
import { useSingleTap } from '../hooks/useSingleTap'
import { holdPlan } from '../lib/duration'
import {
  formatDose,
  formatExerciseName,
  getExerciseIcon,
  getPriorityIcon
} from '../lib/exerciseDisplay'
import Confetti from './Confetti'

/**
 * One exercise as a dense flat list row: completion toggle, badges, name,
 * sets/reps right-aligned on one line from sm up or stacked under the name on
 * phones, plus a note affordance with an expandable editor and, for exercises
 * built on timed holds, a button that starts the hold timer with that
 * exercise's own length and count. `scope` is what the check belongs to, a
 * session or the day's routine. Presentational, all state reads and mutations
 * come in as props. Memoized so note keystrokes and confetti only re-render
 * the affected row.
 */
export default memo(function ExerciseRow({
  ex,
  exId,
  scope,
  category,
  exerciseKey,
  completed,
  justCompleted,
  noteText,
  isExpanded,
  hasNote,
  darkMode,
  weekCount,
  showConfetti,
  onConfettiComplete,
  toggleComplete,
  openNotes,
  closeNotes,
  discardNote,
  handleNoteChange,
  startHold
}) {
  const nameBlock = ex.link ? (
    <>
      <span>{formatExerciseName(ex.name)}</span>
      <span className="ml-1.5 text-xs">
        <a
          href={ex.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
          // prevent default click behavior (toggle complete) when clicking the link
          onClick={(e) => e.stopPropagation()}
        >
          video
        </a>
      </span>
    </>
  ) : (
    formatExerciseName(ex.name)
  )

  const singleTap = useSingleTap()
  const plan = holdPlan(ex)
  const repsText = [
    formatDose(ex),
    ex.perDay && `${ex.perDay}x/day`,
    ex.perWeek && `${weekCount} of ${ex.perWeek} this week`
  ]
    .filter(Boolean)
    .join(', ')
  const nameColor = completed
    ? darkMode
      ? 'text-green-300'
      : 'text-green-800'
    : darkMode
      ? 'text-gray-200'
      : 'text-gray-800'
  const repsColor = completed
    ? darkMode
      ? 'text-green-400'
      : 'text-green-600'
    : darkMode
      ? 'text-gray-400'
      : 'text-gray-500'

  // A div (not a button) so the exercise name stays selectable/copyable; a
  // drag-select shouldn't also toggle, so a click that ends a text selection
  // is ignored. Keyboard activation (Enter/Space) keeps it operable.
  const handleToggle = () => {
    const selection = window.getSelection?.()
    if (selection && !selection.isCollapsed) return
    if (singleTap()) toggleComplete(scope, category, exId)
  }
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleComplete(scope, category, exId)
    }
  }

  return (
    <div className={`relative ${completed ? (darkMode ? 'bg-green-900/25' : 'bg-green-50') : ''}`}>
      {/* biome-ignore lint/a11y/useSemanticElements: the row wraps nested interactive controls (the note button), which a native button can't contain, so it stays a div with an explicit button role. */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center gap-2.5 pl-2 py-2 min-h-[44px] text-left cursor-pointer select-text ${
          plan ? 'pr-17' : 'pr-9'
        }`}
      >
        {showConfetti && <Confetti onComplete={onConfettiComplete} />}

        <span
          className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            completed
              ? 'bg-green-500 border-green-500 text-white'
              : darkMode
                ? 'bg-gray-800 border-gray-600'
                : 'bg-white border-gray-300'
          }`}
        >
          {completed && <Check size={12} strokeWidth={3} />}
        </span>
        {getPriorityIcon(ex.priority, darkMode)}
        {getExerciseIcon(ex.name, darkMode)}
        {/* One line from sm up, stacked on phones, where a long name beside
            its sets would wrap to three lines. */}
        <span className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-2.5">
          <span className={`text-sm font-medium leading-tight sm:flex-1 sm:min-w-0 ${nameColor}`}>
            {nameBlock}
          </span>
          <span
            className={`text-xs mt-0.5 font-medium tabular-nums sm:mt-0 sm:whitespace-nowrap ${repsColor}`}
          >
            {repsText}
          </span>
        </span>
      </div>

      {plan && !isExpanded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            startHold(scope, category, exId, plan, formatExerciseName(ex.name))
          }}
          className={`hit-44 absolute right-9 top-1/2 -translate-y-1/2 p-2 ${
            darkMode ? 'text-gray-500 hover:text-blue-300' : 'text-gray-400 hover:text-blue-600'
          }`}
          aria-label={`Start hold timer: ${plan.count} x ${plan.seconds}s`}
          title={`Start hold timer: ${plan.count} x ${plan.seconds}s`}
        >
          <Timer size={14} />
        </button>
      )}

      {!isExpanded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            openNotes(exerciseKey)
          }}
          className="hit-44 absolute right-1 top-1/2 -translate-y-1/2 p-2"
          aria-label={hasNote ? 'View note' : 'Add a note'}
          title={hasNote ? 'View note' : 'Add a note'}
        >
          {hasNote ? (
            <BellRing size={14} className="text-orange-400 fill-amber-300" />
          ) : (
            <FileText
              size={14}
              className={
                darkMode ? 'text-gray-600 hover:text-gray-300' : 'text-gray-300 hover:text-gray-600'
              }
            />
          )}
        </button>
      )}

      {isExpanded && (
        <div
          className={`border-t text-xs px-3 pb-3 pt-2 ${
            darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-100 bg-white/60'
          }`}
        >
          <div className="flex items-start justify-between mb-1.5 gap-3">
            <div
              className={`flex items-center gap-2 font-semibold ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}
            >
              <FileText size={12} />
              Notes
            </div>
            <div className="flex justify-end gap-2">
              {hasNote && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    discardNote(exerciseKey)
                  }}
                  className={`text-[11px] rounded-md transition-colors hover:underline opacity-75 ${
                    darkMode
                      ? 'text-gray-400 hover:text-red-500'
                      : 'text-gray-600 hover:text-red-500'
                  }`}
                  title="Discard note"
                >
                  Discard
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  closeNotes(exerciseKey)
                }}
                className={`text-[11px] rounded-md transition-colors hover:underline opacity-75 ${
                  darkMode
                    ? 'text-gray-400 hover:text-blue-500'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
                title="Close notes"
              >
                Close
              </button>
            </div>
          </div>
          <textarea
            value={noteText}
            onChange={(e) => handleNoteChange(category, exId, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => {
              e.stopPropagation()
              openNotes(exerciseKey)
            }}
            // 16px on phones: iOS Safari zooms the page when a smaller input takes focus.
            className={`w-full text-base sm:text-sm rounded-md resize-none p-2 focus:outline-hidden focus:ring-2 ${
              darkMode
                ? 'bg-gray-800 text-gray-100 border border-gray-700 focus:ring-blue-500'
                : 'bg-white text-gray-800 border border-gray-200 focus:ring-blue-400'
            }`}
            rows={noteText ? Math.max(2, noteText.split('\n').length) : 2}
            placeholder="Add a quick note for this exercise"
          />
        </div>
      )}

      {justCompleted && (
        <div className="absolute inset-0 pointer-events-none ring-2 ring-inset ring-green-400/70"></div>
      )}
    </div>
  )
})
