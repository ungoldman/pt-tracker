import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDismiss } from '../hooks/useDismiss'

const WIDTH = 352
const GUTTER = 8
const GAP = 6

/**
 * A panel floated next to `anchorRef`, over the page rather than in its flow.
 * Portaled to the body and fixed-positioned so the scrolling day columns can't
 * clip it, kept inside the viewport, and flipped above the anchor when there
 * is no room below. Closes on Escape or a press outside it and the anchor.
 */
export default function Popover({ anchorRef, open, onClose, darkMode, label, children }) {
  const popRef = useRef(null)
  const [place, setPlace] = useState(null)
  useDismiss([anchorRef, popRef], open, onClose)

  useLayoutEffect(() => {
    if (!open) return undefined
    const update = () => {
      const anchor = anchorRef.current.getBoundingClientRect()
      const width = Math.min(WIDTH, window.innerWidth - GUTTER * 2)
      const left = Math.min(
        Math.max(anchor.right - width, GUTTER),
        window.innerWidth - width - GUTTER
      )
      const below = window.innerHeight - anchor.bottom - GAP - GUTTER
      const above = anchor.top - GAP - GUTTER
      setPlace(
        below < 220 && above > below
          ? { left, width, bottom: window.innerHeight - anchor.top + GAP, maxHeight: above }
          : { left, width, top: anchor.bottom + GAP, maxHeight: below }
      )
    }
    update()
    // Capture, so scrolling any ancestor (page or a day column) keeps it attached.
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, anchorRef])

  if (!open || !place) return null
  return createPortal(
    <div
      ref={popRef}
      role="dialog"
      aria-label={label}
      style={place}
      className={`fixed z-60 overflow-auto rounded-xl p-2 text-[11px] font-normal ${
        darkMode
          ? 'bg-gray-800 border border-gray-700 shadow-xl shadow-black/50'
          : 'bg-white border border-gray-200 shadow-lg'
      }`}
    >
      {children}
    </div>,
    document.body
  )
}
