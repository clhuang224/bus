import { describe, expect, it } from 'vitest'
import { BusStatusType } from '../enums/BusStatusType'
import { CityNameType } from '../enums/CityNameType'
import { DirectionType } from '../enums/DirectionType'
import { DutyStatusType } from '../enums/DutyStatusType'
import { StopStatusType } from '../enums/StopStatusType'
import i18n from '../i18n'
import { getRouteRealtimeBusStatuses } from './getRouteRealtimeBusStatuses'

const fourMinutesAwayLabel = i18n.t('routePage.realtime.minutesAway', { count: 4 })
const twoMinutesAwayLabel = i18n.t('routePage.realtime.minutesAway', { count: 2 })
const inServiceLabel = i18n.t('routePage.realtime.inService')
const comingSoonLabel = i18n.t('routePage.realtime.comingSoon')

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

    expect(getRouteRealtimeBusStatuses(i18n.t, realtimeBuses, estimatedArrivals)).toEqual([
      expect.objectContaining({
        estimateLabel: fourMinutesAwayLabel,
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

    expect(getRouteRealtimeBusStatuses(i18n.t, realtimeBuses, estimatedArrivals)).toEqual([
      expect.objectContaining({
        estimateLabel: inServiceLabel,
        estimateMinutes: null,
        stopName: '捷運昆陽站'
      })
    ])
  })

  it('matches realtime buses by stop sequence when stop ids differ across endpoints', () => {
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
      StopUID: 'stop-realtime',
      StopID: 'stop-realtime',
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
      PlateNumb: null,
      StopUID: 'stop-eta',
      StopID: 'stop-eta',
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

    expect(getRouteRealtimeBusStatuses(i18n.t, realtimeBuses, estimatedArrivals)).toEqual([
      expect.objectContaining({
        estimateLabel: fourMinutesAwayLabel,
        estimateMinutes: 4,
        stopName: '市政府'
      })
    ])
  })

  it('matches plate numbers case-insensitively after normalization', () => {
    const realtimeBuses = [{
      PlateNumb: 'eal-1095',
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
      PlateNumb: 'EAL-1095',
      StopUID: 'stop-2',
      StopID: 'stop-2',
      StopName: { zh_TW: '下一站', en: 'Next Stop' },
      RouteUID: 'route-1',
      RouteID: 'route-1',
      RouteName: { zh_TW: '藍1', en: 'Blue 1' },
      SubRouteUID: 'subroute-1',
      SubRouteID: 'subroute-1',
      SubRouteName: { zh_TW: '藍1', en: 'Blue 1' },
      Direction: DirectionType.GO,
      StopSequence: 6,
      EstimateTime: 61,
      StopStatus: StopStatusType.NORMAL,
      MessageType: 0,
      UpdateTime: '2026-03-20T10:00:00+08:00',
      City: CityNameType.TAIPEI
    }]

    expect(getRouteRealtimeBusStatuses(i18n.t, realtimeBuses, estimatedArrivals)).toEqual([
      expect.objectContaining({
        estimateLabel: twoMinutesAwayLabel,
        estimateMinutes: 2,
        plateNumb: 'eal-1095'
      })
    ])
  })

  it('uses the next upcoming ETA when the current stop still reports not yet departed', () => {
    const realtimeBuses = [{
      PlateNumb: 'KKA-0151',
      OperatorID: 'operator-1',
      RouteUID: 'route-1',
      RouteID: 'route-1',
      RouteName: { zh_TW: '225', en: '225' },
      SubRouteUID: 'route-1',
      SubRouteID: 'route-1',
      SubRouteName: { zh_TW: '225', en: '225' },
      Direction: DirectionType.GO,
      StopUID: 'stop-15',
      StopID: 'stop-15',
      StopName: { zh_TW: '蘆洲監理站', en: 'Luzhou Motor Vehicles Office' },
      StopSequence: 15,
      DutyStatus: DutyStatusType.NORMAL,
      BusStatus: BusStatusType.NORMAL,
      A2EventType: 0,
      GPSTime: '2026-03-20T10:00:00+08:00',
      SrcUpdateTime: '2026-03-20T10:00:00+08:00',
      UpdateTime: '2026-03-20T10:00:00+08:00',
      position: [121.56, 25.04] as [number, number],
      City: CityNameType.TAIPEI
    }]

    const estimatedArrivals = [
      {
        PlateNumb: null,
        StopUID: 'stop-15',
        StopID: 'stop-15',
        StopName: { zh_TW: '蘆洲監理站', en: 'Luzhou Motor Vehicles Office' },
        RouteUID: 'route-1',
        RouteID: 'route-1',
        RouteName: { zh_TW: '225', en: '225' },
        SubRouteUID: 'route-1',
        SubRouteID: 'route-1',
        SubRouteName: { zh_TW: '225', en: '225' },
        Direction: DirectionType.GO,
        StopSequence: 15,
        EstimateTime: null,
        StopStatus: StopStatusType.NOT_YET_DEPARTED,
        MessageType: 0,
        UpdateTime: '2026-03-20T10:00:00+08:00',
        City: CityNameType.TAIPEI
      },
      {
        PlateNumb: null,
        StopUID: 'stop-16',
        StopID: 'stop-16',
        StopName: { zh_TW: '蘆洲派出所', en: 'Luzhou Police Station' },
        RouteUID: 'route-1',
        RouteID: 'route-1',
        RouteName: { zh_TW: '225', en: '225' },
        SubRouteUID: 'route-1',
        SubRouteID: 'route-1',
        SubRouteName: { zh_TW: '225', en: '225' },
        Direction: DirectionType.GO,
        StopSequence: 16,
        EstimateTime: 37,
        StopStatus: StopStatusType.NORMAL,
        MessageType: 0,
        UpdateTime: '2026-03-20T10:00:00+08:00',
        City: CityNameType.TAIPEI
      }
    ]

    expect(getRouteRealtimeBusStatuses(i18n.t, realtimeBuses, estimatedArrivals)).toEqual([
      expect.objectContaining({
        estimateLabel: comingSoonLabel,
        estimateMinutes: 1,
        plateNumb: 'KKA-0151'
      })
    ])
  })

  it('uses the next stop ETA for the 225-style upstream shape when the current stop remains not yet departed', () => {
    const realtimeBuses = [{
      PlateNumb: 'KKA-0151',
      OperatorID: '400',
      RouteUID: 'TPE10443',
      RouteID: '10443',
      RouteName: { zh_TW: '225', en: '225' },
      SubRouteUID: 'TPE10443',
      SubRouteID: '10443',
      SubRouteName: { zh_TW: '225', en: '225' },
      Direction: DirectionType.GO,
      StopUID: 'TPE10024',
      StopID: '10024',
      StopName: { zh_TW: '三和國中', en: 'Sanhe Junior High School' },
      StopSequence: 23,
      DutyStatus: DutyStatusType.NORMAL,
      BusStatus: BusStatusType.NORMAL,
      A2EventType: 1,
      GPSTime: '2026-03-22T18:55:15+08:00',
      SrcUpdateTime: '2026-03-22T18:56:10+08:00',
      UpdateTime: '2026-03-22T18:56:19+08:00',
      position: null,
      City: CityNameType.TAIPEI
    }]

    const estimatedArrivals = [
      {
        PlateNumb: null,
        StopUID: 'TPE10024',
        StopID: '10024',
        StopName: { zh_TW: '三和國中', en: 'Sanhe Junior High School' },
        RouteUID: 'TPE10443',
        RouteID: '10443',
        RouteName: { zh_TW: '225', en: '225' },
        SubRouteUID: 'TPE10443',
        SubRouteID: '10443',
        SubRouteName: { zh_TW: '225', en: '225' },
        Direction: DirectionType.GO,
        StopSequence: 23,
        EstimateTime: null,
        StopStatus: StopStatusType.NOT_YET_DEPARTED,
        MessageType: 0,
        UpdateTime: '2026-03-22T18:56:24+08:00',
        City: CityNameType.TAIPEI
      },
      {
        PlateNumb: null,
        StopUID: 'TPE10026',
        StopID: '10026',
        StopName: { zh_TW: '格致中學(三和路)', en: 'Ger-Jyh Senior High School(Sanhe Rd.)' },
        RouteUID: 'TPE10443',
        RouteID: '10443',
        RouteName: { zh_TW: '225', en: '225' },
        SubRouteUID: 'TPE10443',
        SubRouteID: '10443',
        SubRouteName: { zh_TW: '225', en: '225' },
        Direction: DirectionType.GO,
        StopSequence: 24,
        EstimateTime: 80,
        StopStatus: StopStatusType.NORMAL,
        MessageType: 0,
        UpdateTime: '2026-03-22T18:56:24+08:00',
        City: CityNameType.TAIPEI
      }
    ]

    expect(getRouteRealtimeBusStatuses(i18n.t, realtimeBuses, estimatedArrivals)).toEqual([
      expect.objectContaining({
        estimateLabel: twoMinutesAwayLabel,
        estimateMinutes: 2,
        plateNumb: 'KKA-0151'
      })
    ])
  })
})
