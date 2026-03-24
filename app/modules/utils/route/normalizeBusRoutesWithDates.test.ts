import { describe, expect, it } from 'vitest'
import { CityNameType } from '../../enums/CityNameType'
import { DirectionType } from '../../enums/DirectionType'
import type { BusRoute } from '../../interfaces/BusRoute'
import { normalizeBusRoutesWithDates } from './normalizeBusRoutesWithDates'

describe('normalizeBusRoutesWithDates', () => {
  it('converts route update time and subroute service times to Date values', () => {
    const routes: BusRoute<string>[] = [
      {
        RouteUID: 'route-1',
        RouteID: 'route-1',
        HasSubRoutes: true,
        Operators: [],
        AuthorityID: '005',
        ProviderID: 'provider-1',
        SubRoutes: [
          {
            SubRouteUID: 'subroute-1',
            SubRouteID: 'subroute-1',
            OperatorIDs: [],
            SubRouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
            Direction: DirectionType.GO,
            FirstBusTime: '06:00',
            LastBusTime: '22:00',
            HolidayFirstBusTime: '',
            HolidayLastBusTime: '',
            DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall' },
            DestinationStopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' }
          }
        ],
        BusRouteType: 0,
        RouteName: { 'zh-TW': '藍1', en: 'Blue 1' },
        DepartureStopName: { 'zh-TW': '市政府', en: 'City Hall' },
        DestinationStopName: { 'zh-TW': '捷運昆陽站', en: 'MRT Kunyang Station' },
        TicketPriceDescription: { 'zh-TW': '', en: '' },
        FareBufferZoneDescription: { 'zh-TW': '', en: '' },
        RouteMapImageUrl: '',
        City: CityNameType.TAIPEI,
        CityCode: 'TPE',
        UpdateTime: '2026-03-21T12:00:00+08:00',
        VersionID: 0
      }
    ]

    const [route] = normalizeBusRoutesWithDates(routes)

    expect(route.UpdateTime).toBeInstanceOf(Date)
    expect(route.SubRoutes[0].FirstBusTime).toBeInstanceOf(Date)
    expect(route.SubRoutes[0].LastBusTime).toBeInstanceOf(Date)
    expect(route.SubRoutes[0].HolidayFirstBusTime).toBeNull()
    expect(route.SubRoutes[0].HolidayLastBusTime).toBeNull()
  })
})
