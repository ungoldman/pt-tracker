import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TimerReset, Square } from 'lucide-react';

const TIMER_LINKS = [
  { href: 'https://www.youtube.com/watch?v=_wi7j1_-O3Q', label: '10s video' },
  { href: 'https://www.youtube.com/watch?v=kD6FCbmAORY', label: '30s video' },
];

// Get-into-position window before the first hold begins.
const PREP_SECONDS = 5;

/**
 * Load the bowl recordings into WebAudio buffers on first user gesture.
 * Both are real Tibetan singing bowl strikes from Wikimedia Commons
 * (CC BY-SA 4.0), trimmed/faded to decay fully inside their rep window:
 *   /bowl10.m4a — 4.5" bowl (brighter, ~9.7s) for the 10s interval
 *   /bowl30.m4a — 11" bowl (deeper, ~16.4s) for the 30s interval
 * Sources: https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_4.5inch.flac
 *          https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_11inch.flac
 */
async function ensureAudio(ref) {
  if (!ref.current) {
    const ctx = new AudioContext();
    ref.current = { ctx, buffers: {}, playing: new Set() };
    await Promise.all(
      [10, 30].map(async (secs) => {
        try {
          const res = await fetch(`/bowl${secs}.m4a`);
          const data = await res.arrayBuffer();
          ref.current.buffers[secs] = await ctx.decodeAudioData(data);
        } catch {
          // Recording unavailable; chime() falls back to the synthesized bowl.
        }
      })
    );
  }
  ref.current.ctx.resume?.();
  return ref.current;
}

/**
 * Play the recorded bowl strike for the given interval, or the synthesized
 * one if loading failed. Every strike is tracked in audio.playing so
 * silence() can fade it out.
 */
function chime(audio, secs) {
  if (!audio) return;
  const { ctx, buffers } = audio;
  const buffer = buffers[secs] || buffers[10] || buffers[30];
  let entry;
  if (buffer) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 1.0;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    entry = {
      stop: (t) => {
        try {
          src.stop(t);
        } catch {
          // already ended
        }
      },
      gain,
    };
    src.onended = () => audio.playing.delete(entry);
  } else {
    entry = bowl(ctx);
  }
  audio.playing.add(entry);
}

/** Fade out and stop any still-ringing strikes (Stop shouldn't leave a 16s tail). */
function silence(audio) {
  if (!audio) return;
  const { ctx } = audio;
  audio.playing.forEach(({ stop, gain }) => {
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    stop(ctx.currentTime + 0.3);
  });
  audio.playing.clear();
}

/**
 * Synthesized singing-bowl fallback: inharmonic partials decaying at
 * different rates, each paired with a slightly detuned twin for the
 * slow beating shimmer of the real thing.
 */
function bowl(ctx) {
  if (!ctx) return { stop: () => {}, gain: { gain: { setTargetAtTime: () => {} } } };
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(ctx.destination);
  const oscillators = [];

  const f0 = 196; // ~G3: warm, low, gong-like
  const partials = [
    { ratio: 1, gain: 1.0, decay: 5 },
    { ratio: 2.005, gain: 0.55, decay: 4 },
    { ratio: 3.42, gain: 0.3, decay: 2.8 },
    { ratio: 5.43, gain: 0.18, decay: 1.8 },
    { ratio: 8.21, gain: 0.08, decay: 1.1 },
  ];

  partials.forEach(({ ratio, gain, decay }) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain * 0.5, now + 0.025); // soft mallet attack
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    g.connect(master);
    [1, 1.003].forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f0 * ratio * detune;
      osc.connect(g);
      osc.start(now);
      osc.stop(now + decay + 0.1);
      oscillators.push(osc);
    });
  });

  return {
    stop: (t) =>
      oscillators.forEach((o) => {
        try {
          o.stop(t);
        } catch {
          // already ended
        }
      }),
    gain: master,
  };
}

/**
 * Repeating interval timer for isometric holds: pick 10s or 30s, it counts
 * down, beeps (and vibrates, where supported), bumps the rep count, and
 * restarts until stopped. Wall-clock based so background-tab throttling
 * doesn't drift it.
 */
export default function Footer({ darkMode }) {
  const [duration, setDuration] = useState(null); // the selected interval; null = idle
  const [phase, setPhase] = useState('idle'); // 'idle' | 'prep' | 'running'
  const [run, setRun] = useState(0); // bumped on start so re-pressing the active duration restarts it
  const [remaining, setRemaining] = useState(0);
  const [prepLeft, setPrepLeft] = useState(0);
  const [reps, setReps] = useState(0);
  const audioRef = useRef(null);

  // Prep countdown: a quiet window to get into position. When it elapses the
  // bowl strikes (marking the first hold) and we hand off to the running phase.
  useEffect(() => {
    if (phase !== 'prep') return undefined;
    const endsAt = Date.now() + PREP_SECONDS * 1000;
    const tick = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      if (left <= 0) {
        chime(audioRef.current, duration);
        navigator.vibrate?.(200);
        setPhase('running');
      } else {
        setPrepLeft(left);
      }
    }, 200);
    return () => clearInterval(tick);
  }, [phase, run, duration]);

  // Running phase: wall-clock based so background-tab throttling doesn't drift
  // it; chimes and bumps the rep at each interval until stopped.
  useEffect(() => {
    if (phase !== 'running') return undefined;
    let endsAt = Date.now() + duration * 1000;
    const tick = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      if (left <= 0) {
        chime(audioRef.current, duration);
        navigator.vibrate?.(200);
        setReps((r) => r + 1);
        endsAt += duration * 1000;
        setRemaining(duration);
      } else {
        setRemaining(left);
      }
    }, 200);
    return () => clearInterval(tick);
  }, [phase, duration, run]);

  const start = (secs) => {
    // Create/resume the AudioContext within the user gesture so the bowl can
    // sound when the prep countdown ends; the strike itself waits for that.
    if (window.AudioContext) ensureAudio(audioRef);
    setReps(0);
    setRemaining(secs);
    setPrepLeft(PREP_SECONDS);
    setDuration(secs);
    setPhase('prep');
    setRun((r) => r + 1);
  };

  const stop = () => {
    setPhase('idle');
    setDuration(null);
    silence(audioRef.current);
  };

  // Esc closes the takeover modal while it's up.
  useEffect(() => {
    if (phase === 'idle') return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') stop();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase]);

  const idleButton = darkMode
    ? 'border-gray-700 text-gray-300 hover:border-blue-500 hover:text-blue-300'
    : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600';
  const activeButton = darkMode
    ? 'border-blue-500 text-blue-300 bg-blue-900/40'
    : 'border-blue-400 text-blue-700 bg-blue-50';

  const inProgress = phase !== 'idle';
  const bigDigits = 'font-bold tabular-nums leading-none text-[34vw] sm:text-[22rem]';

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
            ) : (
              <>
                <span className="text-2xl font-medium">Hold — rep {reps + 1}</span>
                <span className={`${bigDigits} ${remaining <= 3 ? 'text-orange-400' : ''}`}>
                  {remaining}
                </span>
              </>
            )}

            <button
              onClick={stop}
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
  );
}
