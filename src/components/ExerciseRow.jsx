import { Check, BellRing, FileText } from 'lucide-react';
import Confetti from './Confetti';
import { formatExerciseName, getExerciseIcon, getPriorityIcon } from '../lib/exerciseDisplay';

/**
 * One exercise: completion toggle, equipment/priority badges, sets/reps, and
 * (in day/3-day view) an expandable note editor. Presentational — all state
 * reads and mutations come in as props.
 */
export default function ExerciseRow({
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
  confettiKey,
  setConfettiKey,
  toggleComplete,
  openNotes,
  closeNotes,
  discardNote,
  handleNoteChange,
}) {
  return (
    <div
      className={`relative w-full rounded-lg border overflow-hidden ${
        completed
          ? darkMode
            ? 'bg-green-900/30 border-green-700'
            : 'bg-green-50 border-green-300'
          : darkMode
            ? 'bg-gray-900/50 border-gray-700'
            : 'bg-gradient-to-r from-gray-50 to-white border-gray-100'
      } ${ex.priority === 'high' && !completed ? 'border-l-4 border-l-yellow-400' : ''}`}
    >
      <button
        onClick={() => toggleComplete(day, category, exIndex)}
        className="w-full flex items-center gap-3 p-3 text-left transition-all duration-200"
      >
        {confettiKey === exerciseKey && <Confetti onComplete={() => setConfettiKey(null)} />}

        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            completed
              ? 'bg-green-500 border-green-500 text-white scale-110'
              : darkMode
                ? 'bg-gray-800 border-gray-600 hover:border-blue-400'
                : 'bg-white border-gray-300 hover:border-blue-400'
          }`}
        >
          {completed && <Check size={14} strokeWidth={3} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {getPriorityIcon(ex.priority, darkMode)}
            {getExerciseIcon(ex.name, darkMode)}
            <div
              className={`font-medium text-sm leading-tight ${
                completed
                  ? darkMode
                    ? 'text-green-300'
                    : 'text-green-800'
                  : darkMode
                    ? 'text-gray-200'
                    : 'text-gray-800'
              }`}
            >
              {formatExerciseName(ex.name)}
            </div>
          </div>
          <div
            className={`text-xs mt-1 font-medium ${
              completed
                ? darkMode
                  ? 'text-green-400'
                  : 'text-green-600'
                : darkMode
                  ? 'text-gray-400'
                  : 'text-gray-500'
            }`}
          >
            {ex.sets ? `${ex.sets} x ` : ''}
            {ex.reps}
            {ex.hold}
            {ex.target}
          </div>
          {viewMode === 'week' && noteText && (
            <div
              className={`mt-2 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full ${
                darkMode
                  ? 'bg-amber-900/40 text-amber-100 border border-amber-800'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Notes saved
            </div>
          )}
        </div>
      </button>
      {(viewMode === 'day' || viewMode === 'three') && (
        <>
          {!isExpanded ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openNotes(exerciseKey);
              }}
              className={`absolute bottom-2 right-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-all ${
                darkMode
                  ? 'text-gray-400 border-gray-700 bg-transparent hover:text-gray-200 hover:border-gray-500 hover:bg-gray-800'
                  : 'text-gray-500 border-gray-200 bg-transparent hover:text-gray-800 hover:border-gray-300 hover:bg-blue-50'
              }`}
              title={hasNote ? '' : 'Add notes'}
            >
              {!hasNote && ' + note'}
              {hasNote && <BellRing size={12} className="text-orange-400 fill-amber-300" />}
            </button>
          ) : (
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
                        darkMode ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-red-500'
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
                      darkMode ? 'text-gray-400 hover:text-blue-500' : 'text-gray-600 hover:text-blue-500'
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
                rows={noteText ? Math.max(2, Math.ceil(noteText.split('\n').length)) : 2}
                placeholder="Add a quick note for this exercise"
              />
            </div>
          )}
        </>
      )}
      {justCompleted && (
        <div className="absolute inset-0 pointer-events-none ring-2 ring-green-400/70 rounded-lg"></div>
      )}
    </div>
  );
}
