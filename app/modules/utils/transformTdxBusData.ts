import type { CityNameType } from '../enums/CityNameType'
import type { BusRoute, TdxBusRoute } from '../interfaces/BusRoute'
import type { EstimatedArrival, TdxEstimatedArrival } from '../interfaces/EstimatedArrival'
import type { RealtimeNearStop, TdxRealtimeNearStop } from '../interfaces/RealtimeNearStop'
import type { RouteShape, TdxRouteShape } from '../interfaces/RouteShape'
import type { StopOfRoute, TdxStopOfRoute } from '../interfaces/StopOfRoute'
import type { Stop, TdxStop } from '../interfaces/Stop'
import { toLngLat, toLocalizedText } from './normalizeTdxFields'
import { parseRouteShapePath } from './parseRouteShapePath'

export function transformEstimatedArrival(
  estimatedArrival: TdxEstimatedArrival,
  city: CityNameType
): EstimatedArrival {
  return {
    ...estimatedArrival,
    City: city,
    RouteName: toLocalizedText(estimatedArrival.RouteName),
    StopName: toLocalizedText(estimatedArrival.StopName),
    SubRouteName: toLocalizedText(estimatedArrival.SubRouteName, estimatedArrival.RouteName)
  }
}

export function transformBusRoute(busRoute: TdxBusRoute<string>): BusRoute<string> {
  return {
    ...busRoute,
    Operators: busRoute.Operators.map((operator) => ({
      ...operator,
      OperatorName: toLocalizedText(operator.OperatorName)
    })),
    RouteName: toLocalizedText(busRoute.RouteName),
    DepartureStopName: {
      zh_TW: busRoute.DepartureStopNameZh,
      en: busRoute.DepartureStopNameEn
    },
    DestinationStopName: {
      zh_TW: busRoute.DestinationStopNameZh,
      en: busRoute.DestinationStopNameEn
    },
    TicketPriceDescription: {
      zh_TW: busRoute.TicketPriceDescriptionZh,
      en: busRoute.TicketPriceDescriptionEn
    },
    FareBufferZoneDescription: {
      zh_TW: busRoute.FareBufferZoneDescriptionZh,
      en: busRoute.FareBufferZoneDescriptionEn
    },
    SubRoutes: (busRoute.SubRoutes ?? []).map((busSubRoute) => ({
      ...busSubRoute,
      DepartureStopName: {
        zh_TW: busSubRoute.DepartureStopNameZh,
        en: busSubRoute.DepartureStopNameEn
      },
      DestinationStopName: {
        zh_TW: busSubRoute.DestinationStopNameZh,
        en: busSubRoute.DestinationStopNameEn
      },
      SubRouteName: toLocalizedText(busSubRoute.SubRouteName, busRoute.RouteName)
    }))
  }
}

export function transformStopOfRoute(
  stopOfRoute: TdxStopOfRoute,
  city: CityNameType
): StopOfRoute {
  return {
    ...stopOfRoute,
    City: city,
    RouteName: toLocalizedText(stopOfRoute.RouteName),
    SubRouteName: toLocalizedText(stopOfRoute.SubRouteName, stopOfRoute.RouteName),
    Stops: stopOfRoute.Stops.map((stop) => ({
      ...stop,
      StopName: toLocalizedText(stop.StopName)
    }))
  }
}

export function transformStop(stop: TdxStop): Stop | null {
  const position = toLngLat(stop.StopPosition)
  if (position == null) {
    return null
  }

  return {
    ...stop,
    StopName: toLocalizedText(stop.StopName),
    GeoHash: stop.StopPosition.GeoHash ?? null,
    City: stop.City || null,
    position
  }
}

export function transformRealtimeNearStop(
  realtimeNearStop: TdxRealtimeNearStop,
  city: CityNameType
): RealtimeNearStop | null {
  const position = toLngLat(realtimeNearStop.BusPosition)
  if (position == null) {
    return null
  }

  return {
    ...realtimeNearStop,
    City: city,
    RouteName: toLocalizedText(realtimeNearStop.RouteName),
    StopName: toLocalizedText(realtimeNearStop.StopName),
    SubRouteName: toLocalizedText(realtimeNearStop.SubRouteName, realtimeNearStop.RouteName),
    position
  }
}

export function transformRouteShape(routeShape: TdxRouteShape, city: CityNameType): RouteShape {
  return {
    ...routeShape,
    City: city,
    RouteName: toLocalizedText(routeShape.RouteName),
    SubRouteName: routeShape.SubRouteName
      ? toLocalizedText(routeShape.SubRouteName, routeShape.RouteName)
      : null,
    path: parseRouteShapePath({
      encodedPolyline: routeShape.EncodedPolyline,
      geometry: routeShape.Geometry
    })
  }
}
