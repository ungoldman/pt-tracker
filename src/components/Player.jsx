import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  List,
  PlayCircle,
  Timer,
  X
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTracker } from '../context/TrackerContext'
import { exercises } from '../data'
import { getBlockStyle } from '../lib/blockStyle'
import { holdPlan } from '../lib/duration'
import { formatExerciseName } from '../lib/exerciseDisplay'
import { itemKey } from '../lib/plan'
import { exerciseId } from '../lib/stats'
import ItemGroup from './ItemGroup'

// How long a checked card stays before moving on, so the check registers and
// a second tap meant for this card cannot land on the next one.
const ADVANCE_MS = 600

// Quiet time after the last scroll event before the track counts as at rest.
const SETTLE_MS = 120

// "3 × 10, 3s hold", "2 × 30s hold", "5000".
const dose = ({ sets, reps, hold, target }) => {
  const what = [reps, hold && `${hold} hold`].filter(Boolean).join(', ')
  return [sets && `${sets} ×`, what, target].filter(Boolean).join(' ')
}

const labelOf = ({ category, label }) => label ?? exercises[category]?.displayName ?? category

/**
 * One run of exercises, a session or a hand pass, one card at a time. A tap on
 * the card checks it off and moves on, a swipe or the arrows move without
 * checking, and the list view shows the whole run for checking off after the
 * fact. The last card is the summary. `scope` is where checks are kept.
 */
export default function Player({ title, scope, items, summary, onDone, onClose }) {
  const { darkMode, isDone, toggleComplete, notes, handleNoteChange, startHold } = useTracker()
  const [view, setView] = useState('cards')
  // Pick up at the first exercise not yet done.
  const [index, setIndex] = useState(() => {
    const open = items.findIndex(({ category, ex }) => !isDone(scope, itemKey(category, ex)))
    return open === -1 ? items.length : open
  })
  const [noteOpen, setNoteOpen] = useState(false)
  const trackRef = useRef(null)
  const advanceRef = useRef(null)
  const settleRef = useRef(null)
  const indexRef = useRef(index)
  indexRef.current = index

  useEffect(
    () => () => {
      clearTimeout(advanceRef.current)
      clearTimeout(settleRef.current)
    },
    []
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: coming back from the list mounts a new track, which has to be scrolled to the current card.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({ left: index * track.clientWidth, behavior: reduced ? 'auto' : 'smooth' })
  }, [index, view])

  const go = (to) => {
    clearTimeout(advanceRef.current)
    setNoteOpen(false)
    setIndex(Math.max(0, Math.min(items.length, to)))
  }

  // A swipe lands on a snap point. Follow it, but only once the track is at
  // rest: the smooth scroll an arrow or a check starts fires scroll events on
  // the way, and reading one of those would pull the card back.
  const onScroll = () => {
    clearTimeout(settleRef.current)
    settleRef.current = setTimeout(() => {
      const { scrollLeft, clientWidth } = trackRef.current
      if (!clientWidth) return
      const at = Math.round(scrollLeft / clientWidth)
      if (at !== indexRef.current) go(at)
    }, SETTLE_MS)
  }

  // Arrow keys step through the cards on a keyboard, unless typing a note.
  const goRef = useRef(go)
  goRef.current = go
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') goRef.current(indexRef.current + 1)
      if (e.key === 'ArrowLeft') goRef.current(indexRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const switchView = () => {
    clearTimeout(settleRef.current)
    setView(view === 'cards' ? 'list' : 'cards')
  }

  const check = ({ category, ex }) => {
    // An undo cancels the move a check just queued.
    clearTimeout(advanceRef.current)
    const wasDone = isDone(scope, itemKey(category, ex))
    toggleComplete(scope, category, exerciseId(ex))
    if (!wasDone) advanceRef.current = setTimeout(() => go(index + 1), ADVANCE_MS)
  }

  const doneCount = items.filter(({ category, ex }) => isDone(scope, itemKey(category, ex))).length
  const surface = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const control = `hit-44 relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs ${muted}`

  const top = (
    <div className="px-4 pt-3">
      <div className="flex gap-1" aria-hidden="true">
        {items.map(({ category, ex }, n) => (
          <span
            key={itemKey(category, ex)}
            className={`h-1 flex-1 rounded-full ${
              isDone(scope, itemKey(category, ex))
                ? 'bg-blue-500'
                : n === index
                  ? darkMode
                    ? 'bg-gray-300'
                    : 'bg-gray-500'
                  : darkMode
                    ? 'bg-gray-700'
                    : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <h2 className={`text-sm ${muted}`}>
          {title},{' '}
          <span className="tabular-nums">
            {doneCount} of {items.length}
          </span>
        </h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={switchView} className={control}>
            {view === 'cards' ? <List size={14} /> : <ChevronLeft size={14} />}
            {view === 'cards' ? 'List' : 'Cards'}
          </button>
          <button type="button" onClick={onClose} className={control} aria-label="Close">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )

  if (view === 'list') {
    const groups = []
    items.forEach((item) => {
      const last = groups.at(-1)
      if (last && last.category === item.category && last.label === labelOf(item)) {
        last.list.push(item.ex)
      } else groups.push({ category: item.category, label: labelOf(item), list: [item.ex] })
    })
    return (
      <section aria-label={title} className={`flex-1 ${surface}`}>
        {top}
        <div className={`m-3 space-y-3 rounded-xl p-2 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {groups.map((g) => (
            <ItemGroup
              key={`${g.label}-${g.list[0].name}`}
              scope={scope}
              category={g.category}
              label={g.label}
              list={g.list}
            />
          ))}
        </div>
        <div className="px-3 pb-6">
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-xl bg-blue-600 py-3 text-base font-medium text-white"
          >
            Done for now
          </button>
        </div>
      </section>
    )
  }

  const current = items[index]

  return (
    <section aria-label={title} className={`flex flex-1 flex-col ${surface}`}>
      {top}
      {/* From lg up the run is listed beside the card, to see and jump. */}
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-6 lg:px-4">
        <nav aria-label="Exercises" className="hidden lg:block lg:pt-6">
          <ol className="space-y-0.5">
            {items.map(({ category, ex }, n) => (
              <li key={itemKey(category, ex)}>
                <button
                  type="button"
                  onClick={() => go(n)}
                  aria-current={n === index ? 'step' : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${
                    n === index
                      ? darkMode
                        ? 'bg-gray-800 text-gray-100'
                        : 'bg-white text-gray-900 shadow-sm'
                      : muted
                  }`}
                >
                  {isDone(scope, itemKey(category, ex)) ? (
                    <Check size={14} strokeWidth={3} className="shrink-0 text-green-500" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-gray-500" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{formatExerciseName(ex.name)}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            ref={trackRef}
            onScroll={onScroll}
            className="flex flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] lg:flex-none"
          >
            {items.map((item, n) => {
              const { category, ex } = item
              const key = itemKey(category, ex)
              const done = isDone(scope, key)
              const plan = holdPlan(ex)
              const { textDark, textLight } = getBlockStyle(category)
              return (
                <article
                  key={key}
                  aria-label={formatExerciseName(ex.name)}
                  aria-hidden={n !== index}
                  className="flex w-full shrink-0 snap-center flex-col px-6 pt-8"
                >
                  <p className={`text-xs font-medium ${darkMode ? textDark : textLight}`}>
                    {labelOf(item)}
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold leading-tight">
                    {formatExerciseName(ex.name)}
                  </h3>
                  <p className="mt-6 text-4xl font-semibold tabular-nums">{dose(ex)}</p>
                  {ex.perDay && <p className={`mt-1 text-sm ${muted}`}>{ex.perDay} times a day</p>}
                  {plan && !done && (
                    <button
                      type="button"
                      onClick={() =>
                        startHold(
                          scope,
                          category,
                          exerciseId(ex),
                          plan,
                          formatExerciseName(ex.name)
                        )
                      }
                      className={`mt-6 flex items-center justify-center gap-2 rounded-xl py-3 text-base ${
                        darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
                      }`}
                    >
                      <Timer size={18} />
                      Start holds, {plan.count} × {plan.seconds}s
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => check(item)}
                    aria-pressed={done}
                    className={`mt-6 flex min-h-40 flex-1 max-h-56 items-center justify-center gap-2 rounded-3xl text-lg ${
                      done
                        ? 'bg-green-600/20 text-green-400'
                        : `border-2 border-dashed ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'}`
                    }`}
                  >
                    {done ? (
                      <>
                        <Check size={22} strokeWidth={3} /> Done, tap to undo
                      </>
                    ) : (
                      'Tap when done'
                    )}
                  </button>
                </article>
              )
            })}
            <article
              aria-label="Summary"
              aria-hidden={index !== items.length}
              className="flex w-full shrink-0 snap-center flex-col items-center px-8 pt-16 text-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
                <Check size={32} strokeWidth={3} className="text-green-500" />
              </span>
              <h3 className="mt-5 text-2xl font-semibold">
                {doneCount === items.length
                  ? `${title} done`
                  : `${doneCount} of ${items.length} done`}
              </h3>
              <div className={`mt-6 w-full text-sm ${muted}`}>{summary}</div>
              <button
                type="button"
                onClick={onDone}
                className="mt-8 w-full rounded-xl bg-blue-600 py-3 text-base font-medium text-white"
              >
                {doneCount === items.length ? 'Back to today' : 'Stop here'}
              </button>
            </article>
          </div>
          {current && (
            <div className="px-4 pb-6">
              {noteOpen && (
                <textarea
                  value={notes[itemKey(current.category, current.ex)] ?? ''}
                  onChange={(e) =>
                    handleNoteChange(current.category, exerciseId(current.ex), e.target.value)
                  }
                  rows={3}
                  placeholder="A note for this exercise"
                  className={`mb-2 w-full rounded-lg p-2 text-base focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'
                  }`}
                />
              )}
              <div className="grid grid-cols-4 items-center">
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  className={control}
                  aria-label="Previous exercise"
                  disabled={index === 0}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setNoteOpen((v) => !v)}
                  className={`${control} justify-center`}
                  aria-expanded={noteOpen}
                >
                  <FileText size={14} />
                  {notes[itemKey(current.category, current.ex)] ? 'Note' : 'Add note'}
                </button>
                {current.ex.link ? (
                  <a
                    href={current.ex.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${control} justify-center`}
                  >
                    <PlayCircle size={14} />
                    Video
                  </a>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  className={`${control} justify-end`}
                  aria-label="Next exercise"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
