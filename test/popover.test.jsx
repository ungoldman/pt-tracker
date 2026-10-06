import { act, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import Popover from '../src/components/Popover'

function Anchored({ open = true, rect, darkMode = false }) {
  const ref = useRef(null)
  return (
    <>
      <button
        type="button"
        ref={(el) => {
          ref.current = el
          if (el) el.getBoundingClientRect = () => rect.current
        }}
      >
        anchor
      </button>
      <Popover anchorRef={ref} open={open} onClose={vi.fn()} darkMode={darkMode} label="Panel">
        body
      </Popover>
    </>
  )
}

const place = () => {
  const { left, top, bottom, width, maxHeight } = screen.getByRole('dialog').style
  return { left, top, bottom, width, maxHeight }
}
const viewport = (width, height) => {
  window.innerWidth = width
  window.innerHeight = height
}

describe('Popover', () => {
  it('renders nothing while closed', () => {
    render(<Anchored open={false} rect={{ current: {} }} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it.each([false, true])('drops below the anchor, right edges aligned (dark: %s)', (darkMode) => {
    viewport(1000, 800)
    render(
      <Anchored darkMode={darkMode} rect={{ current: { right: 900, top: 100, bottom: 120 } }} />
    )
    expect(place()).toEqual({
      left: '548px',
      top: '126px',
      bottom: '',
      width: '352px',
      maxHeight: '666px'
    })
  })

  it('stays inside the left edge and narrows on a small screen', () => {
    viewport(300, 800)
    render(<Anchored rect={{ current: { right: 100, top: 100, bottom: 120 } }} />)
    expect(place().left).toBe('8px')
    expect(place().width).toBe('284px')
  })

  it('stays inside the right edge', () => {
    viewport(1000, 800)
    render(<Anchored rect={{ current: { right: 1200, top: 100, bottom: 120 } }} />)
    expect(place().left).toBe('640px')
  })

  it('flips above when there is no room below', () => {
    viewport(1000, 800)
    render(<Anchored rect={{ current: { right: 900, top: 700, bottom: 720 } }} />)
    expect(place()).toMatchObject({ top: '', bottom: '106px', maxHeight: '686px' })
  })

  it('stays below when above is even tighter', () => {
    viewport(1000, 300)
    render(<Anchored rect={{ current: { right: 900, top: 100, bottom: 120 } }} />)
    expect(place()).toMatchObject({ top: '126px', maxHeight: '166px' })
  })

  it('follows the anchor on scroll and resize, and lets go when closed', () => {
    viewport(1000, 800)
    const rect = { current: { right: 900, top: 100, bottom: 120 } }
    const { rerender } = render(<Anchored rect={rect} />)

    rect.current = { right: 900, top: 200, bottom: 220 }
    act(() => {
      document.dispatchEvent(new Event('scroll'))
    })
    expect(place().top).toBe('226px')

    rect.current = { right: 900, top: 300, bottom: 320 }
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(place().top).toBe('326px')

    rerender(<Anchored open={false} rect={rect} />)
    expect(() => window.dispatchEvent(new Event('resize'))).not.toThrow()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
