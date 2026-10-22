// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { createElement, type PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AppLocaleType,
  CityNameType,
  RealtimeArrivalStatus,
  RealtimeVehicleState,
  RouteRealtimeStatus,
  type ApiRouteRealtime,
  type ApiRouteRealtimeSubRoute,
} from '@bus/shared'
import { RouteRealtimeInfoState } from '~/modules/enums/RouteRealtimeInfoState'
import i18n from '~/modules/i18n'
import { createTestStore } from '~/test/createTestStore'
import { useRouteRealtimeData } from './useRouteRealtimeData'

const { mockRefetch, mockUseGetRouteRealtimeQuery } = vi.hoisted(() => ({
  mockRefetch: vi.fn(),
  mockUseGetRouteRealtimeQuery: vi.fn(),
}))

vi.mock('~/modules/apis/transit', () => ({
  transitApi: {
    useGetRouteRealtimeQuery: mockUseGetRouteRealtimeQuery,
  },
}))

const t = i18n.getFixedT(AppLocaleType.ZH_TW)

const subRoute = {
  id: 'subroute-1-1',
  stops: [
    { stopUID: 'stop-a', sequence: 1 },
    { stopUID: 'stop-b', sequence: 2 },
    { stopUID: 'stop-a', sequence: 3 },
  ],
}

const options = {
  subRoute,
  city: CityNameType.TAIPEI,
  id: 'route-1',
}

function realtimeOf(
  subRouteOverrides: Partial<ApiRouteRealtimeSubRoute> = {},
): ApiRouteRealtime {
  return {
    uuid: 'route-1',
    sub_routes: [
      {
        uuid: 'subroute-1-1',
        status: RouteRealtimeStatus.NORMAL,
        stops: [],
        vehicles: [],
        ...subRouteOverrides,
      },
    ],
    updated_at: '2026-10-19T08:00:00.000Z',
  }
}

interface QueryResult {
  data?: ApiRouteRealtime | null
  isError?: boolean
}

function mockQueryResult({ data, isError = false }: QueryResult) {
  mockUseGetRouteRealtimeQuery.mockReturnValue({
    data,
    isError,
    isLoading: false,
    refetch: mockRefetch,
  })
}

function renderRealtimeHook() {
  const store = createTestStore({
    preloadedState: {
      locale: {
        value: AppLocaleType.ZH_TW,
      },
    },
  })
  const wrapper = ({ children }: PropsWithChildren) =>
    createElement(Provider as never, { store }, children)

  return renderHook(() => useRouteRealtimeData(options), { wrapper })
}

describe('useRouteRealtimeData', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockRefetch.mockReset()
    mockUseGetRouteRealtimeQuery.mockReset()
    mockQueryResult({ data: undefined })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('waits briefly before requesting realtime data', () => {
    renderRealtimeHook()

    expect(mockUseGetRouteRealtimeQuery).toHaveBeenLastCalledWith(
      { city: CityNameType.TAIPEI, routeUID: 'route-1' },
      expect.objectContaining({ skip: true }),
    )

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(mockUseGetRouteRealtimeQuery).toHaveBeenLastCalledWith(
      { city: CityNameType.TAIPEI, routeUID: 'route-1' },
      expect.objectContaining({ skip: false }),
    )
  })

  it('retries once after the API stops caching the rate-limited result', () => {
    mockQueryResult({
      data: realtimeOf({ status: RouteRealtimeStatus.RATE_LIMITED }),
    })
    const { rerender, result } = renderRealtimeHook()

    expect(result.current.isRealtimeRateLimited).toBe(true)

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(mockRefetch).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(mockRefetch).toHaveBeenCalledTimes(1)

    act(() => {
      rerender()
    })
    act(() => {
      vi.advanceTimersByTime(6000)
    })
    expect(mockRefetch).toHaveBeenCalledTimes(1)

    mockQueryResult({ data: realtimeOf() })
    act(() => {
      rerender()
    })
    mockQueryResult({
      data: realtimeOf({ status: RouteRealtimeStatus.RATE_LIMITED }),
    })
    act(() => {
      rerender()
    })
    act(() => {
      vi.advanceTimersByTime(6000)
    })
    expect(mockRefetch).toHaveBeenCalledTimes(2)
  })

  it('labels each stop visit with its own arrival', () => {
    mockQueryResult({
      data: realtimeOf({
        stops: [
          {
            uuid: 'stop-a',
            arrival: { status: RealtimeArrivalStatus.MINUTES, minutes: 4 },
          },
          { uuid: 'stop-b', arrival: null },
          {
            uuid: 'stop-a',
            arrival: {
              status: RealtimeArrivalStatus.LAST_BUS_PASSED,
              minutes: null,
            },
          },
        ],
      }),
    })
    const { result } = renderRealtimeHook()

    expect([...result.current.estimatedArrivalLabelsByStopSequence]).toEqual([
      [1, t('routePage.realtime.minutesAway', { count: 4 })],
      [3, t('routePage.realtime.stopStatus.lastBusPassed')],
    ])
  })

  it('lists vehicles near a stop and maps vehicles with a position', () => {
    mockQueryResult({
      data: realtimeOf({
        vehicles: [
          {
            plate_number: 'kka-0151',
            near_stop: {
              uuid: 'stop-b',
              sequence: 2,
              name: { 'zh-TW': '市政府', en: 'City Hall' },
            },
            state: RealtimeVehicleState.ARRIVING,
            arrival: {
              status: RealtimeArrivalStatus.COMING_SOON,
              minutes: null,
            },
            position: { latitude: 25.04, longitude: 121.56 },
          },
          {
            plate_number: 'KKA-0152',
            near_stop: null,
            state: null,
            arrival: {
              status: RealtimeArrivalStatus.IN_SERVICE,
              minutes: null,
            },
            position: { latitude: 25.05, longitude: 121.57 },
          },
        ],
      }),
    })
    const { result } = renderRealtimeHook()

    expect(result.current.realtimeBusStatuses).toEqual([
      {
        id: 'KKA-0151',
        plateNumb: 'kka-0151',
        stopSequence: 2,
        vehicleState: RealtimeVehicleState.ARRIVING,
      },
    ])
    expect(result.current.realtimeBusesByStopSequence.get(2)).toHaveLength(1)
    expect(result.current.realtimeMapVehicles).toEqual([
      {
        estimateLabel: t('routePage.realtime.comingSoon'),
        id: 'KKA-0151',
        plateNumb: 'kka-0151',
        position: [121.56, 25.04],
        stopName: '市政府',
      },
      {
        estimateLabel: t('routePage.realtime.inService'),
        id: 'KKA-0152',
        plateNumb: 'KKA-0152',
        position: [121.57, 25.05],
        stopName: t('components.routeMap.vehiclePopup.recentStopUnknown'),
      },
    ])
  })

  it.each([
    [RouteRealtimeStatus.NO_SERVICE, RouteRealtimeInfoState.NO_SERVICE],
    [
      RouteRealtimeStatus.NO_REALTIME_DATA,
      RouteRealtimeInfoState.NO_REALTIME_DATA,
    ],
    [RouteRealtimeStatus.NORMAL, RouteRealtimeInfoState.NORMAL],
  ])('shows %s as the %s info state', (status, infoState) => {
    mockQueryResult({ data: realtimeOf({ status }) })
    const { result } = renderRealtimeHook()

    expect(result.current.realtimeInfoState).toBe(infoState)
    expect(result.current.hasRealtimeError).toBe(false)
  })

  it('reports an error when feeds are unavailable or nothing has loaded', () => {
    mockQueryResult({
      data: realtimeOf({ status: RouteRealtimeStatus.UNAVAILABLE }),
    })
    expect(renderRealtimeHook().result.current.hasRealtimeError).toBe(true)

    mockQueryResult({ data: undefined, isError: true })
    expect(renderRealtimeHook().result.current.hasRealtimeError).toBe(true)

    mockQueryResult({ data: realtimeOf(), isError: true })
    expect(renderRealtimeHook().result.current.hasRealtimeError).toBe(false)
  })
})
