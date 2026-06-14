import { ChevronDown } from 'lucide-react';
import ExerciseRow from './ExerciseRow';
import { exercises } from '../data';
import { getBlockStyle } from '../lib/blockStyle';
import { estimateBlock } from '../lib/duration';
import { categoryStats, completionKey, exerciseId, isCompleted as isDone } from '../lib/stats';
import { useTracker } from '../context/TrackerContext';

/**
 * One block: an accent-colored collapsible header with phase icon, time
 * estimate, and progress bar, over its exercise rows. Reads shared state and
 * handlers from context, but hands each row explicit, stable props so
 * ExerciseRow's memo still limits note-keystroke re-renders to the edited row.
 */
export default function CategoryBlock({ day, category, exList }) {
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
  } = useTracker();

  const stats = categoryStats(completed, day, category, exList);
  const isComplete = stats.total > 0 && stats.completedCount === stats.total;
  const isCollapsed = isCategoryCollapsed(day, category, isComplete);
  const blockStyle = getBlockStyle(category);
  const BlockIcon = blockStyle.Icon;
  const { minutes, exact } = estimateBlock(
    exercises[category],
    exList.map(({ ex }) => ex)
  );

  return (
    <div>
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
          {exList.map(({ ex }) => {
            const exId = exerciseId(ex);
            const exerciseKey = completionKey(day, category, exId);
            const noteText = notes[exerciseKey] || '';
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
            );
          })}
        </div>
      )}
    </div>
  );
}
