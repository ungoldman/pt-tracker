import { useCallback, useEffect, useRef, useState } from 'react'
import Footer from './components/Footer'
import HandTab from './components/HandTab'
import Header from './components/Header'
import Player from './components/Player'
import TodayTab from './components/TodayTab'
import UpdateNotice from './components/UpdateNotice'
import WeekTab from './components/WeekTab'
import { TrackerContext } from './context/TrackerContext'
import { daily, exercises, limits, sessions } from './data'
import { usePersistentState } from './hooks/usePersistentState'
import { estimateMinutes } from './lib/duration'
import {
  dailyParts,
  dailyPasses,
  dateKey,
  dayLoad,
  doneCount,
  entryCredit,
  itemKey,
  parseKey,
  passes,
  prune,
  rankSessions,
  sessionItems,
  upNext,
  weekCount,
  weekCredit,
  weekOf,
  weekStrip,
  weekTotals
} from './lib/plan'

// First-run default (localStorage wins once the user has a saved value):
// follow the OS theme.
const PREFERS_DARK = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

const SESSION_BY_ID = Object.fromEntries(sessions.map((s) => [s.id, s]))
const NAMES = Object.fromEntries(sessions.map((s) => [s.id, s.name]))
const PARTS = dailyParts(exercises, daily)
const PASS_MINUTES = estimateMinutes(PARTS.pass.map(({ ex }) => ex))

const byBlock = (items) =>
  Object.values(
    items.reduce((groups, { category, ex }) => {
      groups[category] ??= { category, label: exercises[category].displayName, list: [] }
      groups[category].list.push(ex)
      return groups
    }, {})
  )
const GOALS = byBlock(PARTS.goals)
const AMBIENT = byBlock(PARTS.ambient)

const round = (n) => Math.round(n * 10) / 10
const weekday = (key) => parseKey(key).toLocaleDateString('en-US', { weekday: 'long' })

// Notes used to be kept per weekday. They are about the exercise, so the
// first run of this version folds them into one note each, latest day winning.
function migrateNotes() {
  try {
    const old = JSON.parse(localStorage.getItem('ptTrackerNotes')) ?? {}
    return Object.fromEntries(
      Object.entries(old)
        .filter(([, text]) => text)
        .map(([key, text]) => [key.slice(key.indexOf('-') + 1), text])
    )
  } catch {
    return {}
  }
}

const sizes = (session, size) => {
  const items = sessionItems(exercises, session, size)
  return { count: items.length, minutes: estimateMinutes(items.map(({ ex }) => ex)) }
}

// A session's items, each labelled by its part: warm-up, the work, warm-down.
const labelled = (session, size) =>
  sessionItems(exercises, session, size).map((item) => ({
    ...item,
    label:
      item.category === session.warmup
        ? 'Warm-up'
        : session.blocks.includes(item.category)
          ? undefined
          : 'Warm-down'
  }))

const App = () => {
  const [darkMode, setDarkMode] = usePersistentState('ptTrackerDarkMode', PREFERS_DARK)
  const [history, setHistory] = usePersistentState('ptTrackerHistory', {})
  const [notes, setNotes] = usePersistentState('ptTrackerExerciseNotes', migrateNotes)
  // The screen, the day the week screen shows (null for today), and the run
  // open in the player. Momentary, so all stay in memory.
  const [tab, setTab] = useState('today')
  const [shownDay, setShownDay] = useState(null)
  const [player, setPlayer] = useState(null)
  const [confettiKey, setConfettiKey] = useState(null)
  const [justCompleted, setJustCompleted] = useState(new Set())
  const [expandedNotes, setExpandedNotes] = useState(new Set())

  const now = new Date()
  const today = dateKey(now)
  // Checks land on the day of the open run, else today.
  const activeDate = player?.date ?? today
  const day = history[activeDate] ?? {}

  // Keep storage small. Recency only needs the last few weeks.
  useEffect(() => {
    setHistory((prev) => {
      const next = prune(prev, today)
      return Object.keys(next).length === Object.keys(prev).length ? prev : next
    })
  }, [today, setHistory])

  const updateDay = useCallback(
    (date, fn) => setHistory((prev) => ({ ...prev, [date]: fn(prev[date] ?? {}) })),
    [setHistory]
  )

  // `daily` holds a check, `pass:N` the Nth pass of a per-day item, and any
  // other scope is a session's id.
  const isDone = useCallback(
    (scope, key) => {
      if (scope === 'daily') return passes(day.daily?.[key]) >= 1
      if (scope.startsWith('pass:')) return passes(day.daily?.[key]) >= Number(scope.slice(5))
      return !!day.sessions?.[scope]?.done?.[key]
    },
    [day]
  )

  const toggleComplete = useCallback(
    (scope, category, id) => {
      const key = `${category}-${id}`
      const wasDone = isDone(scope, key)
      updateDay(activeDate, (d) => {
        if (scope === 'daily') return { ...d, daily: { ...d.daily, [key]: !wasDone } }
        if (scope.startsWith('pass:')) {
          const n = Number(scope.slice(5))
          return { ...d, daily: { ...d.daily, [key]: wasDone ? n - 1 : n } }
        }
        const entry = d.sessions[scope]
        const done = { ...entry.done, [key]: !wasDone }
        // Checking the last one off finishes the session.
        const finished = entry.finished || doneCount({ done }) === entry.total
        return { ...d, sessions: { ...d.sessions, [scope]: { ...entry, done, finished } } }
      })
      if (!wasDone) {
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
    [activeDate, isDone, updateDay]
  )

  const clearConfetti = useCallback(() => setConfettiKey(null), [])

  // The hold timer lives in Footer so its ticking never re-renders the list.
  // Cards start it through this handle. When a counted run finishes it checks
  // the exercise off, reading the latest state since the run outlives a render.
  const timerRef = useRef(null)
  const latest = useRef({})
  useEffect(() => {
    latest.current = { isDone, toggleComplete }
  })
  const startHold = useCallback((scope, category, id, plan, label) => {
    timerRef.current?.start(plan.seconds, {
      count: plan.count,
      label,
      onDone: () => {
        const { isDone: done, toggleComplete: toggle } = latest.current
        if (!done(scope, `${category}-${id}`)) toggle(scope, category, id)
      }
    })
  }, [])

  const handOn = (key) => ({
    ...dailyPasses(exercises, daily, history[key]),
    size: PARTS.pass.length
  })

  const startSession = (date) => (id, size) => {
    const total = sessionItems(exercises, SESSION_BY_ID[id], size).length
    updateDay(date, (d) => ({
      ...d,
      sessions: { ...d.sessions, [id]: { size, total, done: {}, finished: false } }
    }))
    setPlayer({ kind: 'session', id, date })
  }

  // Leaving a session with nothing checked takes it back. Finishing marks it
  // finished, credited for what was done. Closing leaves it open to resume.
  const closePlayer = (finish) => {
    if (player.kind === 'session') {
      const { id, date } = player
      updateDay(date, (d) => {
        const entry = d.sessions[id]
        if (!entry.finished && !doneCount(entry)) {
          const { [id]: _, ...rest } = d.sessions
          return { ...d, sessions: rest }
        }
        return finish
          ? { ...d, sessions: { ...d.sessions, [id]: { ...entry, finished: true } } }
          : d
      })
    }
    setPlayer(null)
  }

  const handleNoteChange = useCallback(
    (category, id, value) => setNotes((prev) => ({ ...prev, [`${category}-${id}`]: value })),
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

  const weekCountOf = useCallback(
    (key) => weekCount(history, activeDate, key),
    [history, activeDate]
  )

  const resetDay = () => {
    if (window.confirm('Reset everything checked today?')) {
      setHistory(({ [today]: _, ...rest }) => rest)
      setPlayer(null)
    }
  }

  const resetWeek = () => {
    if (window.confirm('Reset everything checked this week?')) {
      const week = new Set(weekOf(today))
      setHistory((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !week.has(k))))
      setPlayer(null)
    }
  }

  // A session dropped from the program since it was logged has nothing to show.
  const loggedOn = (key) =>
    Object.entries(history[key]?.sessions ?? {})
      .filter(([id]) => SESSION_BY_ID[id])
      .map(([id, entry]) => ({ session: SESSION_BY_ID[id], entry, count: doneCount(entry) }))
      // What is still open leads.
      .sort((a, b) => Number(a.entry.finished) - Number(b.entry.finished))

  const tracker = {
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
  }

  let screen
  if (player) {
    const hand = handOn(player.date)
    const run = {
      session: () => {
        const session = SESSION_BY_ID[player.id]
        const entry = history[player.date].sessions[player.id]
        const credit = round(weekCredit(history, player.date, player.id))
        return {
          title: player.date === today ? session.name : `${session.name}, ${weekday(player.date)}`,
          scope: player.id,
          items: labelled(session, entry.size),
          summary: (
            <>
              <p>
                Counts {round(entryCredit(entry))} toward {session.name}, now {credit} of{' '}
                {session.perWeek} this week.
              </p>
              {session.strength && <p className="mt-1">Shoulder weights rest the next day.</p>}
            </>
          )
        }
      },
      pass: () => ({
        title: `Hand pass ${player.pass}`,
        scope: `pass:${player.pass}`,
        items: PARTS.pass,
        summary: (
          <p>
            Pass {player.pass} of {hand.perDay} today.
          </p>
        )
      }),
      once: () => ({
        title: 'Putty and band work',
        scope: 'daily',
        items: PARTS.once,
        summary: <p>The once-a-day hand work.</p>
      })
    }[player.kind]()
    screen = (
      <Player
        key={`${player.kind}-${player.id ?? player.pass ?? ''}-${player.date}`}
        {...run}
        onDone={() => closePlayer(true)}
        onClose={() => closePlayer(false)}
      />
    )
  } else if (tab === 'today') {
    const ranked = rankSessions(sessions, history, today, limits)
    const plenty = dayLoad(sessions, history, today).sessions >= limits.sessionsPerDay
    const hand = handOn(today)
    const onceLeft = PARTS.once.filter(
      ({ category, ex }) => !history[today]?.daily?.[itemKey(category, ex)]
    ).length
    const next = upNext({ ranked, plenty, hand, onceLeft, hour: now.getHours() })
    const detail = {
      resume: () => {
        const entry = history[today].sessions[next.id]
        return `${doneCount(entry)} of ${entry.total} done`
      },
      pass: () => `${PARTS.pass.length} exercises, about ${PASS_MINUTES} min`,
      session: () => {
        const { count, minutes } = sizes(SESSION_BY_ID[next.id], 'full')
        return `${count} exercises, about ${minutes} min`
      },
      once: () => `${PARTS.once.length} exercises, once a day`,
      rest: () => 'Rest is part of the program.'
    }[next.kind]()
    screen = (
      <TodayTab
        next={next}
        names={NAMES}
        nextDetail={detail}
        // Up next already shows the session to resume.
        logged={loggedOn(today).filter(({ session }) => session.id !== next.id)}
        hand={hand}
        goals={GOALS}
        ranked={ranked}
        sizes={sizes}
        actions={{
          open: (id) => setPlayer({ kind: 'session', id, date: today }),
          start: startSession(today),
          pass: () => setPlayer({ kind: 'pass', pass: hand.done + 1, date: today }),
          once: () => setPlayer({ kind: 'once', date: today }),
          handTab: () => setTab('hand')
        }}
      />
    )
  } else if (tab === 'hand') {
    const hand = handOn(today)
    const onceDone = PARTS.once.filter(
      ({ category, ex }) => history[today]?.daily?.[itemKey(category, ex)]
    ).length
    screen = (
      <HandTab
        hand={hand}
        passMinutes={PASS_MINUTES}
        once={{ count: PARTS.once.length, done: onceDone }}
        ambient={AMBIENT}
        onPass={() => setPlayer({ kind: 'pass', pass: hand.done + 1, date: today })}
        onOnce={() => setPlayer({ kind: 'once', date: today })}
      />
    )
  } else {
    const shown = shownDay ?? today
    const left = sessions
      .map((s) => ({
        name: s.name,
        remaining: round(s.perWeek - Math.min(s.perWeek, weekCredit(history, today, s.id)))
      }))
      .filter(({ remaining }) => remaining > 0)
      // A part-done session still takes a whole sitting to finish.
      .map(({ name, remaining }) => ({ name, remaining: `${Math.ceil(remaining)} more` }))
    screen = (
      <WeekTab
        strip={weekStrip(sessions, history, today)}
        today={today}
        shown={shown}
        dayName={shownDay && weekday(shownDay)}
        logged={loggedOn(shown)}
        hand={handOn(shown)}
        ranked={rankSessions(sessions, history, shown, limits)}
        sizes={sizes}
        left={left}
        actions={{
          select: (key) => setShownDay(key === today ? null : key),
          open: (id) => setPlayer({ kind: 'session', id, date: shown }),
          start: startSession(shown)
        }}
      />
    )
  }

  const titles = { today: weekday(today), hand: 'Hand', week: 'Week' }

  return (
    <TrackerContext.Provider value={tracker}>
      <div
        className={`flex min-h-screen flex-col ${
          darkMode ? 'app-bg-dark text-gray-100' : 'app-bg-light text-gray-900'
        }`}
      >
        <Header
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
          title={titles[tab]}
          week={weekTotals(sessions, history, today)}
          tab={tab}
          onTab={(id) => {
            setTab(id)
            setShownDay(null)
          }}
          showTabs={!player}
          resetDay={resetDay}
          resetWeek={resetWeek}
        />
        <main
          className={`mx-auto flex w-full max-w-xl flex-1 flex-col lg:max-w-5xl ${player ? '' : 'px-4 pt-4 pb-28 lg:px-6 lg:pt-6 lg:pb-10'}`}
        >
          {screen}
        </main>
        <UpdateNotice darkMode={darkMode} />
        <Footer darkMode={darkMode} ref={timerRef} />
      </div>
    </TrackerContext.Provider>
  )
}

export default App
