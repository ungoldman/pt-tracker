import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useDismiss } from '../src/hooks/useDismiss'
import { usePersistentState } from '../src/hooks/usePersistentState'

describe('usePersistentState', () => {
  it('starts from the default and writes every change', () => {
    const { result } = renderHook(() => usePersistentState('k', { n: 1 }))
    expect(result.current[0]).toEqual({ n: 1 })
    expect(JSON.parse(localStorage.getItem('k'))).toEqual({ n: 1 })

    act(() => result.current[1]({ n: 2 }))
    expect(result.current[0]).toEqual({ n: 2 })
    expect(JSON.parse(localStorage.getItem('k'))).toEqual({ n: 2 })
  })

  it('prefers a saved value, including a saved false', () => {
    localStorage.setItem('k', 'false')
    expect(renderHook(() => usePersistentState('k', true)).result.current[0]).toBe(false)
  })

  it('falls back to the default when the saved value is unreadable', () => {
    localStorage.setItem('k', '{not json')
    expect(renderHook(() => usePersistentState('k', 'fallback')).result.current[0]).toBe('fallback')
  })

  it('keeps working when storage refuses the write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const { result } = renderHook(() => usePersistentState('k', 1))
    act(() => result.current[1](2))
    expect(result.current[0]).toBe(2)
  })

  it('uses the default where there is no window', () => {
    // Read during the initial state callback, as it would be on a server.
    const real = globalThis.window
    let value
    function Probe() {
      vi.stubGlobal('window', undefined)
      const [read] = usePersistentState('k', 'server')
      vi.stubGlobal('window', real)
      value = read
      return null
    }
    localStorage.setItem('k', '"saved"')
    render(<Probe />)
    expect(value).toBe('server')
  })
})

describe('useDismiss', () => {
  function Panel({ open, onDismiss, twoRefs = false }) {
    const a = useRef(null)
    const b = useRef(null)
    useDismiss(twoRefs ? [a, b] : a, open, onDismiss)
    return (
      <>
        <div ref={a}>inside</div>
        <div ref={twoRefs ? b : null}>second</div>
        <div>outside</div>
      </>
    )
  }

  it('dismisses on Escape or a press outside, not inside', () => {
    const onDismiss = vi.fn()
    render(<Panel open onDismiss={onDismiss} />)

    fireEvent.pointerDown(screen.getByText('inside'))
    fireEvent.keyDown(document, { key: 'a' })
    expect(onDismiss).not.toHaveBeenCalled()

    fireEvent.pointerDown(screen.getByText('second'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledTimes(2)
  })

  it('treats every ref in a list as inside', () => {
    const onDismiss = vi.fn()
    render(<Panel open onDismiss={onDismiss} twoRefs />)
    fireEvent.pointerDown(screen.getByText('second'))
    expect(onDismiss).not.toHaveBeenCalled()
    fireEvent.pointerDown(screen.getByText('outside'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('listens only while open', () => {
    const onDismiss = vi.fn()
    const { rerender } = render(<Panel open={false} onDismiss={onDismiss} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onDismiss).not.toHaveBeenCalled()

    rerender(<Panel open onDismiss={onDismiss} />)
    rerender(<Panel open={false} onDismiss={onDismiss} />)
    fireEvent.pointerDown(screen.getByText('outside'))
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
