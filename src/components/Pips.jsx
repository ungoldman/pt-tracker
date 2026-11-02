import { useTracker } from '../context/TrackerContext'

/** `done` of `of` at a glance. A part-done one fills by its share. */
export default function Pips({ done, of }) {
  const { darkMode } = useTracker()
  return (
    <span className="flex shrink-0 gap-1" aria-hidden="true">
      {Array.from({ length: of }, (_, n) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: pips are positional and never reorder.
          key={n}
          className={`block h-1.5 w-4 overflow-hidden rounded-full ${
            darkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        >
          <span
            className="block h-full bg-blue-500"
            style={{ width: `${Math.max(0, Math.min(1, done - n)) * 100}%` }}
          />
        </span>
      ))}
    </span>
  )
}
