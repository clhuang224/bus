import { CityNameType, DirectionType } from '@bus/shared'
import { describe, expect, it } from 'vitest'
import type { BusRoute, BusSubRoute } from '../../interfaces/BusRoute'
import type { RouteShape } from '../../interfaces/RouteShape'
import type { StopOfRoute } from '../../interfaces/StopOfRoute'
import { EMPTY_LOCALIZED_TEXT } from '../i18n/withLocalizedFallback'
import { getTdxRouteStopIds, toRouteDetailFromTdx } from './toRouteDetail'

const text = { ...EMPTY_LOCALIZED_TEXT, 'zh-TW': '藍1' }

function subRoute(direction: DirectionType): BusSubRoute<string> {
  return {
    SubRouteUID: 'TPE101320',
    Direction: direction,
    SubRouteName: text,
    DepartureStopName: text,
    DestinationStopName: text,
  } as BusSubRoute<string>
}

const route = {
  RouteUID: 'TPE10132',
  City: CityNameType.TAIPEI,
  RouteName: text,
  DepartureStopName: text,
  DestinationStopName: text,
  SubRoutes: [subRoute(DirectionType.GO), subRoute(DirectionType.RETURN)],
} as BusRoute<string>

function stopOfRoute(
  overrides: Partial<StopOfRoute> & Pick<StopOfRoute, 'Stops'>,
): StopOfRoute {
  return {
    RouteUID: 'TPE10132',
    RouteID: '10132',
    RouteName: text,
    SubRouteUID: 'TPE101320',
    SubRouteID: '101320',
    SubRouteName: text,
    Direction: DirectionType.GO,
    City: CityNameType.TAIPEI,
    ...overrides,
  }
}

function stop(stopUID: string, stopID: string) {
  return {
    StopUID: stopUID,
    StopID: stopID,
    StopName: text,
    StopSequence: 1,
    StationID: null,
  }
}

describe('getTdxRouteStopIds', () => {
  it('returns unique, sorted stop UIDs and IDs for the route only', () => {
    expect(
      getTdxRouteStopIds('TPE10132', [
        stopOfRoute({ Stops: [stop('TPE2', '2'), stop('TPE1', '1')] }),
        stopOfRoute({ Stops: [stop('TPE1', '1')] }),
        stopOfRoute({ RouteUID: 'OTHER', Stops: [stop('TPE9', '9')] }),
      ]),
    ).toEqual(['1', '2', 'TPE1', 'TPE2'])
  })
})

describe('toRouteDetailFromTdx', () => {
  it('keeps the first stop list and shape for each sub-route direction', () => {
    const detail = toRouteDetailFromTdx({
      route,
      stopOfRoutes: [
        stopOfRoute({ Stops: [stop('TPE1', '1')] }),
        stopOfRoute({ Stops: [stop('TPE2', '2')] }),
      ],
      stops: [],
      shapes: [
        {
          SubRouteUID: 'TPE101320',
          Direction: DirectionType.GO,
          path: [[121, 25]],
        } as RouteShape,
        {
          SubRouteUID: 'TPE101320',
          Direction: DirectionType.GO,
          path: [[122, 26]],
        } as RouteShape,
      ],
    })

    expect(detail.subRoutes[0]!.stops.map(({ stopUID }) => stopUID)).toEqual([
      'TPE1',
    ])
    expect(detail.subRoutes[0]!.path).toEqual([[121, 25]])
  })

  it('leaves a direction without stop data empty', () => {
    const detail = toRouteDetailFromTdx({
      route,
      stopOfRoutes: [stopOfRoute({ Stops: [stop('TPE1', '1')] })],
      stops: [],
      shapes: [],
    })

    expect(detail.subRoutes.map(({ id }) => id)).toEqual([
      'TPE101320-0',
      'TPE101320-1',
    ])
    expect(detail.subRoutes[1]!.stops).toEqual([])
  })

  it('finds stop positions by StopUID, then StopID', () => {
    const detail = toRouteDetailFromTdx({
      route,
      stopOfRoutes: [
        stopOfRoute({ Stops: [stop('TPE1', '1'), stop('TPE2', '2')] }),
      ],
      stops: [
        { StopUID: 'TPE1', StopID: 'x', position: [121, 25] },
        { StopUID: 'y', StopID: '2', position: [122, 26] },
      ],
      shapes: [],
    })

    expect(detail.subRoutes[0]!.stops.map(({ position }) => position)).toEqual([
      [121, 25],
      [122, 26],
    ])
  })
})
