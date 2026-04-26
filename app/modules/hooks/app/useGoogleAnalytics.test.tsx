// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setAnalyticsEnabled } from '~/modules/slices/analyticsSlice'
import { createTestStore } from '~/test/createTestStore'
import { useGoogleAnalytics } from './useGoogleAnalytics'

const {
  mockInitializeGoogleAnalytics,
  mockTrackGoogleAnalytics
} = vi.hoisted(() => ({
  mockInitializeGoogleAnalytics: vi.fn(),
  mockTrackGoogleAnalytics: vi.fn()
}))

const mockLocation = vi.hoisted(() => ({
  current: {
    hash: '',
    pathname: '/routes',
    search: ''
  }
}))

vi.mock('react-router', async() => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')

  return {
    ...actual,
    useLocation: () => mockLocation.current
  }
})

vi.mock('~/modules/utils/shared/googleAnalytics', () => ({
  initializeGoogleAnalytics: mockInitializeGoogleAnalytics,
  trackGoogleAnalytics: mockTrackGoogleAnalytics
}))

describe('useGoogleAnalytics', () => {
  beforeEach(() => {
    mockInitializeGoogleAnalytics.mockReset()
    mockInitializeGoogleAnalytics.mockReturnValue(true)
    mockTrackGoogleAnalytics.mockReset()
    mockLocation.current = {
      hash: '',
      pathname: '/routes',
      search: ''
    }
  })

  it('tracks route page views when analytics is enabled', async() => {
    const store = createTestStore()
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider store={store}>{children}</Provider>
    )
    const { rerender } = renderHook(() => useGoogleAnalytics(), { wrapper })

    await waitFor(() => {
      expect(mockTrackGoogleAnalytics).toHaveBeenCalledWith('/routes')
    })

    mockTrackGoogleAnalytics.mockClear()
    mockLocation.current = {
      hash: '#detail',
      pathname: '/nearby',
      search: '?stop=station-1'
    }

    rerender()

    await waitFor(() => {
      expect(mockTrackGoogleAnalytics).toHaveBeenCalledWith('/nearby?stop=station-1#detail')
    })

    mockTrackGoogleAnalytics.mockClear()
    store.dispatch(setAnalyticsEnabled(false))

    expect(mockTrackGoogleAnalytics).not.toHaveBeenCalled()
  })

  it('skips page views when analytics is disabled', () => {
    const store = createTestStore({
      preloadedState: {
        analytics: {
          isEnabled: false
        }
      }
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider store={store}>{children}</Provider>
    )

    renderHook(() => useGoogleAnalytics(), { wrapper })

    expect(mockInitializeGoogleAnalytics).not.toHaveBeenCalled()
    expect(mockTrackGoogleAnalytics).not.toHaveBeenCalled()
  })
})
