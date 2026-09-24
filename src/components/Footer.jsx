import { Square, TimerReset } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { chime, ensureAudio, knock, silence } from '../lib/audio'

const TIMER_LINKS = [
  { href: 'https://www.youtube.com/watch?v=_wi7j1_-O3Q', label: '10s video' },
  { href: 'https://www.youtube.com/watch?v=kD6FCbmAORY', label: '30s video' }
]

// Get-into-position window before the first hold begins.
const PREP_SECONDS = 5

// Rest between holds.
const BREAK_SECONDS = 10

/**
 * Repeating interval timer for isometric holds: pick 10s or 30s, it counts
 * down, chimes (and vibrates, where supported), then rests BREAK_SECONDS
 * before the next rep, looping until stopped. The bowl marks the start of each
 * hold; three soft temple-block taps mark the end of the hold / start of rest.
 * Wall-clock based so background-tab throttling doesn't drift it.
 */
export default function Footer({ darkMode }) {
  const [duration, setDuration] = useState(null) // the selected interval; null = idle
  const [phase, setPhase] = useState('idle') // 'idle' | 'prep' | 'hold' | 'break'
  const [run, setRun] = useState(0) // bumped on start so re-pressing the active duration restarts it
  const [remaining, setRemaining] = useState(0)
  const [prepLeft, setPrepLeft] = useState(0)
  const [breakLeft, setBreakLeft] = useState(0)
  const [reps, setReps] = useState(0)
  const audioRef = useRef(null)

  // Prep countdown: a quiet window to get into position. When it elapses the
  // bowl strikes (marking the first hold) and we hand off to the hold phase.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run is an intentional restart trigger (re-pressing the active duration bumps it); it isn't read in the body.
  useEffect(() => {
    if (phase !== 'prep') return undefined
    const endsAt = Date.now() + PREP_SECONDS * 1000
    const tick = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000)
      if (left <= 0) {
        chime(audioRef.current, duration)
        navigator.vibrate?.(200)
        setPhase('hold')
      } else {
        setPrepLeft(left)
      }
    }, 200)
    return () => clearInterval(tick)
  }, [phase, run, duration])

  // Hold phase: count down the interval, then knock (end of rep), bank the rep,
  // and hand off to the rest. Wall-clock based against this phase's start.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run is an intentional restart trigger (re-pressing the active duration bumps it); it isn't read in the body.
  useEffect(() => {
    if (phase !== 'hold') return undefined
    const endsAt = Date.now() + duration * 1000
    const tick = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000)
      if (left <= 0) {
        knock(audioRef.current)
        navigator.vibrate?.(200)
        setReps((r) => r + 1)
        setBreakLeft(BREAK_SECONDS)
        setPhase('break')
      } else {
        setRemaining(left)
      }
    }, 200)
    return () => clearInterval(tick)
  }, [phase, duration, run])

  // Rest phase: count down BREAK_SECONDS, then the bowl strikes to resume the
  // next hold.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run is an intentional restart trigger (re-pressing the active duration bumps it); it isn't read in the body.
  useEffect(() => {
    if (phase !== 'break') return undefined
    const endsAt = Date.now() + BREAK_SECONDS * 1000
    const tick = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000)
      if (left <= 0) {
        chime(audioRef.current, duration)
        navigator.vibrate?.(200)
        setRemaining(duration)
        setPhase('hold')
      } else {
        setBreakLeft(left)
      }
    }, 200)
    return () => clearInterval(tick)
  }, [phase, duration, run])

  const start = (secs) => {
    // Create/resume the AudioContext within the user gesture so the bowl can
    // sound when the prep countdown ends. ensureAudio sets audioRef.current
    // synchronously (only the bowl fetch is async), so the knock can sound
    // right now to mark the start of the prep countdown.
    if (window.AudioContext) {
      ensureAudio(audioRef)
      knock(audioRef.current)
    }
    setReps(0)
    setRemaining(secs)
    setPrepLeft(PREP_SECONDS)
    setBreakLeft(BREAK_SECONDS)
    setDuration(secs)
    setPhase('prep')
    setRun((r) => r + 1)
  }

  const stop = useCallback(() => {
    setPhase('idle')
    setDuration(null)
    silence(audioRef.current)
  }, [])

  // Esc closes the takeover modal while it's up.
  useEffect(() => {
    if (phase === 'idle') return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') stop()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, stop])

  const idleButton = darkMode
    ? 'border-gray-700 text-gray-300 hover:border-blue-500 hover:text-blue-300'
    : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
  const activeButton = darkMode
    ? 'border-blue-500 text-blue-300 bg-blue-900/40'
    : 'border-blue-400 text-blue-700 bg-blue-50'

  const inProgress = phase !== 'idle'
  const bigDigits = 'font-bold tabular-nums leading-none text-[34vw] sm:text-[22rem]'

  return (
    <>
      {inProgress &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Hold timer"
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 px-6 backdrop-blur-sm ${
              darkMode ? 'bg-gray-950/95 text-gray-100' : 'bg-white/95 text-gray-900'
            }`}
          >
            <span
              className={`text-sm uppercase tracking-[0.25em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              {duration}-second holds
            </span>

            {phase === 'prep' ? (
              <>
                <span
                  className={`text-2xl font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Get ready…
                </span>
                <span className={bigDigits}>{prepLeft}</span>
              </>
            ) : phase === 'break' ? (
              <>
                <span
                  className={`text-2xl font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Rest — next up rep {reps + 1}
                </span>
                <span className={`${bigDigits} text-emerald-400`}>{breakLeft}</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-medium">Hold — rep {reps + 1}</span>
                <span className={`${bigDigits} ${remaining <= 3 ? 'text-orange-400' : ''}`}>
                  {remaining}
                </span>
              </>
            )}

            <button
              type="button"
              onClick={stop}
              // biome-ignore lint/a11y/noAutofocus: focuses the stop control when the takeover opens so keyboard and screen-reader users land on it.
              autoFocus
              className={`mt-2 flex items-center gap-2 text-lg font-semibold px-6 py-3 rounded-xl border-2 transition-colors ${
                darkMode
                  ? 'border-red-700 text-red-300 hover:bg-red-900/40'
                  : 'border-red-300 text-red-600 hover:bg-red-50'
              }`}
            >
              <Square size={18} />
              {phase === 'prep' ? 'Cancel' : 'Stop'}
            </button>
          </div>,
          document.body
        )}

      <footer
        className={`w-full border-t sticky bottom-0 z-40 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
      >
        <div className="px-3 sm:px-6 py-3">
          <div
            className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            <h3 className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
              <TimerReset size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
              Hold timer
            </h3>

            <div className="flex items-center gap-2">
              {[10, 30].map((secs) => (
                <button
                  type="button"
                  key={secs}
                  onClick={() => start(secs)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    duration === secs ? activeButton : idleButton
                  }`}
                  title={`Repeating ${secs}-second timer`}
                >
                  {secs}s
                </button>
              ))}
            </div>

            {/* The original interval videos, kept as a fallback */}
            <div className="ml-auto flex items-center gap-4">
              {TIMER_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs transition-colors hover:underline ${
                    darkMode
                      ? 'text-gray-500 hover:text-gray-300'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
