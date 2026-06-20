import { CityNameType, DirectionType } from '@bus/shared'
import type { TdxBusRoute } from '@bus/shared'
import {
  CityNameType as PrismaCityNameType,
  DirectionType as PrismaDirectionType,
} from '../../generated/prisma/enums.js'
import { routeMapper } from './route.mapper.js'

const tdxRoute: TdxBusRoute = {
  RouteUID: 'NWT10116',
  RouteID: '10116',
  HasSubRoutes: true,
  Operators: [
    {
      OperatorID: '16176',
      OperatorName: {
        Zh_tw: '臺北客運',
        En: 'Taipei Bus Co., Ltd.',
      },
      OperatorNo: '0400',
    },
  ],
  AuthorityID: '005',
  ProviderID: '015',
  SubRoutes: [
    {
      SubRouteUID: 'NWT101160',
      SubRouteID: '101160',
      OperatorIDs: ['16176'],
      SubRouteName: {
        Zh_tw: '242',
        En: '242',
      },
      Direction: DirectionType.GO,
      FirstBusTime: '0530',
      LastBusTime: '1710',
    },
  ],
  BusRouteType: 11,
  RouteName: {
    Zh_tw: ' 242 ',
    En: '242',
    Ja: '',
    Ko: null,
  },
  DepartureStopNameZh: '中和',
  DepartureStopNameEn: 'Zhonghe',
  DestinationStopNameZh: '西門',
  DestinationStopNameEn: 'Ximen',
  City: CityNameType.NEW_TAIPEI,
  CityCode: 'NWT',
  UpdateTime: '2026-06-03T18:45:21+08:00',
  VersionID: 7931,
}

describe('routeMapper', () => {
  it('maps TDX routes into Prisma-friendly records', () => {
    expect(
      routeMapper({
        city: CityNameType.NEW_TAIPEI,
        tdxRoutes: [tdxRoute],
      }),
    ).toEqual([
      {
        route: {
          uuid: 'NWT10116',
          tdx_route_id: '10116',
          city: PrismaCityNameType.NEW_TAIPEI,
          name_zh_tw: '242',
          name_en: '242',
          name_ja: null,
          name_ko: null,
          departure_zh_tw: '中和',
          departure_en: 'Zhonghe',
          departure_ja: null,
          departure_ko: null,
          destination_zh_tw: '西門',
          destination_en: 'Ximen',
          destination_ja: null,
          destination_ko: null,
          tdx_updated_at: new Date('2026-06-03T10:45:21.000Z'),
        },
        subroutes: [
          {
            uuid: 'NWT101160-0',
            tdx_subroute_id: '101160',
            direction: PrismaDirectionType.GO,
            name_zh_tw: '242',
            name_en: '242',
            name_ja: null,
            name_ko: null,
            departure_zh_tw: '中和',
            departure_en: 'Zhonghe',
            departure_ja: null,
            departure_ko: null,
            destination_zh_tw: '西門',
            destination_en: 'Ximen',
            destination_ja: null,
            destination_ko: null,
            first_bus_time: '0530',
            last_bus_time: '1710',
            tdx_updated_at: new Date('2026-06-03T10:45:21.000Z'),
          },
        ],
        operators: [
          {
            tdx_operator_id: '16176',
            name_zh_tw: '臺北客運',
            name_en: 'Taipei Bus Co., Ltd.',
          },
        ],
      },
    ])
  })

  it('normalizes missing optional values and unknown directions', () => {
    const [record] = routeMapper({
      city: CityNameType.NEW_TAIPEI,
      tdxRoutes: [
        {
          ...tdxRoute,
          DepartureStopNameEn: ' ',
          UpdateTime: 'invalid',
          SubRoutes: [
            {
              ...tdxRoute.SubRoutes![0],
              Direction: 99 as DirectionType,
              FirstBusTime: null,
            },
          ],
        },
      ],
    })

    expect(record.route.departure_en).toBeNull()
    expect(record.route.tdx_updated_at).toBeNull()
    expect(record.subroutes[0]).toMatchObject({
      direction: PrismaDirectionType.UNKNOWN,
      first_bus_time: null,
    })
  })
})
