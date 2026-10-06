import { X } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { acceptUpdate, isUpdateReady, subscribeUpdate } from '../lib/updates'

/**
 * Quiet notice that a newer build has been downloaded and is waiting. Update
 * switches to it (one reload, at a moment the user picks). Dismissing leaves
 * it for the next time the app is opened from closed.
 */
export default function UpdateNotice({ darkMode }) {
  const ready = useSyncExternalStore(subscribeUpdate, isUpdateReady)
  const [dismissed, setDismissed] = useState(false)
  if (!ready || dismissed) return null

  return (
    <div className="fixed inset-x-0 bottom-3 sm:bottom-20 z-40 flex justify-center px-3 pointer-events-none">
      <div
        role="status"
        className={`pointer-events-auto flex items-center gap-1 pl-3 pr-1 py-1 rounded-xl text-xs ${
          darkMode
            ? 'bg-gray-800 text-gray-300 border border-gray-700 shadow-xl shadow-black/50'
            : 'bg-white text-gray-600 border border-gray-200 shadow-lg'
        }`}
      >
        <span>New version ready</span>
        <button
          type="button"
          onClick={acceptUpdate}
          className={`relative hit-44 ml-2 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
            darkMode
              ? 'bg-blue-700 text-white hover:bg-blue-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Update
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Later"
          className={`relative hit-44 p-2 rounded-lg transition-colors ${
            darkMode ? 'hover:text-gray-100' : 'hover:text-gray-900'
          }`}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
