import type { CityNameType } from '../../enums/CityNameType'
import type { BusRoute, TdxBusRoute } from '../../interfaces/BusRoute'
import type { EstimatedArrival, TdxEstimatedArrival } from '../../interfaces/EstimatedArrival'
import type { RealtimeNearStop, TdxRealtimeNearStop } from '../../interfaces/RealtimeNearStop'
import type { RouteShape, TdxRouteShape } from '../../interfaces/RouteShape'
import type { StopOfRoute, TdxStopOfRoute } from '../../interfaces/StopOfRoute'
import type { Stop, TdxStop } from '../../interfaces/Stop'
import { toLngLat, toLocalizedText } from './normalizeTdxFields'
import { parseRouteShapePath } from './parseRouteShapePath'

export function transformEstimatedArrival(
  estimatedArrival: TdxEstimatedArrival,
  city: CityNameType
): EstimatedArrival {
  const routeUID = estimatedArrival.RouteUID ?? ''

  return {
    ...estimatedArrival,
    City: city,
    RouteUID: routeUID,
    RouteID: estimatedArrival.RouteID ?? null,
    RouteName: toLocalizedText(estimatedArrival.RouteName),
    StopName: toLocalizedText(estimatedArrival.StopName),
    StopStatus: estimatedArrival.StopStatus ?? 255,
    SubRouteUID: estimatedArrival.SubRouteUID ?? routeUID,
    SubRouteID: estimatedArrival.SubRouteID ?? estimatedArrival.RouteID ?? null,
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
      'zh-TW': busRoute.DepartureStopNameZh ?? '',
      en: busRoute.DepartureStopNameEn ?? ''
    },
    DestinationStopName: {
      'zh-TW': busRoute.DestinationStopNameZh ?? '',
      en: busRoute.DestinationStopNameEn ?? ''
    },
    TicketPriceDescription: {
      'zh-TW': busRoute.TicketPriceDescriptionZh ?? '',
      en: busRoute.TicketPriceDescriptionEn ?? ''
    },
    FareBufferZoneDescription: {
      'zh-TW': busRoute.FareBufferZoneDescriptionZh ?? '',
      en: busRoute.FareBufferZoneDescriptionEn ?? ''
    },
    SubRoutes: (busRoute.SubRoutes ?? []).map((busSubRoute) => ({
      ...busSubRoute,
      DepartureStopName: {
        'zh-TW': busSubRoute.DepartureStopNameZh ?? busRoute.DepartureStopNameZh ?? '',
        en: busSubRoute.DepartureStopNameEn ?? busRoute.DepartureStopNameEn ?? ''
      },
      DestinationStopName: {
        'zh-TW': busSubRoute.DestinationStopNameZh ?? busRoute.DestinationStopNameZh ?? '',
        en: busSubRoute.DestinationStopNameEn ?? busRoute.DestinationStopNameEn ?? ''
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

export function transformStops(stops: TdxStop[]): Stop[] {
  return stops.flatMap((stop) => {
    const transformedStop = transformStop(stop)
    return transformedStop ? [transformedStop] : []
  })
}

export function transformRealtimeNearStop(
  realtimeNearStop: TdxRealtimeNearStop,
  city: CityNameType
): RealtimeNearStop {
  return {
    ...realtimeNearStop,
    City: city,
    RouteName: toLocalizedText(realtimeNearStop.RouteName),
    StopName: toLocalizedText(realtimeNearStop.StopName),
    SubRouteName: toLocalizedText(realtimeNearStop.SubRouteName, realtimeNearStop.RouteName),
    position: toLngLat(realtimeNearStop.BusPosition)
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
