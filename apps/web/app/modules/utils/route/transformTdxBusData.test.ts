import { describe, expect, it } from 'vitest'
import { CityNameType, DirectionType } from '@bus/shared'
import { transformBusRoute, transformStop } from './transformTdxBusData'

describe('transformTdxBusData', () => {
  it('skips stop entries without stop position', () => {
    expect(
      transformStop({
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
        VersionID: 1,
      }),
    ).toBeNull()
  })

  it('falls back to route-level terminal names when subroute terminal names are missing', () => {
    expect(
      transformBusRoute(
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
              SubRouteName: { Zh_tw: '2', En: '2' },
              Direction: DirectionType.GO,
              FirstBusTime: '',
              LastBusTime: '',
              HolidayFirstBusTime: '',
              HolidayLastBusTime: '',
              DepartureStopNameZh: undefined as unknown as string,
              DepartureStopNameEn: undefined as unknown as string,
              DestinationStopNameZh: undefined as unknown as string,
              DestinationStopNameEn: undefined as unknown as string,
            },
          ],
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
          VersionID: 0,
        },
        CityNameType.TAIPEI,
      ).SubRoutes[0],
    ).toEqual(
      expect.objectContaining({
        DepartureStopName: {
          'zh-TW': '圓環',
          en: 'Yuanhuan',
          ja: '',
          ko: '',
        },
        DestinationStopName: {
          'zh-TW': '大龍峒',
          en: 'Dalongdong',
          ja: '',
          ko: '',
        },
      }),
    )
  })
})
