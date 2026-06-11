import { useEffect, useRef, useState } from 'react';
import { TimerReset, Square } from 'lucide-react';

const TIMER_LINKS = [
  { href: 'https://www.youtube.com/watch?v=_wi7j1_-O3Q', label: '10s video' },
  { href: 'https://www.youtube.com/watch?v=kD6FCbmAORY', label: '30s video' },
];

/**
 * Singing-bowl strike via WebAudio; ctx is created on first user gesture.
 * A struck bowl is a set of inharmonic partials that decay at different
 * rates; pairing each partial with a slightly detuned twin produces the
 * slow beating shimmer of the real thing.
 */
function bowl(ctx) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(ctx.destination);

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
    });
  });
}

/**
 * Repeating interval timer for isometric holds: pick 10s or 30s, it counts
 * down, beeps (and vibrates, where supported), bumps the rep count, and
 * restarts until stopped. Wall-clock based so background-tab throttling
 * doesn't drift it.
 */
export default function Footer({ darkMode }) {
  const [duration, setDuration] = useState(null); // null = idle
  const [run, setRun] = useState(0); // bumped on start so re-pressing the active duration restarts it
  const [remaining, setRemaining] = useState(0);
  const [reps, setReps] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (duration == null) return undefined;
    let endsAt = Date.now() + duration * 1000;
    const tick = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      if (left <= 0) {
        bowl(audioRef.current);
        navigator.vibrate?.(200);
        setReps((r) => r + 1);
        endsAt += duration * 1000;
        setRemaining(duration);
      } else {
        setRemaining(left);
      }
    }, 200);
    return () => clearInterval(tick);
  }, [duration, run]);

  const start = (secs) => {
    if (!audioRef.current && window.AudioContext) {
      audioRef.current = new AudioContext();
    }
    audioRef.current?.resume?.();
    setReps(0);
    setRemaining(secs);
    setDuration(secs);
    setRun((r) => r + 1);
  };

  const stop = () => setDuration(null);

  const idleButton = darkMode
    ? 'border-gray-700 text-gray-300 hover:border-blue-500 hover:text-blue-300'
    : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600';
  const activeButton = darkMode
    ? 'border-blue-500 text-blue-300 bg-blue-900/40'
    : 'border-blue-400 text-blue-700 bg-blue-50';

  return (
    <footer
      className={`w-full border-t mt-6 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
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

          {duration != null && (
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold tabular-nums ${
                  remaining <= 3 ? 'text-orange-400' : darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}
              >
                {remaining}s
              </span>
              <span className="text-sm whitespace-nowrap">rep {reps + 1}</span>
              <button
                onClick={stop}
                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  darkMode
                    ? 'border-red-800 text-red-300 hover:bg-red-900/40'
                    : 'border-red-300 text-red-600 hover:bg-red-50'
                }`}
              >
                <Square size={12} />
                Stop
              </button>
            </div>
          )}

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
  );
}
