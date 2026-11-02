import {
  ArrowRight,
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
import { useSingleTap } from '../hooks/useSingleTap'
import { useWakeLock } from '../hooks/useWakeLock'
import { getBlockStyle } from '../lib/blockStyle'
import { holdPlan } from '../lib/duration'
import { doseParts, equipmentOf, formatExerciseName } from '../lib/exerciseDisplay'
import { itemKey } from '../lib/plan'
import { exerciseId } from '../lib/stats'
import ItemGroup from './ItemGroup'

// How long a checked card stays before moving on, so the check registers and
// a second tap meant for this card cannot land on the next one.
const ADVANCE_MS = 600

// Quiet time after the last scroll event before the track counts as at rest.
const SETTLE_MS = 120

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
  // A set takes longer than a phone's screen timeout.
  useWakeLock(true)
  const singleTap = useSingleTap()
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

  // Arrow keys step through the cards on a keyboard, unless typing a note, and
  // Space marks the card done unless a focused control would take it.
  const goRef = useRef(go)
  goRef.current = go
  const checkCurrent = useRef(null)
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') goRef.current(indexRef.current + 1)
      if (e.key === 'ArrowLeft') goRef.current(indexRef.current - 1)
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault()
        checkCurrent.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const switchView = () => {
    clearTimeout(settleRef.current)
    setView(view === 'cards' ? 'list' : 'cards')
  }

  const check = ({ category, ex }) => {
    if (!singleTap()) return
    // An undo cancels the move a check just queued.
    clearTimeout(advanceRef.current)
    const wasDone = isDone(scope, itemKey(category, ex))
    toggleComplete(scope, category, exerciseId(ex))
    if (!wasDone) advanceRef.current = setTimeout(() => go(index + 1), ADVANCE_MS)
  }

  checkCurrent.current = () => {
    if (items[index]) check(items[index])
  }

  const doneCount = items.filter(({ category, ex }) => isDone(scope, itemKey(category, ex))).length
  const surface = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const shared = 'hit-44 relative flex items-center gap-1.5 whitespace-nowrap px-2 text-sm'
  const control = `${shared} min-h-11 rounded-lg ${muted}`
  // The row under Mark done, the same size as it on a desktop.
  const step = `${shared} min-h-14 justify-center rounded-xl border disabled:cursor-default disabled:opacity-30 lg:px-4 lg:text-base ${
    darkMode
      ? 'border-gray-700 text-gray-200 not-disabled:hover:bg-gray-800 not-disabled:active:bg-gray-800'
      : 'border-gray-300 text-gray-700 not-disabled:hover:bg-white not-disabled:active:bg-white'
  }`

  const top = (
    <div className="px-4 pt-3 lg:px-6">
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
        <div
          className={`m-3 space-y-3 rounded-xl p-2 lg:mx-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
        >
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
        <div className="px-3 pb-6 lg:px-6">
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-xl bg-blue-600 py-3 text-base font-medium text-white hover:bg-blue-500 lg:w-auto lg:px-8"
          >
            Done for now
          </button>
        </div>
      </section>
    )
  }

  const current = items[index]
  const following = items[index + 1]
  const firstOpen = items.findIndex(({ category, ex }) => !isDone(scope, itemKey(category, ex)))

  return (
    <section aria-label={title} className={`flex flex-1 flex-col ${surface}`}>
      {top}
      {/* From lg up the run is listed beside the card, to see and jump. */}
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8 lg:px-6">
        <nav aria-label="Exercises" className="hidden lg:block lg:pt-4">
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
                        : 'bg-white text-gray-900'
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
              const { main, sub } = doseParts(ex)
              const equipment = equipmentOf(ex.name)
              const note = notes[key]
              return (
                <article
                  key={key}
                  aria-label={formatExerciseName(ex.name)}
                  aria-hidden={n !== index}
                  // Off-screen cards stay mounted for the swipe, out of tab order.
                  inert={n !== index}
                  className="flex w-full shrink-0 snap-center flex-col px-5 pt-6 lg:px-0 lg:pt-4"
                >
                  <p className={`text-sm font-medium ${darkMode ? textDark : textLight}`}>
                    {labelOf(item)}
                    {equipment && <span className={muted}>, {equipment.label.toLowerCase()}</span>}
                  </p>
                  <h3 className="font-display mt-1 text-2xl font-semibold leading-tight lg:text-3xl">
                    {formatExerciseName(ex.name)}
                  </h3>
                  <p className="font-display mt-6 text-7xl font-bold leading-none tracking-tight tabular-nums">
                    {main}
                  </p>
                  {sub && <p className={`mt-2 text-xl ${muted}`}>{sub}</p>}
                  {ex.perDay && <p className={`mt-1 text-sm ${muted}`}>{ex.perDay} times a day</p>}
                  {note && !noteOpen && (
                    <p
                      className={`mt-4 whitespace-pre-line rounded-lg px-3 py-2 text-sm ${
                        darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'
                      }`}
                    >
                      {note}
                    </p>
                  )}
                  {/* The lower half of the screen, where the thumb already is. */}
                  <div className="mt-auto space-y-2 pt-6">
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
                        className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-medium lg:rounded-xl ${
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
                      aria-label="Mark done"
                      aria-pressed={done}
                      className={`flex min-h-[min(9rem,18dvh)] w-full flex-col items-center justify-center rounded-3xl transition-colors active:scale-[0.99] lg:min-h-14 lg:flex-row lg:gap-3 lg:rounded-xl ${
                        done
                          ? `bg-green-600/20 ${darkMode ? 'text-green-300' : 'text-green-800'}`
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      {done ? (
                        <>
                          <span className="flex items-center gap-2 text-2xl font-semibold lg:text-lg">
                            <Check size={24} strokeWidth={3} /> Done
                          </span>
                          <span className="mt-1 text-sm lg:mt-0">Undo</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl font-semibold lg:text-lg">Mark done</span>
                          <span className="hidden text-sm text-blue-100 lg:block">
                            or press Space
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              )
            })}
            <article
              aria-label="Summary"
              aria-hidden={index !== items.length}
              className="flex w-full shrink-0 snap-center flex-col items-center px-8 pt-16 text-center"
            >
              {doneCount === items.length && (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
                  <Check size={32} strokeWidth={3} className="text-green-500" />
                </span>
              )}
              <h3 className="font-display mt-5 text-2xl font-semibold">
                {doneCount === items.length
                  ? `${title} done`
                  : doneCount
                    ? `${doneCount} of ${items.length} done`
                    : 'Nothing checked off yet'}
              </h3>
              {doneCount > 0 && <div className={`mt-6 w-full text-sm ${muted}`}>{summary}</div>}
              <button
                type="button"
                onClick={onDone}
                className="mt-8 w-full rounded-xl bg-blue-600 py-3 text-base font-medium text-white hover:bg-blue-500"
              >
                {doneCount === items.length ? 'Back to today' : 'Stop here'}
              </button>
              {firstOpen !== -1 && (
                <button
                  type="button"
                  onClick={() => go(firstOpen)}
                  className={`${control} mt-2 justify-center`}
                >
                  Keep going
                  <ArrowRight size={16} />
                </button>
              )}
            </article>
          </div>
          {current && (
            <div className="px-5 pb-4 lg:px-0">
              {following && (
                <p className={`truncate pt-2 pb-1 text-center text-sm lg:hidden ${muted}`}>
                  Next: {formatExerciseName(following.ex.name)}
                </p>
              )}
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
              <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] gap-2 pt-1 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none lg:pt-2">
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  className={step}
                  aria-label="Previous exercise"
                  disabled={index === 0}
                >
                  <ChevronLeft size={24} className="lg:-ml-1 lg:size-5" />
                  <span className="hidden lg:inline">Previous</span>
                </button>
                <div className="flex gap-2 *:flex-1 lg:contents">
                  <button
                    type="button"
                    onClick={() => setNoteOpen((v) => !v)}
                    className={step}
                    aria-expanded={noteOpen}
                  >
                    <FileText size={16} />
                    {notes[itemKey(current.category, current.ex)] ? 'Note' : 'Add note'}
                  </button>
                  {current.ex.link && (
                    <a
                      href={current.ex.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={step}
                    >
                      <PlayCircle size={16} />
                      Video
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  className={step}
                  aria-label="Next exercise"
                >
                  <span className="hidden lg:inline">Next</span>
                  <ChevronRight size={24} className="lg:-mr-1 lg:size-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
