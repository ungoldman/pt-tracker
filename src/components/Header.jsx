import { CalendarDays, Hand, Moon, RotateCcw, Sun } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useDismiss } from '../hooks/useDismiss'

export const TABS = [
  ['today', 'Today', Sun],
  ['hand', 'Hand', Hand],
  ['week', 'Week', CalendarDays]
]

/**
 * Top bar: the screen's title, the week's session count, theme, and resets.
 * The tabs sit in a bar at the foot of the screen on phones, where a thumb
 * reaches them, and inline in this bar from lg up. A run on a phone has the
 * whole screen, so this bar stands aside for it.
 */
export default function Header({
  darkMode,
  toggleDarkMode,
  title,
  week,
  tab,
  onTab,
  showTabs,
  resetDay,
  resetWeek
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useDismiss(menuRef, menuOpen, closeMenu)

  const muted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const ghost = `relative hit-44 flex items-center rounded-lg p-2 ${
    darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'
  }`
  const item = `w-full px-3 py-2 text-left text-sm ${
    darkMode ? 'text-red-400 hover:bg-red-900/40' : 'text-red-600 hover:bg-red-50'
  }`
  const done = Math.round(week.done * 10) / 10

  return (
    <header
      className={`sticky top-0 z-40 border-b ${showTabs ? '' : 'hidden lg:block'} ${
        darkMode ? 'border-gray-800 bg-gray-900/95' : 'border-gray-200 bg-gray-50/95'
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3 lg:max-w-5xl lg:px-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {showTabs && (
          <nav
            aria-label="Screens"
            className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:static lg:ml-6 lg:flex lg:gap-1 lg:border-0 lg:p-0 ${
              darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
            } lg:bg-transparent`}
          >
            {TABS.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => onTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 text-[11px] lg:flex-row lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-sm ${
                  tab === id
                    ? `font-medium lg:bg-blue-500/10 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                    : muted
                }`}
              >
                <span
                  className={`rounded-full px-4 py-0.5 lg:hidden ${tab === id ? 'bg-blue-500/15' : ''}`}
                >
                  <Icon size={20} />
                </span>
                {label}
              </button>
            ))}
          </nav>
        )}
        <span className={`ml-auto text-sm tabular-nums whitespace-nowrap ${muted}`}>
          <span className={done >= week.target ? 'text-green-500' : ''}>
            {done} of {week.target}
          </span>{' '}
          this week
        </span>
        <button
          type="button"
          onClick={toggleDarkMode}
          className={ghost}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={ghost}
            aria-label="Reset checkboxes"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <RotateCcw size={16} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className={`absolute right-0 top-full z-50 mt-1 min-w-40 overflow-hidden rounded-lg border shadow-lg ${
                darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  resetDay()
                }}
                className={item}
              >
                Reset today
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  resetWeek()
                }}
                className={item}
              >
                Reset week
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
