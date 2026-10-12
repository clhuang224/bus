import {
  DirectionType,
  RealtimeArrivalStatus,
  RealtimeVehicleState,
  RouteRealtimeStatus,
  TdxA2EventType,
  TdxStopStatus,
  type TdxEstimatedArrival,
  type TdxRealtimeByFrequency,
  type TdxRealtimeNearStop,
} from '@bus/shared'
import {
  calculateRouteRealtime,
  type RealtimeRoute,
  type RealtimeSources,
} from './route-realtime.calculator.js'
import {
  RealtimeSourceFailure,
  type RealtimeSourceResult,
} from './tdx-realtime-client.service.js'

const ROUTE_UID = 'TPE10132'
const SUB_ROUTE_UID = 'TPE101320'
const UPDATED_AT = new Date('2026-10-11T08:30:00.000Z')

const route: RealtimeRoute = {
  uuid: ROUTE_UID,
  subRoutes: [
    {
      uuid: `${SUB_ROUTE_UID}-0`,
      tdxSubRouteUid: SUB_ROUTE_UID,
      direction: DirectionType.GO,
      stops: [10, 11, 12].map((sequence) => ({
        uuid: `TPE${sequence}`,
        tdxStopId: `${sequence}`,
        sequence,
      })),
    },
  ],
}

function ok<T>(data: T[]): RealtimeSourceResult<T> {
  return { ok: true, data }
}

function failed<T>(failure: RealtimeSourceFailure): RealtimeSourceResult<T> {
  return { ok: false, failure }
}

function eta(
  sequence: number,
  overrides: Partial<TdxEstimatedArrival> = {},
): TdxEstimatedArrival {
  return {
    RouteUID: ROUTE_UID,
    SubRouteUID: SUB_ROUTE_UID,
    Direction: DirectionType.GO,
    StopUID: `TPE${sequence}`,
    StopID: `${sequence}`,
    StopSequence: sequence,
    EstimateTime: null,
    StopStatus: TdxStopStatus.NORMAL,
    ...overrides,
  }
}

function nearStop(
  sequence: number,
  overrides: Partial<TdxRealtimeNearStop> = {},
): TdxRealtimeNearStop {
  return {
    PlateNumb: 'KKA-0151',
    SubRouteUID: SUB_ROUTE_UID,
    Direction: DirectionType.GO,
    StopUID: `TPE${sequence}`,
    StopID: `${sequence}`,
    StopName: { Zh_tw: `站${sequence}`, En: `Stop ${sequence}` },
    StopSequence: sequence,
    A2EventType: TdxA2EventType.ARRIVING,
    ...overrides,
  }
}

function gps(
  plateNumber: string,
  overrides: Partial<TdxRealtimeByFrequency> = {},
): TdxRealtimeByFrequency {
  return {
    PlateNumb: plateNumber,
    SubRouteUID: SUB_ROUTE_UID,
    Direction: DirectionType.GO,
    BusPosition: { PositionLon: 121.5, PositionLat: 25 },
    ...overrides,
  }
}

function calculate(sources: Partial<RealtimeSources>) {
  const [subRoute] = calculateRouteRealtime(
    route,
    {
      estimatedArrivals: ok([]),
      nearStops: ok([]),
      positions: ok([]),
      ...sources,
    },
    UPDATED_AT,
  ).sub_routes

  return subRoute
}

describe('calculateRouteRealtime', () => {
  it('returns the route, its sub-routes, and the snapshot time', () => {
    expect(
      calculateRouteRealtime(
        route,
        {
          estimatedArrivals: ok([]),
          nearStops: ok([]),
          positions: ok([]),
        },
        UPDATED_AT,
      ),
    ).toMatchObject({
      uuid: ROUTE_UID,
      sub_routes: [{ uuid: `${SUB_ROUTE_UID}-0` }],
      updated_at: '2026-10-11T08:30:00.000Z',
    })
  })

  describe('stop arrivals', () => {
    it.each([
      {
        etaOverrides: { EstimateTime: 60 },
        arrival: { status: RealtimeArrivalStatus.COMING_SOON, minutes: null },
      },
      {
        etaOverrides: { EstimateTime: 61 },
        arrival: { status: RealtimeArrivalStatus.MINUTES, minutes: 2 },
      },
      {
        etaOverrides: {},
        arrival: { status: RealtimeArrivalStatus.NO_ESTIMATE, minutes: null },
      },
      {
        etaOverrides: { StopStatus: TdxStopStatus.LAST_BUS_PASSED },
        arrival: {
          status: RealtimeArrivalStatus.LAST_BUS_PASSED,
          minutes: null,
        },
      },
      {
        etaOverrides: { StopStatus: 99 as TdxStopStatus },
        arrival: { status: RealtimeArrivalStatus.UNKNOWN, minutes: null },
      },
      {
        etaOverrides: { StopStatus: null },
        arrival: { status: RealtimeArrivalStatus.UNKNOWN, minutes: null },
      },
    ])('maps $etaOverrides to $arrival.status', ({ etaOverrides, arrival }) => {
      const { stops } = calculate({
        estimatedArrivals: ok([eta(10, etaOverrides)]),
      })

      expect(stops[0]).toEqual({ uuid: 'TPE10', arrival })
    })

    it('prefers the sooner countdown when several ETAs cover one stop', () => {
      const { stops } = calculate({
        estimatedArrivals: ok([
          eta(10),
          eta(10, { EstimateTime: 600 }),
          eta(10, { EstimateTime: 240 }),
        ]),
      })

      expect(stops[0].arrival).toEqual({
        status: RealtimeArrivalStatus.MINUTES,
        minutes: 4,
      })
    })

    it('matches stops by TDX StopID when the StopUID differs', () => {
      const { stops } = calculate({
        estimatedArrivals: ok([
          eta(11, { StopUID: 'other', EstimateTime: 120 }),
        ]),
      })

      expect(stops.map(({ arrival }) => arrival?.minutes ?? null)).toEqual([
        null,
        2,
        null,
      ])
    })

    it('gives each visit of a repeated stop its own ETA', () => {
      const loopRoute: RealtimeRoute = {
        uuid: ROUTE_UID,
        subRoutes: [
          {
            ...route.subRoutes[0],
            stops: [
              { uuid: 'TPE10', tdxStopId: '10', sequence: 1 },
              { uuid: 'TPE11', tdxStopId: '11', sequence: 2 },
              { uuid: 'TPE10', tdxStopId: '10', sequence: 3 },
            ],
          },
        ],
      }
      const [subRoute] = calculateRouteRealtime(
        loopRoute,
        {
          estimatedArrivals: ok([
            eta(1, {
              StopUID: 'TPE10',
              StopStatus: TdxStopStatus.LAST_BUS_PASSED,
            }),
            eta(3, { StopUID: 'TPE10', EstimateTime: 600 }),
          ]),
          nearStops: ok([]),
          positions: ok([]),
        },
        UPDATED_AT,
      ).sub_routes

      expect(subRoute.stops.map(({ arrival }) => arrival)).toEqual([
        { status: RealtimeArrivalStatus.LAST_BUS_PASSED, minutes: null },
        null,
        { status: RealtimeArrivalStatus.MINUTES, minutes: 10 },
      ])
    })

    it('matches by stop alone when the ETA sequence differs', () => {
      const { stops } = calculate({
        estimatedArrivals: ok([
          eta(10, { StopSequence: 99, EstimateTime: 120 }),
        ]),
      })

      expect(stops[0].arrival).toEqual({
        status: RealtimeArrivalStatus.MINUTES,
        minutes: 2,
      })
    })

    it('falls back to route-level ETAs when TDX omits the sub-route', () => {
      const { stops } = calculate({
        estimatedArrivals: ok([
          eta(10, { SubRouteUID: null, EstimateTime: 120 }),
          eta(11, {
            SubRouteUID: 'OTHER',
            RouteUID: 'OTHER',
            EstimateTime: 300,
          }),
        ]),
      })

      expect(stops.map(({ arrival }) => arrival?.minutes ?? null)).toEqual([
        2,
        null,
        null,
      ])
    })

    it('ignores ETAs for the other direction', () => {
      const { stops } = calculate({
        estimatedArrivals: ok([
          eta(10, { Direction: DirectionType.RETURN, EstimateTime: 120 }),
        ]),
      })

      expect(stops[0].arrival).toBeNull()
    })
  })

  describe('vehicles', () => {
    it('uses the current stop ETA for a vehicle arriving at a stop', () => {
      const { vehicles } = calculate({
        estimatedArrivals: ok([eta(10, { EstimateTime: 240 })]),
        nearStops: ok([nearStop(10)]),
      })

      expect(vehicles).toEqual([
        {
          plate_number: 'KKA-0151',
          near_stop: {
            uuid: 'TPE10',
            sequence: 10,
            name: { 'zh-TW': '站10', en: 'Stop 10' },
          },
          state: RealtimeVehicleState.ARRIVING,
          arrival: { status: RealtimeArrivalStatus.MINUTES, minutes: 4 },
          position: null,
        },
      ])
    })

    it('uses the next downstream ETA once a vehicle has departed', () => {
      const { vehicles } = calculate({
        estimatedArrivals: ok([
          eta(10, { StopStatus: TdxStopStatus.LAST_BUS_PASSED }),
          eta(11, { EstimateTime: 120 }),
        ]),
        nearStops: ok([nearStop(10, { A2EventType: TdxA2EventType.DEPARTED })]),
      })

      expect(vehicles[0].state).toBe(RealtimeVehicleState.DEPARTED)
      expect(vehicles[0].arrival).toEqual({
        status: RealtimeArrivalStatus.MINUTES,
        minutes: 2,
      })
    })

    it('shows in service when the current stop has no departure yet', () => {
      const { vehicles } = calculate({
        estimatedArrivals: ok([
          eta(10, { StopStatus: TdxStopStatus.NOT_YET_DEPARTED }),
          eta(11, { EstimateTime: 80 }),
        ]),
        nearStops: ok([nearStop(10)]),
      })

      expect(vehicles[0].arrival).toEqual({
        status: RealtimeArrivalStatus.IN_SERVICE,
        minutes: null,
      })
    })

    it('matches ETAs by plate number, ignoring case and spaces', () => {
      const { vehicles } = calculate({
        estimatedArrivals: ok([
          eta(12, {
            StopUID: 'x',
            StopID: 'x',
            StopSequence: null,
            PlateNumb: ' kka-0151 ',
            EstimateTime: 300,
          }),
        ]),
        nearStops: ok([nearStop(10, { StopUID: 'y', StopID: 'y' })]),
      })

      expect(vehicles[0].arrival.minutes).toBe(5)
    })

    it('matches ETAs by stop sequence when stop IDs differ between feeds', () => {
      const { vehicles } = calculate({
        estimatedArrivals: ok([
          eta(10, { StopUID: 'x', StopID: 'x', EstimateTime: 180 }),
        ]),
        nearStops: ok([nearStop(10)]),
      })

      expect(vehicles[0].arrival.minutes).toBe(3)
    })

    it('resolves the near stop from TDX StopID when StopUID is missing', () => {
      const { vehicles } = calculate({
        nearStops: ok([
          nearStop(11, { StopUID: null }),
          nearStop(12, { PlateNumb: 'UNKNOWN', StopUID: null, StopID: 'x' }),
        ]),
      })

      expect(
        vehicles.map(({ plate_number, near_stop }) => [
          plate_number,
          near_stop?.uuid,
        ]),
      ).toEqual([
        ['KKA-0151', 'TPE11'],
        ['UNKNOWN', null],
      ])
    })

    it('treats a missing A2EventType as being at the stop', () => {
      const { vehicles } = calculate({
        nearStops: ok([nearStop(10, { A2EventType: null })]),
      })

      expect(vehicles[0].state).toBe(RealtimeVehicleState.AT_STOP)
      expect(vehicles[0].arrival.status).toBe(RealtimeArrivalStatus.IN_SERVICE)
    })

    it('orders vehicles by arrival, then by stop sequence', () => {
      const { vehicles } = calculate({
        estimatedArrivals: ok([
          eta(11, { EstimateTime: 600 }),
          eta(12, { EstimateTime: 120 }),
        ]),
        nearStops: ok([
          nearStop(13, { PlateNumb: 'C' }),
          nearStop(11, { PlateNumb: 'B' }),
          nearStop(12, { PlateNumb: 'A' }),
          nearStop(9, { PlateNumb: 'D', A2EventType: null }),
        ]),
      })

      expect(vehicles.map(({ plate_number }) => plate_number)).toEqual([
        'A',
        'B',
        'D',
        'C',
      ])
    })

    it('adds GPS positions by plate and appends GPS-only vehicles last', () => {
      const { vehicles } = calculate({
        nearStops: ok([nearStop(10)]),
        positions: ok([
          gps('kka-0151', {
            BusPosition: { PositionLon: 121.1, PositionLat: 25.1 },
          }),
          gps('GPS-ONLY'),
          gps('NO-POSITION', { BusPosition: null }),
          gps('OTHER-SUB-ROUTE', { SubRouteUID: 'OTHER' }),
          gps('OTHER-DIRECTION', { Direction: DirectionType.RETURN }),
        ]),
      })

      expect(vehicles).toEqual([
        expect.objectContaining({
          plate_number: 'KKA-0151',
          position: { latitude: 25.1, longitude: 121.1 },
        }),
        {
          plate_number: 'GPS-ONLY',
          near_stop: null,
          state: null,
          arrival: { status: RealtimeArrivalStatus.IN_SERVICE, minutes: null },
          position: { latitude: 25, longitude: 121.5 },
        },
      ])
    })
  })

  describe('status', () => {
    it('is normal when a vehicle is near a stop', () => {
      expect(calculate({ nearStops: ok([nearStop(10)]) }).status).toBe(
        RouteRealtimeStatus.NORMAL,
      )
    })

    it('reports no realtime data without ETAs or vehicles', () => {
      expect(calculate({}).status).toBe(RouteRealtimeStatus.NO_REALTIME_DATA)
    })

    it('reports no service when every ETA is outside service', () => {
      expect(
        calculate({
          estimatedArrivals: ok([
            eta(10, { StopStatus: TdxStopStatus.NOT_YET_DEPARTED }),
            eta(11, { StopStatus: TdxStopStatus.LAST_BUS_PASSED }),
            eta(12, { StopStatus: TdxStopStatus.NOT_IN_SERVICE_TODAY }),
          ]),
        }).status,
      ).toBe(RouteRealtimeStatus.NO_SERVICE)
    })

    it('reports no realtime data when ETAs run but no vehicle is reported', () => {
      expect(
        calculate({ estimatedArrivals: ok([eta(10, { EstimateTime: 60 })]) })
          .status,
      ).toBe(RouteRealtimeStatus.NO_REALTIME_DATA)
    })

    it('reports a rate limit before any other failure', () => {
      expect(
        calculate({
          estimatedArrivals: failed(RealtimeSourceFailure.UNAVAILABLE),
          nearStops: failed(RealtimeSourceFailure.RATE_LIMITED),
        }).status,
      ).toBe(RouteRealtimeStatus.RATE_LIMITED)
    })

    it('reports unavailable when ETAs fail', () => {
      expect(
        calculate({
          estimatedArrivals: failed(RealtimeSourceFailure.UNAVAILABLE),
          nearStops: ok([nearStop(10)]),
        }).status,
      ).toBe(RouteRealtimeStatus.UNAVAILABLE)
    })

    it('reports unavailable when vehicles fail and there are no ETAs', () => {
      expect(
        calculate({
          nearStops: failed(RealtimeSourceFailure.UNAVAILABLE),
        }).status,
      ).toBe(RouteRealtimeStatus.UNAVAILABLE)
    })

    it('keeps ETAs usable when only vehicles or GPS positions fail', () => {
      const subRoute = calculate({
        estimatedArrivals: ok([eta(10, { EstimateTime: 120 })]),
        nearStops: failed(RealtimeSourceFailure.UNAVAILABLE),
        positions: failed(RealtimeSourceFailure.RATE_LIMITED),
      })

      expect(subRoute.status).toBe(RouteRealtimeStatus.NO_REALTIME_DATA)
      expect(subRoute.stops[0].arrival?.minutes).toBe(2)
    })
  })
})
