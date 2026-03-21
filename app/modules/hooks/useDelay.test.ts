// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDelay } from './useDelay'

describe('useDelay', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true after the delay elapses', () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useDelay({ delayMs: 1000 }))

    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current).toBe(true)
  })

  it('resets to false when disabled', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ delayMs, enabled }) => useDelay({ delayMs, enabled }),
      {
        initialProps: {
          delayMs: 1000,
          enabled: true
        }
      }
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBe(true)

    act(() => {
      rerender({
        delayMs: 1000,
        enabled: false
      })
    })

    expect(result.current).toBe(false)
  })
})
