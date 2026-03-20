import { describe, expect, it } from 'vitest'
import { CityNameType } from '../enums/CityNameType'
import { DirectionType } from '../enums/DirectionType'
import { transformEstimatedArrival, transformRealtimeNearStop, transformStop } from './transformTdxBusData'

describe('transformTdxBusData', () => {
  it('falls back to route name when estimated arrival sub route name is missing', () => {
    expect(transformEstimatedArrival({
      StopUID: 'stop-1',
      StopID: 'stop-1',
      StopName: { Zh_tw: '市政府', En: 'City Hall' },
      RouteUID: 'route-1',
      RouteID: 'route-1',
      RouteName: { Zh_tw: '藍1', En: 'Blue 1' },
      SubRouteUID: 'subroute-1',
      SubRouteID: 'subroute-1',
      SubRouteName: undefined as never,
      Direction: DirectionType.GO,
      StopSequence: 1,
      EstimateTime: 60,
      StopStatus: 0,
      MessageType: 0,
      UpdateTime: '2026-03-20T10:00:00+08:00'
    }, CityNameType.TAIPEI)).toEqual(expect.objectContaining({
      City: CityNameType.TAIPEI,
      SubRouteName: {
        zh_TW: '藍1',
        en: 'Blue 1'
      }
    }))
  })

  it('skips realtime near stop entries without bus position', () => {
    expect(transformRealtimeNearStop({
      PlateNumb: 'ABC-123',
      OperatorID: 'operator-1',
      RouteUID: 'route-1',
      RouteID: 'route-1',
      RouteName: { Zh_tw: '藍1', En: 'Blue 1' },
      SubRouteUID: 'subroute-1',
      SubRouteID: 'subroute-1',
      SubRouteName: { Zh_tw: '藍1', En: 'Blue 1' },
      Direction: DirectionType.GO,
      StopUID: 'stop-1',
      StopID: 'stop-1',
      StopName: { Zh_tw: '市政府', En: 'City Hall' },
      StopSequence: 1,
      DutyStatus: 0,
      BusStatus: 0,
      A2EventType: 0,
      GPSTime: '2026-03-20T10:00:00+08:00',
      SrcUpdateTime: '2026-03-20T10:00:00+08:00',
      UpdateTime: '2026-03-20T10:00:00+08:00',
      BusPosition: undefined as never
    }, CityNameType.TAIPEI)).toBeNull()
  })

  it('skips stop entries without stop position', () => {
    expect(transformStop({
      StopUID: 'stop-1',
      StopID: 'stop-1',
      AuthorityID: 'authority-1',
      StationID: null,
      StationGroupID: 'station-group-1',
      StopName: { Zh_tw: '市政府', En: 'City Hall' },
      StopPosition: undefined as never,
      StopAddress: null,
      Bearing: null,
      StopDescription: null,
      City: CityNameType.TAIPEI,
      UpdateTime: '2026-03-20T10:00:00+08:00',
      VersionID: 1
    })).toBeNull()
  })
})
