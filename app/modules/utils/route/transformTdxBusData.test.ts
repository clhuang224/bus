import { describe, expect, it } from 'vitest'
import { CityNameType } from '../../enums/CityNameType'
import { DirectionType } from '../../enums/DirectionType'
import { VehicleStateType } from '../../enums/VehicleStateType'
import {
  transformBusRoute,
  transformEstimatedArrival,
  transformRealtimeByFrequency,
  transformRealtimeNearStop,
  transformStop
} from './transformTdxBusData'

describe('transformTdxBusData', () => {
  it('falls back to route name when estimated arrival sub route name is missing', () => {
    expect(transformEstimatedArrival({
      StopUID: 'stop-1',
      StopID: 'stop-1',
      StopName: { Zh_tw: '市政府', En: 'City Hall' },
      RouteUID: 'route-1',
      RouteID: 'route-1',
      RouteName: { Zh_tw: '藍1', En: 'Blue 1' },
      SubRouteUID: undefined,
      SubRouteID: undefined,
      SubRouteName: undefined as never,
      Direction: DirectionType.GO,
      StopSequence: 1,
      EstimateTime: 60,
      StopStatus: 0,
      MessageType: 0,
      UpdateTime: '2026-03-20T10:00:00+08:00'
    }, CityNameType.TAIPEI)).toEqual(expect.objectContaining({
      City: CityNameType.TAIPEI,
      SubRouteUID: 'route-1',
      SubRouteID: 'route-1',
      SubRouteName: {
        'zh-TW': '藍1',
        en: 'Blue 1'
      }
    }))
  })

  it('keeps realtime near stop entries even when bus position is missing', () => {
    expect(transformRealtimeNearStop({
      PlateNumb: 'ABC-123',
      OperatorID: 'operator-1',
      OperatorNo: null,
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
      MessageType: 0,
      DutyStatus: 0,
      BusStatus: 0,
      A2EventType: 0,
      GPSTime: '2026-03-20T10:00:00+08:00',
      TripStartTimeType: 0,
      TripStartTime: null,
      TransTime: null,
      SrcRecTime: null,
      SrcTransTime: null,
      SrcUpdateTime: '2026-03-20T10:00:00+08:00',
      UpdateTime: '2026-03-20T10:00:00+08:00'
    }, CityNameType.TAIPEI)).toEqual(expect.objectContaining({
      City: CityNameType.TAIPEI,
      PlateNumb: 'ABC-123',
      vehicleState: VehicleStateType.DEPARTED
    }))
  })

  it('transforms realtime by frequency entries into map-ready positions', () => {
    expect(transformRealtimeByFrequency({
      PlateNumb: 'ABC-123',
      OperatorID: 'operator-1',
      OperatorNo: null,
      RouteUID: 'route-1',
      RouteID: 'route-1',
      RouteName: { Zh_tw: '藍1', En: 'Blue 1' },
      SubRouteUID: 'subroute-1',
      SubRouteID: 'subroute-1',
      SubRouteName: { Zh_tw: '藍1', En: 'Blue 1' },
      Direction: DirectionType.GO,
      Speed: null,
      Azimuth: null,
      DutyStatus: 0,
      BusStatus: 0,
      MessageType: 0,
      GPSTime: '2026-03-20T10:00:00+08:00',
      TransTime: null,
      SrcRecTime: null,
      SrcTransTime: null,
      SrcUpdateTime: '2026-03-20T10:00:00+08:00',
      UpdateTime: '2026-03-20T10:00:00+08:00',
      BusPosition: {
        PositionLon: 121.56,
        PositionLat: 25.04
      }
    }, CityNameType.TAIPEI)).toEqual(expect.objectContaining({
      City: CityNameType.TAIPEI,
      PlateNumb: 'ABC-123',
      position: [121.56, 25.04]
    }))
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

  it('falls back to route-level terminal names when subroute terminal names are missing', () => {
    expect(transformBusRoute({
      RouteUID: 'route-1',
      RouteID: 'route-1',
      HasSubRoutes: true,
      Operators: [],
      AuthorityID: '005',
      ProviderID: 'provider-1',
      SubRoutes: [{
        SubRouteUID: 'subroute-1',
        SubRouteID: 'subroute-1',
        OperatorIDs: [],
        SubRouteName: { Zh_tw: '2', En: '2' },
        Direction: DirectionType.GO,
        FirstBusTime: '',
        LastBusTime: '',
        HolidayFirstBusTime: '',
        HolidayLastBusTime: '',
        DepartureStopNameZh: undefined as unknown as string,
        DepartureStopNameEn: undefined as unknown as string,
        DestinationStopNameZh: undefined as unknown as string,
        DestinationStopNameEn: undefined as unknown as string
      }],
      BusRouteType: 0,
      RouteName: { Zh_tw: '2', En: '2' },
      DepartureStopNameZh: '圓環',
      DepartureStopNameEn: 'Yuanhuan',
      DestinationStopNameZh: '大龍峒',
      DestinationStopNameEn: 'Dalongdong',
      TicketPriceDescriptionZh: '',
      TicketPriceDescriptionEn: '',
      FareBufferZoneDescriptionZh: '',
      FareBufferZoneDescriptionEn: '',
      RouteMapImageUrl: '',
      City: CityNameType.TAIPEI,
      CityCode: 'TPE',
      UpdateTime: '2026-03-20T10:00:00+08:00',
      VersionID: 0
    }).SubRoutes[0]).toEqual(expect.objectContaining({
      DepartureStopName: {
        'zh-TW': '圓環',
        en: 'Yuanhuan'
      },
      DestinationStopName: {
        'zh-TW': '大龍峒',
        en: 'Dalongdong'
      }
    }))
  })
})
