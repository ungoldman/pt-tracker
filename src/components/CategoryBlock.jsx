import { CalendarDays, ChevronDown } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTracker } from '../context/TrackerContext'
import { exercises } from '../data'
import { useDismiss } from '../hooks/useDismiss'
import { getBlockStyle } from '../lib/blockStyle'
import { estimateBlock } from '../lib/duration'
import { isGated } from '../lib/schedule'
import { categoryStats, completionKey, exerciseId, isCompleted as isDone } from '../lib/stats'
import ExerciseRow from './ExerciseRow'
import MovePanel from './MovePanel'

/**
 * One block: an accent-colored collapsible header with phase icon, time
 * estimate, and progress bar, over its exercise rows. Reads shared state and
 * handlers from context, but hands each row explicit, stable props so
 * ExerciseRow's memo still limits note-keystroke re-renders to the edited row.
 *
 * `day` is the block's scheduled day and its storage identity. `shownDay` is
 * the day it renders under, which differs once the block has been moved.
 */
export default function CategoryBlock({ day, shownDay = day, category, exList }) {
  const {
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
    moveBlock
  } = useTracker()
  const [moveOpen, setMoveOpen] = useState(false)
  const rootRef = useRef(null)
  const closeMove = useCallback(() => setMoveOpen(false), [])
  useDismiss(rootRef, moveOpen, closeMove)

  const stats = categoryStats(completed, day, category, exList)
  const isComplete = stats.total > 0 && stats.completedCount === stats.total
  const isCollapsed = isCategoryCollapsed(day, category, isComplete)
  const blockStyle = getBlockStyle(category)
  const BlockIcon = blockStyle.Icon
  const displayName = exercises[category]?.displayName || category
  const moved = shownDay !== day
  // Week columns have no room for the control, same as the note editor.
  const showMoveUI = viewMode === 'day' || viewMode === 'three'
  const { minutes, exact } = estimateBlock(
    exercises[category],
    exList.map(({ ex }) => ex)
  )

  return (
    <div ref={rootRef}>
      <div className="flex items-center gap-0.5 mb-1">
        <button
          type="button"
          onClick={() => toggleCategoryCollapse(day, category, isCollapsed)}
          className={`flex-1 min-w-0 flex items-center gap-2 font-semibold text-xs uppercase tracking-wide px-2 py-1 rounded transition-colors ${
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
          {displayName}
          {moved && (
            <span
              className={`text-[11px] font-normal normal-case tracking-normal whitespace-nowrap ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              from {day.slice(0, 3)}
            </span>
          )}
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
        {showMoveUI && (
          <button
            type="button"
            onClick={() => setMoveOpen((prev) => !prev)}
            aria-label={`Move or skip ${displayName}`}
            aria-expanded={moveOpen}
            title="Move or skip"
            className={`flex-shrink-0 p-1 rounded transition-colors ${
              darkMode
                ? 'text-gray-500 hover:text-gray-200 hover:bg-gray-700/50'
                : 'text-gray-400 hover:text-gray-700 hover:bg-black/5'
            }`}
          >
            <CalendarDays size={14} />
          </button>
        )}
      </div>
      {moveOpen && (
        <MovePanel
          darkMode={darkMode}
          shownDay={shownDay}
          moved={moved}
          showDays={isGated(exercises[category], exList)}
          onPick={(to) => {
            moveBlock(day, category, to)
            setMoveOpen(false)
          }}
          onBack={() => {
            moveBlock(day, category, null)
            setMoveOpen(false)
          }}
        />
      )}
      <div
        className={`h-1 mx-2 mb-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700/60' : 'bg-gray-200'}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isComplete ? 'bg-green-500' : blockStyle.bar
          }`}
          style={{
            width: `${stats.total > 0 ? (stats.completedCount / stats.total) * 100 : 0}%`
          }}
        />
      </div>
      {!isCollapsed && (
        <div className={`divide-y ${darkMode ? 'divide-gray-700/40' : 'divide-gray-200'}`}>
          {exList.map(({ ex }) => {
            const exId = exerciseId(ex)
            const exerciseKey = completionKey(day, category, exId)
            const noteText = notes[exerciseKey] || ''
            return (
              <ExerciseRow
                key={exId}
                ex={ex}
                exId={exId}
                day={day}
                category={category}
                exerciseKey={exerciseKey}
                completed={isDone(completed, day, category, exId)}
                justCompleted={justCompleted.has(exerciseKey)}
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
            )
          })}
        </div>
      )}
    </div>
  )
}
