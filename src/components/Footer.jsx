import { useEffect, useRef, useState } from 'react';
import { TimerReset, Square } from 'lucide-react';

/** Short beep via WebAudio; ctx is created on first user gesture. */
function beep(ctx) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
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
        beep(audioRef.current);
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
        </div>
      </div>
    </footer>
  );
}
