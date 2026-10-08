import { CityNameType, DirectionType } from '@bus/shared'
import { describe, expect, it } from 'vitest'
import type { BusRoute, BusSubRoute } from '../../interfaces/BusRoute'
import type { StopOfRoute } from '../../interfaces/StopOfRoute'
import { EMPTY_LOCALIZED_TEXT } from '../i18n/withLocalizedFallback'
import { toNearbyStationRoutesFromTdx } from './toNearbyStations'

function text(zhTW: string, en = '') {
  return { ...EMPTY_LOCALIZED_TEXT, 'zh-TW': zhTW, en }
}

function stopOfRoute(overrides: Partial<StopOfRoute>): StopOfRoute {
  return {
    RouteUID: 'TPE10132',
    RouteID: '10132',
    RouteName: text('藍1', 'Blue 1'),
    SubRouteUID: 'TPE101320',
    SubRouteID: '101320',
    SubRouteName: text('藍1', 'Blue 1'),
    Direction: DirectionType.GO,
    City: CityNameType.TAIPEI,
    Stops: [
      {
        StopUID: 'TPE1',
        StopID: '1',
        StopName: text('市政府'),
        StopSequence: 1,
        StationID: 'station-1',
      },
    ],
    ...overrides,
  }
}

const route = {
  RouteUID: 'TPE10132',
  RouteName: text('藍1', 'Blue 1'),
  DepartureStopName: text('市政府', 'City Hall'),
  DestinationStopName: text('', ''),
  SubRoutes: [
    {
      SubRouteUID: 'TPE101320',
      Direction: DirectionType.GO,
      DepartureStopName: text('松山', 'Songshan'),
      DestinationStopName: text('昆陽', 'Kunyang'),
    } as BusSubRoute<string>,
  ],
} as BusRoute<string>

describe('toNearbyStationRoutesFromTdx', () => {
  it('uses sub-route terminals when the direction matches', () => {
    const routes = toNearbyStationRoutesFromTdx([stopOfRoute({})], [route])

    expect(routes['station-1']).toEqual([
      expect.objectContaining({
        id: 'TPE101320-0',
        departure: text('松山', 'Songshan'),
        destination: text('昆陽', 'Kunyang'),
      }),
    ])
  })

  it('falls back to route terminals, then the route name, for other directions', () => {
    const routes = toNearbyStationRoutesFromTdx(
      [stopOfRoute({ Direction: DirectionType.RETURN })],
      [route],
    )
    const [stationRoute] = routes['station-1']!

    expect(stationRoute!.departure).toMatchObject({
      'zh-TW': '市政府',
      en: 'City Hall',
    })
    expect(stationRoute!.destination).toMatchObject({
      'zh-TW': '藍1',
      en: 'Blue 1',
    })
  })

  it('falls back to the route name when the sub-route name is empty', () => {
    const routes = toNearbyStationRoutesFromTdx(
      [stopOfRoute({ SubRouteName: text('') })],
      null,
    )

    expect(routes['station-1']![0]!.name).toMatchObject({
      'zh-TW': '藍1',
      en: 'Blue 1',
    })
  })

  it('leaves terminals empty when route data is not loaded', () => {
    const routes = toNearbyStationRoutesFromTdx([stopOfRoute({})], null)

    expect(routes['station-1']![0]!.departure).toEqual(EMPTY_LOCALIZED_TEXT)
  })

  it('lists a route direction once per station even with several stops', () => {
    const routes = toNearbyStationRoutesFromTdx(
      [
        stopOfRoute({
          Stops: [
            {
              StopUID: 'TPE1',
              StopID: '1',
              StopName: text('市政府'),
              StopSequence: 1,
              StationID: 'station-1',
            },
            {
              StopUID: 'TPE2',
              StopID: '2',
              StopName: text('市政府'),
              StopSequence: 2,
              StationID: 'station-1',
            },
          ],
        }),
      ],
      null,
    )

    expect(routes['station-1']).toHaveLength(1)
  })
})
