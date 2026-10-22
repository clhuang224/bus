import { DirectionType } from '../enums/DirectionType.js'
import { RealtimeArrivalStatus } from '../enums/RealtimeArrivalStatus.js'
import { RealtimeSourceFailure } from '../enums/RealtimeSourceFailure.js'
import { RealtimeVehicleState } from '../enums/RealtimeVehicleState.js'
import { RouteRealtimeStatus } from '../enums/RouteRealtimeStatus.js'
import { TdxA2EventType } from '../enums/TdxA2EventType.js'
import { TdxStopStatus } from '../enums/TdxStopStatus.js'
import type {
  ApiRealtimeArrival,
  ApiRouteRealtime,
  ApiRouteRealtimeStop,
  ApiRouteRealtimeSubRoute,
  ApiRouteRealtimeVehicle,
} from '../types/RouteRealtime.js'
import type { ApiPosition } from '../types/Station.js'
import type {
  TdxEstimatedArrival,
  TdxRealtimeByFrequency,
  TdxRealtimeNearStop,
} from '../types/tdx/index.js'

export interface RealtimeRouteStop {
  uuid: string
  tdxStopId: string
  sequence: number
}

export interface RealtimeRouteSubRoute {
  uuid: string
  tdxSubRouteUid: string
  direction: DirectionType
  stops: RealtimeRouteStop[]
}

export interface RealtimeRoute {
  uuid: string
  subRoutes: RealtimeRouteSubRoute[]
}

export type RealtimeSourceResult<T> =
  | { ok: true; data: T[] }
  | { ok: false; failure: RealtimeSourceFailure }

export interface RealtimeSources {
  estimatedArrivals: RealtimeSourceResult<TdxEstimatedArrival>
  nearStops: RealtimeSourceResult<TdxRealtimeNearStop>
  positions: RealtimeSourceResult<TdxRealtimeByFrequency>
}

interface Arrival {
  plateNumber: string | null
  stopUID: string | null
  stopID: string | null
  subRouteUID: string | null
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

const VEHICLE_FALLBACK_STOP_STATUSES = [
  TdxStopStatus.NOT_YET_DEPARTED,
  TdxStopStatus.LAST_BUS_PASSED,
  TdxStopStatus.UNKNOWN,
]

const IN_SERVICE_ARRIVAL: ApiRealtimeArrival = {
  status: RealtimeArrivalStatus.IN_SERVICE,
  minutes: null,
}

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
      calculateSubRoute(subRoute, arrivals, nearStops, positions, routeStatus),
    ),
    updated_at: updatedAt.toISOString(),
  }
}

function calculateSubRoute(
  subRoute: RealtimeRouteSubRoute,
  arrivals: Arrival[],
  nearStops: TdxRealtimeNearStop[],
  positions: TdxRealtimeByFrequency[],
  routeStatus: RouteRealtimeStatus | null,
): ApiRouteRealtimeSubRoute {
  const activeArrivals = getActiveArrivals(subRoute, arrivals)
  const activeNearStops = nearStops.filter(
    (nearStop) =>
      nearStop.SubRouteUID === subRoute.tdxSubRouteUid &&
      nearStop.Direction === subRoute.direction,
  )
  const nearStopVehicles = getNearStopVehicles(
    activeNearStops,
    activeArrivals.filter(hasKnownDirection),
    subRoute.stops,
  )

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
  return {
    plateNumber: arrival.PlateNumb
      ? normalizePlateNumber(arrival.PlateNumb)
      : null,
    stopUID: arrival.StopUID ?? null,
    stopID: arrival.StopID ?? null,
    subRouteUID: arrival.SubRouteUID ?? null,
    direction: arrival.Direction,
    sequence: arrival.StopSequence ?? null,
    estimateSeconds: arrival.EstimateTime ?? null,
    stopStatus: arrival.StopStatus ?? TdxStopStatus.UNKNOWN,
  }
}

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

function getActiveArrivals(
  subRoute: RealtimeRouteSubRoute,
  arrivals: Arrival[],
): Arrival[] {
  const subRouteArrivals = arrivals.filter(
    (arrival) =>
      arrival.subRouteUID === subRoute.tdxSubRouteUid &&
      (arrival.direction === subRoute.direction || !hasKnownDirection(arrival)),
  )

  if (subRouteArrivals.length > 0) return subRouteArrivals

  return arrivals.filter(
    (arrival) =>
      arrival.subRouteUID == null && arrival.direction === subRoute.direction,
  )
}

function hasKnownDirection(arrival: Arrival): boolean {
  return arrival.direction !== DirectionType.UNKNOWN
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

function getStopArrivals(
  stops: RealtimeRouteStop[],
  activeArrivals: Arrival[],
): ApiRouteRealtimeStop[] {
  const sortedArrivals = [...activeArrivals].sort((left, right) => {
    const directionOrder =
      Number(!hasKnownDirection(left)) - Number(!hasKnownDirection(right))

    if (directionOrder !== 0) return directionOrder
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
    for (const stopKey of [arrival.stopUID, arrival.stopID]) {
      if (!stopKey) continue

      for (const key of [
        arrival.sequence == null ? null : toVisitKey(stopKey, arrival.sequence),
        stopKey,
      ]) {
        if (key && !arrivalsByStopKey.has(key)) {
          arrivalsByStopKey.set(key, arrival)
        }
      }
    }
  }

  return stops.map((stop) => {
    const arrival =
      arrivalsByStopKey.get(toVisitKey(stop.uuid, stop.sequence)) ??
      arrivalsByStopKey.get(toVisitKey(stop.tdxStopId, stop.sequence)) ??
      arrivalsByStopKey.get(stop.uuid) ??
      arrivalsByStopKey.get(stop.tdxStopId)

    return {
      uuid: stop.uuid,
      arrival: arrival
        ? toApiArrival(arrival.estimateSeconds, arrival.stopStatus)
        : null,
    }
  })
}

function toVisitKey(stopKey: string, sequence: number): string {
  return `${stopKey}#${sequence}`
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
  stops: RealtimeRouteStop[],
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
            uuid: resolveStopUuid(nearStop, stops),
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

function resolveStopUuid(
  nearStop: TdxRealtimeNearStop,
  stops: RealtimeRouteStop[],
): string | null {
  const candidates = stops.filter(
    (stop) =>
      (!!nearStop.StopUID && stop.uuid === nearStop.StopUID) ||
      (!!nearStop.StopID && stop.tdxStopId === nearStop.StopID),
  )
  const stop =
    candidates.find(({ sequence }) => sequence === nearStop.StopSequence) ??
    candidates.at(0)

  return stop?.uuid ?? (nearStop.StopUID || null)
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

function getVehicleArrival(
  nearStop: TdxRealtimeNearStop,
  plateNumber: string,
  state: RealtimeVehicleState,
  activeArrivals: Arrival[],
): Arrival | undefined {
  const plateArrival = activeArrivals.find(
    (arrival) => arrival.plateNumber === plateNumber,
  )
  const isSameStop = (arrival: Arrival) =>
    (!!nearStop.StopUID && arrival.stopUID === nearStop.StopUID) ||
    (!!nearStop.StopID && arrival.stopID === nearStop.StopID)
  const isSameSequence = (arrival: Arrival) =>
    arrival.sequence != null && arrival.sequence === nearStop.StopSequence
  const stopArrival =
    activeArrivals.find(
      (arrival) => isSameStop(arrival) && isSameSequence(arrival),
    ) ??
    activeArrivals.find(isSameStop) ??
    activeArrivals.find(isSameSequence)
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

function withPositions(
  nearStopVehicles: NearStopVehicle[],
  subRoute: RealtimeRouteSubRoute,
  positions: TdxRealtimeByFrequency[],
): ApiRouteRealtimeVehicle[] {
  const matchedPositions = new Map<string, GpsPosition>()
  const compatiblePositions = new Map<string, GpsPosition>()

  for (const vehicle of positions) {
    const position = toApiPosition(vehicle)
    if (!position) continue

    const plateNumber = normalizePlateNumber(vehicle.PlateNumb)
    const gpsPosition = { plateNumber: vehicle.PlateNumb, position }
    const isSameSubRoute = vehicle.SubRouteUID === subRoute.tdxSubRouteUid
    const isSameDirection = vehicle.Direction === subRoute.direction

    if (isSameSubRoute && isSameDirection) {
      setFirst(matchedPositions, plateNumber, gpsPosition)
    } else if (
      (vehicle.SubRouteUID == null || isSameSubRoute) &&
      (vehicle.Direction == null || isSameDirection)
    ) {
      setFirst(compatiblePositions, plateNumber, gpsPosition)
    }
  }

  const nearStopPlates = new Set(
    nearStopVehicles.map(({ plateNumber }) => plateNumber),
  )
  const gpsOnlyVehicles = [...matchedPositions]
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
      position:
        (
          matchedPositions.get(plateNumber) ??
          compatiblePositions.get(plateNumber)
        )?.position ?? null,
    })),
    ...gpsOnlyVehicles,
  ]
}

interface GpsPosition {
  plateNumber: string
  position: ApiPosition
}

function setFirst<K, V>(map: Map<K, V>, key: K, value: V): void {
  if (!map.has(key)) map.set(key, value)
}

function toApiPosition(vehicle: TdxRealtimeByFrequency): ApiPosition | null {
  const longitude = vehicle.BusPosition?.PositionLon
  const latitude = vehicle.BusPosition?.PositionLat

  return longitude != null && latitude != null ? { latitude, longitude } : null
}

function normalizePlateNumber(plateNumber: string): string {
  return plateNumber.trim().toUpperCase()
}
