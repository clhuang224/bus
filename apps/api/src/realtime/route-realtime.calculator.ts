import {
  RealtimeArrivalStatus,
  RealtimeVehicleState,
  RouteRealtimeStatus,
  TdxA2EventType,
  TdxStopStatus,
  type ApiPosition,
  type ApiRealtimeArrival,
  type ApiRouteRealtime,
  type ApiRouteRealtimeStop,
  type ApiRouteRealtimeSubRoute,
  type ApiRouteRealtimeVehicle,
  type DirectionType,
  type TdxEstimatedArrival,
  type TdxRealtimeByFrequency,
  type TdxRealtimeNearStop,
} from '@bus/shared'
import {
  RealtimeSourceFailure,
  type RealtimeSourceResult,
} from './tdx-realtime-client.service.js'

export interface RealtimeRouteStop {
  uuid: string
  tdxStopId: string
}

export interface RealtimeRouteSubRoute {
  uuid: string
  tdxSubRouteUid: string
  direction: DirectionType
  stops: RealtimeRouteStop[]
}

export interface RealtimeRoute {
  /** Route UUID, which equals the TDX RouteUID. */
  uuid: string
  subRoutes: RealtimeRouteSubRoute[]
}

export interface RealtimeSources {
  estimatedArrivals: RealtimeSourceResult<TdxEstimatedArrival>
  nearStops: RealtimeSourceResult<TdxRealtimeNearStop>
  positions: RealtimeSourceResult<TdxRealtimeByFrequency>
}

interface Arrival {
  plateNumber: string | null
  stopUID: string | null
  stopID: string | null
  routeUID: string
  subRouteUID: string
  direction: DirectionType
  sequence: number | null
  estimateSeconds: number | null
  stopStatus: TdxStopStatus
}

const STOP_STATUS_ARRIVALS: Partial<
  Record<TdxStopStatus, RealtimeArrivalStatus>
> = {
  [TdxStopStatus.NOT_YET_DEPARTED]: RealtimeArrivalStatus.NOT_YET_DEPARTED,
  [TdxStopStatus.NO_STOP_DUE_TO_TRAFFIC_CONTROL]:
    RealtimeArrivalStatus.NO_STOP_DUE_TO_TRAFFIC_CONTROL,
  [TdxStopStatus.LAST_BUS_PASSED]: RealtimeArrivalStatus.LAST_BUS_PASSED,
  [TdxStopStatus.NOT_IN_SERVICE_TODAY]:
    RealtimeArrivalStatus.NOT_IN_SERVICE_TODAY,
}

const OUT_OF_SERVICE_STOP_STATUSES = [
  TdxStopStatus.NOT_YET_DEPARTED,
  TdxStopStatus.LAST_BUS_PASSED,
  TdxStopStatus.NOT_IN_SERVICE_TODAY,
]

/** Stop statuses that say nothing useful about a vehicle already running. */
const VEHICLE_FALLBACK_STOP_STATUSES = [
  TdxStopStatus.NOT_YET_DEPARTED,
  TdxStopStatus.UNKNOWN,
]

const IN_SERVICE_ARRIVAL: ApiRealtimeArrival = {
  status: RealtimeArrivalStatus.IN_SERVICE,
  minutes: null,
}

/**
 * Turns one route's TDX realtime feeds into what each sub-route should show:
 * an arrival per stop, the vehicles with their arrival, and a status message.
 */
export function calculateRouteRealtime(
  route: RealtimeRoute,
  sources: RealtimeSources,
  updatedAt: Date,
): ApiRouteRealtime {
  const arrivals = getData(sources.estimatedArrivals).map((arrival) =>
    toArrival(arrival),
  )
  const nearStops = getData(sources.nearStops)
  const positions = getData(sources.positions)
  const routeStatus = getRouteSourceStatus(sources, arrivals.length)

  return {
    uuid: route.uuid,
    sub_routes: route.subRoutes.map((subRoute) =>
      calculateSubRoute(
        route.uuid,
        subRoute,
        arrivals,
        nearStops,
        positions,
        routeStatus,
      ),
    ),
    updated_at: updatedAt.toISOString(),
  }
}

function calculateSubRoute(
  routeUID: string,
  subRoute: RealtimeRouteSubRoute,
  arrivals: Arrival[],
  nearStops: TdxRealtimeNearStop[],
  positions: TdxRealtimeByFrequency[],
  routeStatus: RouteRealtimeStatus | null,
): ApiRouteRealtimeSubRoute {
  const activeArrivals = getActiveArrivals(routeUID, subRoute, arrivals)
  const activeNearStops = nearStops.filter(
    (nearStop) =>
      nearStop.SubRouteUID === subRoute.tdxSubRouteUid &&
      nearStop.Direction === subRoute.direction,
  )
  const nearStopVehicles = getNearStopVehicles(activeNearStops, activeArrivals)

  return {
    uuid: subRoute.uuid,
    status:
      routeStatus ??
      getServiceStatus(
        activeArrivals,
        activeNearStops.length,
        nearStopVehicles.length,
      ),
    stops: getStopArrivals(subRoute.stops, activeArrivals),
    vehicles: withPositions(nearStopVehicles, subRoute, positions),
  }
}

function getData<T>(source: RealtimeSourceResult<T>): T[] {
  return source.ok ? source.data : []
}

function toArrival(arrival: TdxEstimatedArrival): Arrival {
  const routeUID = arrival.RouteUID ?? ''

  return {
    plateNumber: arrival.PlateNumb
      ? normalizePlateNumber(arrival.PlateNumb)
      : null,
    stopUID: arrival.StopUID ?? null,
    stopID: arrival.StopID ?? null,
    routeUID,
    // TDX omits SubRouteUID for some routes; those ETAs apply route-wide.
    subRouteUID: arrival.SubRouteUID ?? routeUID,
    direction: arrival.Direction,
    sequence: arrival.StopSequence ?? null,
    estimateSeconds: arrival.EstimateTime ?? null,
    stopStatus: arrival.StopStatus ?? TdxStopStatus.UNKNOWN,
  }
}

/**
 * Status shared by every sub-route when the ETA or near-stop feed failed, or
 * null when the sub-route's own service state decides. Rate limits win over
 * failures. GPS failures are left out: arrivals stay usable without positions.
 */
function getRouteSourceStatus(
  sources: RealtimeSources,
  arrivalCount: number,
): RouteRealtimeStatus | null {
  const failures = [sources.estimatedArrivals, sources.nearStops].flatMap(
    (source) => (source.ok ? [] : [source.failure]),
  )

  if (failures.includes(RealtimeSourceFailure.RATE_LIMITED)) {
    return RouteRealtimeStatus.RATE_LIMITED
  }

  const hasNoArrivals = !sources.estimatedArrivals.ok
  const hasNoVehiclesOrArrivals = !sources.nearStops.ok && arrivalCount === 0

  return hasNoArrivals || hasNoVehiclesOrArrivals
    ? RouteRealtimeStatus.UNAVAILABLE
    : null
}

/**
 * ETAs for this sub-route and direction. When TDX does not tag ETAs with the
 * sub-route, falls back to route-level ETAs, then to every ETA in the
 * direction.
 */
function getActiveArrivals(
  routeUID: string,
  subRoute: RealtimeRouteSubRoute,
  arrivals: Arrival[],
): Arrival[] {
  const directionArrivals = arrivals.filter(
    (arrival) => arrival.direction === subRoute.direction,
  )
  const subRouteArrivals = directionArrivals.filter(
    (arrival) => arrival.subRouteUID === subRoute.tdxSubRouteUid,
  )

  if (subRouteArrivals.length > 0) return subRouteArrivals

  const routeArrivals = directionArrivals.filter(
    (arrival) =>
      arrival.routeUID === routeUID || arrival.subRouteUID === routeUID,
  )

  return routeArrivals.length > 0 ? routeArrivals : directionArrivals
}

function getServiceStatus(
  activeArrivals: Arrival[],
  activeNearStopCount: number,
  vehicleCount: number,
): RouteRealtimeStatus {
  if (vehicleCount > 0) return RouteRealtimeStatus.NORMAL

  if (activeArrivals.length === 0 && activeNearStopCount === 0) {
    return RouteRealtimeStatus.NO_REALTIME_DATA
  }

  const isOutOfService = activeArrivals.every((arrival) =>
    OUT_OF_SERVICE_STOP_STATUSES.includes(arrival.stopStatus),
  )

  return isOutOfService
    ? RouteRealtimeStatus.NO_SERVICE
    : RouteRealtimeStatus.NO_REALTIME_DATA
}

/**
 * Picks one ETA per stop. Sooner countdowns win; ETAs without a countdown
 * follow in stop order. Stops match by StopUID first, then TDX StopID.
 */
function getStopArrivals(
  stops: RealtimeRouteStop[],
  activeArrivals: Arrival[],
): ApiRouteRealtimeStop[] {
  const sortedArrivals = [...activeArrivals].sort((left, right) => {
    if (left.estimateSeconds == null && right.estimateSeconds == null) {
      return (
        (left.sequence ?? Number.POSITIVE_INFINITY) -
        (right.sequence ?? Number.POSITIVE_INFINITY)
      )
    }
    if (left.estimateSeconds == null) return 1
    if (right.estimateSeconds == null) return -1
    return left.estimateSeconds - right.estimateSeconds
  })
  const arrivalsByStopKey = new Map<string, Arrival>()

  for (const arrival of sortedArrivals) {
    for (const key of [arrival.stopUID, arrival.stopID]) {
      if (key && !arrivalsByStopKey.has(key))
        arrivalsByStopKey.set(key, arrival)
    }
  }

  return stops.map((stop) => {
    const arrival =
      arrivalsByStopKey.get(stop.uuid) ?? arrivalsByStopKey.get(stop.tdxStopId)

    return {
      uuid: stop.uuid,
      arrival: arrival
        ? toApiArrival(arrival.estimateSeconds, arrival.stopStatus)
        : null,
    }
  })
}

function toApiArrival(
  estimateSeconds: number | null,
  stopStatus: TdxStopStatus,
): ApiRealtimeArrival {
  if (estimateSeconds != null) {
    return estimateSeconds <= 60
      ? { status: RealtimeArrivalStatus.COMING_SOON, minutes: null }
      : {
          status: RealtimeArrivalStatus.MINUTES,
          minutes: Math.ceil(estimateSeconds / 60),
        }
  }

  if (stopStatus === TdxStopStatus.NORMAL) {
    return { status: RealtimeArrivalStatus.NO_ESTIMATE, minutes: null }
  }

  return {
    status: STOP_STATUS_ARRIVALS[stopStatus] ?? RealtimeArrivalStatus.UNKNOWN,
    minutes: null,
  }
}

interface NearStopVehicle {
  vehicle: ApiRouteRealtimeVehicle
  plateNumber: string
  estimateMinutes: number | null
}

function getNearStopVehicles(
  nearStops: TdxRealtimeNearStop[],
  activeArrivals: Arrival[],
): NearStopVehicle[] {
  return nearStops
    .map((nearStop) => {
      const plateNumber = normalizePlateNumber(nearStop.PlateNumb)
      const state = toVehicleState(nearStop.A2EventType)
      const arrival = getVehicleArrival(
        nearStop,
        plateNumber,
        state,
        activeArrivals,
      )

      return {
        plateNumber,
        estimateMinutes:
          arrival?.estimateSeconds != null
            ? Math.ceil(arrival.estimateSeconds / 60)
            : null,
        vehicle: {
          plate_number: nearStop.PlateNumb,
          near_stop: {
            uuid: nearStop.StopUID ?? null,
            sequence: nearStop.StopSequence,
            name: {
              'zh-TW': nearStop.StopName?.Zh_tw ?? '',
              en: nearStop.StopName?.En ?? '',
            },
          },
          state,
          arrival: toVehicleApiArrival(arrival),
          position: null,
        },
      }
    })
    .sort((left, right) => {
      if (left.estimateMinutes == null && right.estimateMinutes == null) {
        return (
          left.vehicle.near_stop.sequence - right.vehicle.near_stop.sequence
        )
      }
      if (left.estimateMinutes == null) return 1
      if (right.estimateMinutes == null) return -1
      return left.estimateMinutes - right.estimateMinutes
    })
}

function toVehicleState(
  a2EventType: TdxA2EventType | null | undefined,
): RealtimeVehicleState {
  switch (a2EventType) {
    case TdxA2EventType.DEPARTED:
      return RealtimeVehicleState.DEPARTED
    case TdxA2EventType.ARRIVING:
      return RealtimeVehicleState.ARRIVING
    default:
      return RealtimeVehicleState.AT_STOP
  }
}

/**
 * The ETA that describes a vehicle. A vehicle that already left its stop
 * should show the next stop's countdown; otherwise the current stop's ETA is
 * the best match, then the ETA tagged with the same plate.
 */
function getVehicleArrival(
  nearStop: TdxRealtimeNearStop,
  plateNumber: string,
  state: RealtimeVehicleState,
  activeArrivals: Arrival[],
): Arrival | undefined {
  const plateArrival = activeArrivals.find(
    (arrival) => arrival.plateNumber === plateNumber,
  )
  const stopArrival = activeArrivals.find(
    (arrival) =>
      (nearStop.StopUID != null &&
        nearStop.StopUID !== '' &&
        arrival.stopUID === nearStop.StopUID) ||
      (nearStop.StopID != null &&
        nearStop.StopID !== '' &&
        arrival.stopID === nearStop.StopID) ||
      (arrival.sequence != null && arrival.sequence === nearStop.StopSequence),
  )
  const nextArrival = activeArrivals
    .filter(
      (arrival) =>
        arrival.sequence != null &&
        arrival.sequence > nearStop.StopSequence &&
        arrival.estimateSeconds != null,
    )
    .sort((left, right) => left.sequence! - right.sequence!)[0]

  return state === RealtimeVehicleState.DEPARTED
    ? (nextArrival ?? plateArrival ?? stopArrival)
    : (stopArrival ?? plateArrival ?? nextArrival)
}

function toVehicleApiArrival(arrival: Arrival | undefined): ApiRealtimeArrival {
  if (
    !arrival ||
    (arrival.estimateSeconds == null &&
      VEHICLE_FALLBACK_STOP_STATUSES.includes(arrival.stopStatus))
  ) {
    return IN_SERVICE_ARRIVAL
  }

  return toApiArrival(arrival.estimateSeconds, arrival.stopStatus)
}

/**
 * Adds GPS positions to vehicles near a stop, then appends vehicles that only
 * appear in the GPS feed.
 */
function withPositions(
  nearStopVehicles: NearStopVehicle[],
  subRoute: RealtimeRouteSubRoute,
  positions: TdxRealtimeByFrequency[],
): ApiRouteRealtimeVehicle[] {
  const positionsByPlate = new Map<
    string,
    { plateNumber: string; position: ApiPosition }
  >()

  for (const vehicle of positions) {
    const position = toApiPosition(vehicle)
    const plateNumber = normalizePlateNumber(vehicle.PlateNumb)

    if (
      vehicle.SubRouteUID !== subRoute.tdxSubRouteUid ||
      vehicle.Direction !== subRoute.direction ||
      !position ||
      positionsByPlate.has(plateNumber)
    ) {
      continue
    }

    positionsByPlate.set(plateNumber, {
      plateNumber: vehicle.PlateNumb,
      position,
    })
  }

  const nearStopPlates = new Set(
    nearStopVehicles.map(({ plateNumber }) => plateNumber),
  )
  const gpsOnlyVehicles = [...positionsByPlate]
    .filter(([plateNumber]) => !nearStopPlates.has(plateNumber))
    .map(([, { plateNumber, position }]) => ({
      plate_number: plateNumber,
      near_stop: null,
      state: null,
      arrival: IN_SERVICE_ARRIVAL,
      position,
    }))

  return [
    ...nearStopVehicles.map(({ vehicle, plateNumber }) => ({
      ...vehicle,
      position: positionsByPlate.get(plateNumber)?.position ?? null,
    })),
    ...gpsOnlyVehicles,
  ]
}

function toApiPosition(vehicle: TdxRealtimeByFrequency): ApiPosition | null {
  const longitude = vehicle.BusPosition?.PositionLon
  const latitude = vehicle.BusPosition?.PositionLat

  return longitude != null && latitude != null ? { latitude, longitude } : null
}

function normalizePlateNumber(plateNumber: string): string {
  return plateNumber.trim().toUpperCase()
}
