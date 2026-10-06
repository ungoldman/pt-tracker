import { ArrowRight, Undo2 } from 'lucide-react'
import { useTracker } from '../context/TrackerContext'
import { exercises } from '../data'
import { getBlockStyle } from '../lib/blockStyle'
import { SKIP } from '../lib/schedule'

/**
 * Placeholder left on a day for a block that was moved or skipped, so the gap
 * is explained and one click puts the block back.
 */
export default function AwayBlock({ category, sourceDay, to }) {
  const { darkMode, moveBlock } = useTracker()
  const BlockIcon = getBlockStyle(category).Icon
  const name = exercises[category]?.displayName || category
  const skipped = to === SKIP

  return (
    <button
      type="button"
      onClick={() => moveBlock(sourceDay, category, null)}
      aria-label={`${name} ${skipped ? 'skipped' : `moved to ${to}`}, put it back`}
      className={`w-full flex items-center gap-2 px-2 py-1 rounded border border-dashed text-xs uppercase tracking-wide transition-colors ${
        darkMode
          ? 'border-gray-700 bg-gray-800/70 text-gray-500 hover:text-gray-300'
          : 'border-gray-300 bg-white/70 text-gray-400 hover:text-gray-600'
      }`}
    >
      <BlockIcon size={14} className="shrink-0" />
      <span className="truncate">{name}</span>
      <span className="flex items-center gap-1 normal-case tracking-normal whitespace-nowrap">
        {skipped ? (
          'skipped'
        ) : (
          <>
            <ArrowRight size={12} />
            {to.slice(0, 3)}
          </>
        )}
      </span>
      <Undo2 size={13} className="ml-auto shrink-0" />
    </button>
  )
}
