// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { createElement, type PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BusRoute, BusSubRoute } from '~/modules/interfaces/BusRoute'
import { AppLocaleType } from '~/modules/enums/AppLocaleType'
import { CityNameType } from '~/modules/enums/CityNameType'
import { DirectionType } from '~/modules/enums/DirectionType'
import { createTestStore } from '~/test/createTestStore'
import { useRouteRealtimeData } from './useRouteRealtimeData'

const {
  mockUseGetEstimatedArrivalByRouteQuery,
  mockUseGetRealtimeNearStopsByRouteQuery,
  mockUseGetRouteShapesByRouteQuery
} = vi.hoisted(() => ({
  mockUseGetEstimatedArrivalByRouteQuery: vi.fn(),
  mockUseGetRealtimeNearStopsByRouteQuery: vi.fn(),
  mockUseGetRouteShapesByRouteQuery: vi.fn()
}))

vi.mock('~/modules/apis/bus', () => ({
  busApi: {
    useGetEstimatedArrivalByRouteQuery: mockUseGetEstimatedArrivalByRouteQuery,
    useGetRealtimeNearStopsByRouteQuery: mockUseGetRealtimeNearStopsByRouteQuery,
    useGetRouteShapesByRouteQuery: mockUseGetRouteShapesByRouteQuery
  }
}))

const busRoute: BusRoute<Date | null> = {
  RouteUID: 'route-1',
  RouteID: 'route-1',
  HasSubRoutes: true,
  Operators: [],
  AuthorityID: '005',
  ProviderID: 'provider-1',
  SubRoutes: [],
  BusRouteType: 0,
  RouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
  DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall' },
  DestinationStopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
  TicketPriceDescription: { 'zh-TW': '', en: '' },
  FareBufferZoneDescription: { 'zh-TW': '', en: '' },
  RouteMapImageUrl: '',
  City: CityNameType.TAIPEI,
  CityCode: 'TPE',
  UpdateTime: null,
  VersionID: 0
}

const activeSubRoute = {
  SubRouteUID: 'subroute-1',
  SubRouteID: 'subroute-1',
  OperatorIDs: [],
  SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
  Direction: DirectionType.RETURN,
  FirstBusTime: null,
  LastBusTime: null,
  HolidayFirstBusTime: null,
  HolidayLastBusTime: null,
  DepartureStopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
  DestinationStopName: { 'zh-TW': '市政府', en: 'City Hall' }
} satisfies BusSubRoute<Date | null>

interface RealtimeQueryOptions {
  skip: boolean
}

describe('useRouteRealtimeData', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    mockUseGetEstimatedArrivalByRouteQuery.mockReset()
    mockUseGetRealtimeNearStopsByRouteQuery.mockReset()
    mockUseGetRouteShapesByRouteQuery.mockReset()

    mockUseGetRouteShapesByRouteQuery.mockReturnValue({
      data: []
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('restarts realtime backoff for repeated 429 responses in the same session', () => {
    const store = createTestStore({
      preloadedState: {
        locale: {
          value: AppLocaleType.ZH_TW
        }
      }
    })
    const wrapper = ({ children }: PropsWithChildren) => createElement(Provider as never, { store }, children)

    let estimatedError: { status: number, data: Record<string, never> } | null = null
    let realtimeError: { status: number, data: Record<string, never> } | null = null

    mockUseGetEstimatedArrivalByRouteQuery.mockImplementation((_args, options: RealtimeQueryOptions) => ({
      data: [],
      error: estimatedError,
      isError: options.skip ? false : estimatedError != null,
      isLoading: false
    }))
    mockUseGetRealtimeNearStopsByRouteQuery.mockImplementation((_args, options: RealtimeQueryOptions) => ({
      data: [],
      error: realtimeError,
      isError: options.skip ? false : realtimeError != null,
      isLoading: false
    }))

    const { rerender } = renderHook(() => useRouteRealtimeData({
      activeSubRoute,
      busRoute,
      city: CityNameType.TAIPEI,
      id: 'route-1'
    }), { wrapper })

    expect(mockUseGetEstimatedArrivalByRouteQuery).toHaveBeenLastCalledWith(
      { city: CityNameType.TAIPEI, routeUID: 'route-1' },
      expect.objectContaining({ skip: true })
    )

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(mockUseGetEstimatedArrivalByRouteQuery).toHaveBeenLastCalledWith(
      { city: CityNameType.TAIPEI, routeUID: 'route-1' },
      expect.objectContaining({ skip: false })
    )

    estimatedError = { status: 429, data: {} }
    realtimeError = { status: 429, data: {} }

    act(() => {
      rerender()
    })

    expect(mockUseGetEstimatedArrivalByRouteQuery).toHaveBeenLastCalledWith(
      { city: CityNameType.TAIPEI, routeUID: 'route-1' },
      expect.objectContaining({ skip: true })
    )

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(mockUseGetEstimatedArrivalByRouteQuery).toHaveBeenLastCalledWith(
      { city: CityNameType.TAIPEI, routeUID: 'route-1' },
      expect.objectContaining({ skip: false })
    )

    estimatedError = null
    realtimeError = null

    act(() => {
      rerender()
    })

    expect(mockUseGetEstimatedArrivalByRouteQuery).toHaveBeenLastCalledWith(
      { city: CityNameType.TAIPEI, routeUID: 'route-1' },
      expect.objectContaining({ skip: false })
    )

    estimatedError = { status: 429, data: {} }
    realtimeError = { status: 429, data: {} }

    act(() => {
      rerender()
    })

    expect(mockUseGetEstimatedArrivalByRouteQuery).toHaveBeenLastCalledWith(
      { city: CityNameType.TAIPEI, routeUID: 'route-1' },
      expect.objectContaining({ skip: true })
    )
  })
})
