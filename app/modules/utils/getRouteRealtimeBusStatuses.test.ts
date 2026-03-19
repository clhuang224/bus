import { describe, expect, it } from 'vitest'
import { BusStatusType } from '../enums/BusStatusType'
import { CityNameType } from '../enums/CityNameType'
import { DirectionType } from '../enums/DirectionType'
import { DutyStatusType } from '../enums/DutyStatusType'
import { StopStatusType } from '../enums/StopStatusType'
import { getRouteRealtimeBusStatuses } from './getRouteRealtimeBusStatuses'

describe('getRouteRealtimeBusStatuses', () => {
  it('matches a realtime bus with its estimated arrival by plate number and formats minutes', () => {
    const realtimeBuses = [{
      PlateNumb: 'ABC-123',
      OperatorID: 'operator-1',
      RouteUID: 'route-1',
      RouteID: 'route-1',
      RouteName: { zh_TW: '藍1', en: 'Blue 1' },
      SubRouteUID: 'subroute-1',
      SubRouteID: 'subroute-1',
      SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
      Direction: DirectionType.GO,
      StopUID: 'stop-1',
      StopID: 'stop-1',
      StopName: { zh_TW: '市政府', en: 'City Hall' },
      StopSequence: 5,
      DutyStatus: DutyStatusType.NORMAL,
      BusStatus: BusStatusType.NORMAL,
      A2EventType: 0,
      GPSTime: '2026-03-20T10:00:00+08:00',
      SrcUpdateTime: '2026-03-20T10:00:00+08:00',
      UpdateTime: '2026-03-20T10:00:00+08:00',
      position: [121.56, 25.04] as [number, number],
      City: CityNameType.TAIPEI
    }]

    const estimatedArrivals = [{
      PlateNumb: 'ABC-123',
      StopUID: 'stop-1',
      StopID: 'stop-1',
      StopName: { zh_TW: '市政府', en: 'City Hall' },
      RouteUID: 'route-1',
      RouteID: 'route-1',
      RouteName: { zh_TW: '藍1', en: 'Blue 1' },
      SubRouteUID: 'subroute-1',
      SubRouteID: 'subroute-1',
      SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
      Direction: DirectionType.GO,
      StopSequence: 5,
      EstimateTime: 181,
      StopStatus: StopStatusType.NORMAL,
      MessageType: 0,
      UpdateTime: '2026-03-20T10:00:00+08:00',
      City: CityNameType.TAIPEI
    }]

    expect(getRouteRealtimeBusStatuses(realtimeBuses, estimatedArrivals)).toEqual([
      expect.objectContaining({
        estimateLabel: '4 分',
        estimateMinutes: 4,
        plateNumb: 'ABC-123',
        stopName: '市政府'
      })
    ])
  })

  it('falls back to stop status text when estimate time is unavailable', () => {
    const realtimeBuses = [{
      PlateNumb: null,
      OperatorID: 'operator-1',
      RouteUID: 'route-1',
      RouteID: 'route-1',
      RouteName: { zh_TW: '藍1', en: 'Blue 1' },
      SubRouteUID: 'subroute-1',
      SubRouteID: 'subroute-1',
      SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
      Direction: DirectionType.GO,
      StopUID: 'stop-2',
      StopID: 'stop-2',
      StopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' },
      StopSequence: 6,
      DutyStatus: DutyStatusType.NORMAL,
      BusStatus: BusStatusType.NORMAL,
      A2EventType: 0,
      GPSTime: '2026-03-20T10:00:00+08:00',
      SrcUpdateTime: '2026-03-20T10:00:00+08:00',
      UpdateTime: '2026-03-20T10:00:00+08:00',
      position: [121.6, 25.05] as [number, number],
      City: CityNameType.TAIPEI
    }]

    const estimatedArrivals = [{
      PlateNumb: null,
      StopUID: 'stop-2',
      StopID: 'stop-2',
      StopName: { zh_TW: '捷運昆陽站', en: 'MRT Kunyang Station' },
      RouteUID: 'route-1',
      RouteID: 'route-1',
      RouteName: { zh_TW: '藍1', en: 'Blue 1' },
      SubRouteUID: 'subroute-1',
      SubRouteID: 'subroute-1',
      SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
      Direction: DirectionType.GO,
      StopSequence: 6,
      EstimateTime: null,
      StopStatus: StopStatusType.NOT_YET_DEPARTED,
      MessageType: 0,
      UpdateTime: '2026-03-20T10:00:00+08:00',
      City: CityNameType.TAIPEI
    }]

    expect(getRouteRealtimeBusStatuses(realtimeBuses, estimatedArrivals)).toEqual([
      expect.objectContaining({
        estimateLabel: '尚未發車',
        estimateMinutes: null,
        stopName: '捷運昆陽站'
      })
    ])
  })
})
