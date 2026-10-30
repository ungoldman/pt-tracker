import { useTracker } from '../context/TrackerContext'
import { getBlockStyle } from '../lib/blockStyle'
import { itemKey } from '../lib/plan'
import { exerciseId } from '../lib/stats'
import ExerciseRow from './ExerciseRow'

/**
 * A run of exercises from one block under its accent header, checked off in
 * `scope`. Reads shared state from context but hands each row explicit,
 * stable props so ExerciseRow's memo still limits note-keystroke re-renders
 * to the edited row.
 */
export default function ItemGroup({ scope, category, list, label }) {
  const {
    darkMode,
    notes,
    expandedNotes,
    confettiKey,
    justCompleted,
    isDone,
    weekCountOf,
    toggleComplete,
    clearConfetti,
    openNotes,
    closeNotes,
    discardNote,
    handleNoteChange,
    startHold
  } = useTracker()
  const { Icon, textDark, textLight } = getBlockStyle(category)
  const done = (ex) => isDone(scope, itemKey(category, ex))
  const doneCount = list.filter(done).length

  return (
    <div data-group={`${scope}-${category}`}>
      <div
        className={`flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide ${
          darkMode ? textDark : textLight
        }`}
      >
        <Icon size={14} className="shrink-0" />
        {label}
        <span
          className={`ml-auto font-normal tabular-nums ${
            doneCount === list.length
              ? 'text-green-500'
              : darkMode
                ? 'text-gray-400'
                : 'text-gray-500'
          }`}
        >
          {doneCount}/{list.length}
        </span>
      </div>
      <div className={`divide-y ${darkMode ? 'divide-gray-700/40' : 'divide-gray-200'}`}>
        {list.map((ex) => {
          const exId = exerciseId(ex)
          const key = itemKey(category, ex)
          const noteText = notes[key] || ''
          return (
            <ExerciseRow
              key={exId}
              ex={ex}
              exId={exId}
              scope={scope}
              category={category}
              exerciseKey={key}
              completed={done(ex)}
              justCompleted={justCompleted.has(key)}
              noteText={noteText}
              isExpanded={expandedNotes.has(key)}
              hasNote={!!noteText}
              darkMode={darkMode}
              weekCount={weekCountOf(key)}
              showConfetti={confettiKey === key}
              onConfettiComplete={clearConfetti}
              toggleComplete={toggleComplete}
              openNotes={openNotes}
              closeNotes={closeNotes}
              discardNote={discardNote}
              handleNoteChange={handleNoteChange}
              startHold={startHold}
            />
          )
        })}
      </div>
    </div>
  )
}
