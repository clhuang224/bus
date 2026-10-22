import { readFileSync } from 'node:fs'
import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import {
  RealtimeArrivalStatus,
  RealtimeVehicleState,
  RouteRealtimeStatus,
  type ApiRouteRealtimeSubRoute,
  type ApiSuccessResponse,
  type TdxEstimatedArrival,
  type TdxRealtimeByFrequency,
  type TdxRealtimeNearStop,
} from '@bus/shared'
import { PrismaService } from '../src/prisma/prisma.service.js'
import type { RouteRealtimeResponseDto } from '../src/realtime/dto/route-realtime-response.dto.js'
import { TdxRealtimeClientService } from '../src/realtime/tdx-realtime-client.service.js'
import { createE2eApp } from './create-e2e-app.js'

interface RealtimeFixture {
  route: { uuid: string }
  estimatedArrivals: TdxEstimatedArrival[]
  nearStops: TdxRealtimeNearStop[]
  positions: TdxRealtimeByFrequency[]
}

function loadFixture(name: string): RealtimeFixture {
  return JSON.parse(
    readFileSync(
      new URL(`./fixtures/realtime/${name}.json`, import.meta.url),
      'utf8',
    ),
  ) as RealtimeFixture
}

async function createFixtureApp(fixture: RealtimeFixture) {
  return createE2eApp({
    configureModule: (builder) =>
      builder
        .overrideProvider(PrismaService)
        .useValue({
          $disconnect: () => Promise.resolve(),
          route: { findFirst: () => Promise.resolve(fixture.route) },
        })
        .overrideProvider(TdxRealtimeClientService)
        .useValue({
          fetchEstimatedArrivals: () =>
            Promise.resolve({ ok: true, data: fixture.estimatedArrivals }),
          fetchNearStops: () =>
            Promise.resolve({ ok: true, data: fixture.nearStops }),
          fetchPositions: () =>
            Promise.resolve({ ok: true, data: fixture.positions }),
        }),
  })
}

async function getSubRoutes(
  app: INestApplication,
  routeUuid: string,
): Promise<Map<string, ApiRouteRealtimeSubRoute>> {
  const response = await request(app.getHttpServer())
    .get(`/api/realtime/routes/${routeUuid}`)
    .expect(200)
  const body = response.body as ApiSuccessResponse<RouteRealtimeResponseDto>

  return new Map(
    body.data.sub_routes.map((subRoute) => [subRoute.uuid, subRoute]),
  )
}

function arrivalOf(subRoute: ApiRouteRealtimeSubRoute, stopUuid: string) {
  return subRoute.stops.find(({ uuid }) => uuid === stopUuid)?.arrival
}

function vehicleSummaries(subRoute: ApiRouteRealtimeSubRoute) {
  return subRoute.vehicles.map(({ plate_number, state, arrival }) => [
    plate_number,
    state,
    arrival.status,
    arrival.minutes,
  ])
}

describe('Realtime API with recorded city data (e2e)', () => {
  let app: INestApplication

  afterEach(async () => {
    await app.close()
  })

  describe('Taichung route 700, where sub-route UIDs equal the route UID', () => {
    const fixture = loadFixture('taichung-700')

    beforeEach(async () => {
      app = await createFixtureApp(fixture)
    })

    it('maps each stop to its own ETA', async () => {
      const subRoute = (await getSubRoutes(app, 'TXG7000')).get('TXG7000-0')!

      expect(subRoute.status).toBe(RouteRealtimeStatus.NORMAL)
      expect(subRoute.stops.every(({ arrival }) => arrival !== null)).toBe(true)
      expect(arrivalOf(subRoute, 'TXG22437')).toEqual({
        status: RealtimeArrivalStatus.NOT_YET_DEPARTED,
        minutes: null,
      })
      expect(arrivalOf(subRoute, 'TXG22444')).toEqual({
        status: RealtimeArrivalStatus.COMING_SOON,
        minutes: null,
      })
      expect(arrivalOf(subRoute, 'TXG22445')).toEqual({
        status: RealtimeArrivalStatus.MINUTES,
        minutes: 2,
      })
    })

    it('uses the next stop for departed vehicles and orders them by arrival', async () => {
      const subRoute = (await getSubRoutes(app, 'TXG7000')).get('TXG7000-0')!

      expect(vehicleSummaries(subRoute)).toEqual([
        ['EAL-0605', RealtimeVehicleState.DEPARTED, 'coming_soon', null],
        ['EAL-1236', RealtimeVehicleState.DEPARTED, 'coming_soon', null],
        ['EAA-855', RealtimeVehicleState.DEPARTED, 'minutes', 2],
        ['EAA-826', RealtimeVehicleState.ARRIVING, 'minutes', 15],
        ['EAA-827', RealtimeVehicleState.ARRIVING, 'minutes', 20],
      ])
    })

    it('shows vehicles arriving at not-yet-departed stops as in service', async () => {
      const subRoute = (await getSubRoutes(app, 'TXG7000')).get('TXG7000-1')!
      const vehicles = new Map(
        subRoute.vehicles.map((vehicle) => [vehicle.plate_number, vehicle]),
      )

      expect(subRoute.vehicles).toHaveLength(7)
      expect(vehicles.get('EAL-1252')?.arrival).toEqual({
        status: RealtimeArrivalStatus.IN_SERVICE,
        minutes: null,
      })
      expect(vehicles.get('EAA-852')?.arrival).toEqual({
        status: RealtimeArrivalStatus.MINUTES,
        minutes: 12,
      })
    })
  })

  describe('Taoyuan route 1, which visits one stop twice', () => {
    beforeEach(async () => {
      app = await createFixtureApp(loadFixture('taoyuan-1'))
    })

    it('gives each visit of the repeated stop its own arrival', async () => {
      const subRoute = (await getSubRoutes(app, 'TAO1')).get('TAO1-0')!
      const repeatedStopArrivals = subRoute.stops
        .filter(({ uuid }) => uuid === 'TAO190')
        .map(({ arrival }) => arrival)

      expect(repeatedStopArrivals).toEqual([
        { status: RealtimeArrivalStatus.LAST_BUS_PASSED, minutes: null },
        { status: RealtimeArrivalStatus.NOT_YET_DEPARTED, minutes: null },
      ])
      expect(arrivalOf(subRoute, 'TAO3939')).toEqual({
        status: RealtimeArrivalStatus.MINUTES,
        minutes: 4,
      })
    })
  })

  describe('Hualien route 311, with lettered short-trip sub-routes', () => {
    beforeEach(async () => {
      app = await createFixtureApp(loadFixture('hualien-311'))
    })

    it('matches vehicles on every sub-route variant', async () => {
      const subRoutes = await getSubRoutes(app, 'HUA0117')

      expect(vehicleSummaries(subRoutes.get('HUA011701-0')!)).toEqual([
        ['KKB-2623', RealtimeVehicleState.ARRIVING, 'coming_soon', null],
        ['KKB-2683', RealtimeVehicleState.DEPARTED, 'minutes', 3],
        ['KKA-9996', RealtimeVehicleState.ARRIVING, 'minutes', 9],
        ['KKB-2616', RealtimeVehicleState.ARRIVING, 'minutes', 9],
      ])
      expect(vehicleSummaries(subRoutes.get('HUA0117A1-0')!)).toEqual([
        ['KKB-2369', RealtimeVehicleState.ARRIVING, 'in_service', null],
      ])
      expect(subRoutes.get('HUA0117A2-1')!.vehicles).toHaveLength(2)
      expect([...subRoutes.values()].map(({ status }) => status)).toEqual([
        RouteRealtimeStatus.NORMAL,
        RouteRealtimeStatus.NORMAL,
        RouteRealtimeStatus.NORMAL,
      ])
    })
  })

  describe('Tainan route 黃幹線, with unknown-direction ETAs and a short trip', () => {
    beforeEach(async () => {
      app = await createFixtureApp(loadFixture('tainan-1500'))
    })

    it('uses the sub-route ETAs that TDX tags with an unknown direction', async () => {
      const fullLength = (await getSubRoutes(app, 'TNN1500')).get(
        'TNN150001-0',
      )!

      expect(fullLength.status).toBe(RouteRealtimeStatus.NORMAL)
      expect(fullLength.stops.every(({ arrival }) => arrival !== null)).toBe(
        true,
      )
      expect(arrivalOf(fullLength, 'TNN7530')).toEqual({
        status: RealtimeArrivalStatus.MINUTES,
        minutes: 25,
      })
      expect(arrivalOf(fullLength, 'TNN7568')).toEqual({
        status: RealtimeArrivalStatus.MINUTES,
        minutes: 3,
      })
      expect(vehicleSummaries(fullLength)).toEqual([
        ['686-U9', RealtimeVehicleState.DEPARTED, 'coming_soon', null],
        ['061-U9', RealtimeVehicleState.DEPARTED, 'minutes', 3],
      ])
    })

    it('leaves a short trip without its own ETAs empty', async () => {
      const shortTrip = (await getSubRoutes(app, 'TNN1500')).get('TNN150021-0')!

      expect(shortTrip.status).toBe(RouteRealtimeStatus.NO_REALTIME_DATA)
      expect(shortTrip.stops.every(({ arrival }) => arrival === null)).toBe(
        true,
      )
      expect(shortTrip.vehicles).toEqual([])
    })
  })

  describe('Penghu route 21, with running and finished sub-routes', () => {
    beforeEach(async () => {
      app = await createFixtureApp(loadFixture('penghu-21'))
    })

    it('reports each sub-route service state separately', async () => {
      const subRoutes = await getSubRoutes(app, 'PEN0758')

      expect(subRoutes.get('PEN075801-0')!.status).toBe(
        RouteRealtimeStatus.NO_SERVICE,
      )
      expect(arrivalOf(subRoutes.get('PEN075801-0')!, 'PEN299468')).toEqual({
        status: RealtimeArrivalStatus.LAST_BUS_PASSED,
        minutes: null,
      })
      expect(subRoutes.get('PEN0758N1-0')!.status).toBe(
        RouteRealtimeStatus.NO_SERVICE,
      )
      expect(arrivalOf(subRoutes.get('PEN0758N1-0')!, 'PEN299468')).toEqual({
        status: RealtimeArrivalStatus.NOT_IN_SERVICE_TODAY,
        minutes: null,
      })

      const running = subRoutes.get('PEN0758I1-0')!
      expect(running.status).toBe(RouteRealtimeStatus.NORMAL)
      expect(vehicleSummaries(running)).toEqual([
        ['973-FQ', RealtimeVehicleState.DEPARTED, 'minutes', 2],
      ])
    })
  })
})
