import { memo } from 'react';
import { Check, BellRing, FileText } from 'lucide-react';
import Confetti from './Confetti';
import { formatExerciseName, getExerciseIcon, getPriorityIcon } from '../lib/exerciseDisplay';

/**
 * One exercise as a dense flat list row: completion toggle, badges, name,
 * sets/reps right-aligned on one line (day/3-day) or stacked (narrow week
 * columns), plus a note affordance with an expandable editor in day/3-day
 * view. Presentational — all state reads and mutations come in as props.
 * Memoized so note keystrokes and confetti only re-render the affected row.
 */
export default memo(function ExerciseRow({
  ex,
  exIndex,
  day,
  category,
  exerciseKey,
  completed,
  justCompleted,
  noteText,
  isExpanded,
  hasNote,
  darkMode,
  viewMode,
  showConfetti,
  onConfettiComplete,
  toggleComplete,
  openNotes,
  closeNotes,
  discardNote,
  handleNoteChange,
}) {
  const showNotesUI = viewMode === 'day' || viewMode === 'three';
  const repsText = (
    <>
      {ex.sets ? `${ex.sets} x ` : ''}
      {ex.reps}
      {ex.hold}
      {ex.target}
    </>
  );
  const nameColor = completed
    ? darkMode
      ? 'text-green-300'
      : 'text-green-800'
    : darkMode
      ? 'text-gray-200'
      : 'text-gray-800';
  const repsColor = completed
    ? darkMode
      ? 'text-green-400'
      : 'text-green-600'
    : darkMode
      ? 'text-gray-400'
      : 'text-gray-500';

  return (
    <div
      className={`relative ${completed ? (darkMode ? 'bg-green-900/25' : 'bg-green-50') : ''} ${
        ex.priority === 'high' && !completed ? 'border-l-2 border-l-yellow-400' : ''
      }`}
    >
      <button
        onClick={() => toggleComplete(day, category, exIndex)}
        className={`w-full flex items-center gap-2.5 pl-2 py-2 min-h-[44px] text-left ${
          showNotesUI ? 'pr-9' : 'pr-2'
        }`}
      >
        {showConfetti && <Confetti onComplete={onConfettiComplete} />}

        <span
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
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
        {viewMode === 'week' ? (
          <span className="flex-1 min-w-0">
            <span className={`block text-sm font-medium leading-tight ${nameColor}`}>
              {formatExerciseName(ex.name)}
              {hasNote && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 ml-1.5 align-middle"
                  title="Has a note"
                />
              )}
            </span>
            <span className={`block text-xs mt-0.5 font-medium ${repsColor}`}>{repsText}</span>
          </span>
        ) : (
          <>
            <span className={`flex-1 min-w-0 text-sm font-medium leading-tight ${nameColor}`}>
              {formatExerciseName(ex.name)}
            </span>
            <span className={`text-xs font-medium whitespace-nowrap ${repsColor}`}>{repsText}</span>
          </>
        )}
      </button>

      {showNotesUI && !isExpanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openNotes(exerciseKey);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2"
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

      {showNotesUI && isExpanded && (
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
                  onClick={(e) => {
                    e.stopPropagation();
                    discardNote(exerciseKey);
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
                onClick={(e) => {
                  e.stopPropagation();
                  closeNotes(exerciseKey);
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
            onChange={(e) => handleNoteChange(day, category, exIndex, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => {
              e.stopPropagation();
              openNotes(exerciseKey);
            }}
            className={`w-full text-sm rounded-md resize-none p-2 focus:outline-none focus:ring-2 ${
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
  );
});
