import { CityNameType, DirectionType } from '@bus/shared'
import type { TdxBusRoute } from '@bus/shared'
import { isTdxBusRoute } from './tdx-route.validator.js'

const route = {
  RouteUID: 'TPE10001',
  RouteID: '10001',
  HasSubRoutes: true,
  Operators: [
    {
      OperatorID: '1',
      OperatorName: { Zh_tw: 'Example Bus', En: 'Example Bus' },
      OperatorNo: '1',
    },
  ],
  AuthorityID: '1',
  ProviderID: '1',
  SubRoutes: [
    {
      SubRouteUID: 'TPE100010',
      SubRouteID: '100010',
      OperatorIDs: ['1'],
      SubRouteName: { Zh_tw: 'Example Route', En: 'Example Route' },
      Direction: DirectionType.GO,
    },
  ],
  BusRouteType: 11,
  RouteName: { Zh_tw: 'Example Route', En: 'Example Route' },
  City: CityNameType.TAIPEI,
  UpdateTime: '2026-06-21T00:00:00+08:00',
  VersionID: 1,
} satisfies TdxBusRoute

describe('isTdxBusRoute', () => {
  it('accepts a valid TDX route', () => {
    expect(isTdxBusRoute(route)).toBe(true)
  })

  it('rejects malformed nested subroutes', () => {
    expect(
      isTdxBusRoute({
        ...route,
        SubRoutes: [{ ...route.SubRoutes[0], Direction: 'outbound' }],
      }),
    ).toBe(false)
  })
})
