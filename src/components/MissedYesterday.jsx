import { X } from 'lucide-react'
import { useState } from 'react'
import { useTracker } from '../context/TrackerContext'
import { exercises } from '../data'
import { DAYS, groupLabel, unfinishedGroups } from '../lib/schedule'

/**
 * Offers yesterday's unfinished movable blocks at the top of today, one tap
 * each. Dismissing lasts until reload. Skipping a block on its own day is the
 * durable way to stop the offer. Sunday has no yesterday: weeks have no
 * identity, so last Saturday is not reachable.
 */
export default function MissedYesterday({ day }) {
  const { darkMode, completed, schedule, moveBlock } = useTracker()
  const [dismissed, setDismissed] = useState(false)

  const yesterday = DAYS[DAYS.indexOf(day) - 1]
  if (!yesterday || dismissed) return null
  const groups = unfinishedGroups(exercises, schedule[yesterday].blocks, completed)
  if (groups.length === 0) return null

  return (
    <div
      className={`mb-3 pl-3 pr-1 py-1 rounded-xl flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${
        darkMode
          ? 'bg-gray-800 text-gray-400 shadow-md shadow-black/30'
          : 'bg-white text-gray-500 border border-gray-200 shadow-sm'
      }`}
    >
      <span>Pull in from {yesterday}</span>
      {groups.map((group) => {
        const text = groupLabel(exercises, group, yesterday)
        return (
          <button
            type="button"
            key={group[0].sourceDay + group[0].category}
            onClick={() => {
              for (const { sourceDay, category } of group) moveBlock(sourceDay, category, day)
            }}
            aria-label={`Pull ${text} from ${yesterday} in to today`}
            className={`relative hit-44 px-2 py-1.5 rounded-lg border font-medium transition-colors ${
              darkMode
                ? 'border-gray-600 text-gray-200 hover:border-blue-500 hover:text-blue-300'
                : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {text}
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className={`relative hit-44 ml-auto p-2 rounded-lg transition-colors ${
          darkMode ? 'hover:text-gray-200' : 'hover:text-gray-700'
        }`}
      >
        <X size={14} />
      </button>
    </div>
  )
}
