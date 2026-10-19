import type { CityNameType } from '@bus/shared'
import type { BusRoute, TdxBusRoute } from '../../interfaces/BusRoute'
import type { RouteShape, TdxRouteShape } from '../../interfaces/RouteShape'
import type { StopOfRoute, TdxStopOfRoute } from '../../interfaces/StopOfRoute'
import type { Stop, TdxStop } from '../../interfaces/Stop'
import { toLngLat, toLocalizedText } from './normalizeTdxFields'
import { parseRouteShapePath } from './parseRouteShapePath'

export function transformBusRoute(
  busRoute: TdxBusRoute<string>,
  city: CityNameType,
): BusRoute<string> {
  return {
    ...busRoute,
    City: busRoute.City ?? city,
    Operators: busRoute.Operators.map((operator) => ({
      ...operator,
      OperatorName: toLocalizedText(operator.OperatorName),
    })),
    RouteName: toLocalizedText(busRoute.RouteName),
    DepartureStopName: {
      'zh-TW': busRoute.DepartureStopNameZh ?? '',
      en: busRoute.DepartureStopNameEn ?? '',
      ja: '',
      ko: '',
    },
    DestinationStopName: {
      'zh-TW': busRoute.DestinationStopNameZh ?? '',
      en: busRoute.DestinationStopNameEn ?? '',
      ja: '',
      ko: '',
    },
    TicketPriceDescription: {
      'zh-TW': busRoute.TicketPriceDescriptionZh ?? '',
      en: busRoute.TicketPriceDescriptionEn ?? '',
      ja: '',
      ko: '',
    },
    FareBufferZoneDescription: {
      'zh-TW': busRoute.FareBufferZoneDescriptionZh ?? '',
      en: busRoute.FareBufferZoneDescriptionEn ?? '',
      ja: '',
      ko: '',
    },
    SubRoutes: (busRoute.SubRoutes ?? []).map((busSubRoute) => ({
      ...busSubRoute,
      FirstBusTime: busSubRoute.FirstBusTime ?? '',
      LastBusTime: busSubRoute.LastBusTime ?? '',
      HolidayFirstBusTime: busSubRoute.HolidayFirstBusTime ?? '',
      HolidayLastBusTime: busSubRoute.HolidayLastBusTime ?? '',
      DepartureStopName: {
        'zh-TW':
          busSubRoute.DepartureStopNameZh ?? busRoute.DepartureStopNameZh ?? '',
        en:
          busSubRoute.DepartureStopNameEn ?? busRoute.DepartureStopNameEn ?? '',
        ja: '',
        ko: '',
      },
      DestinationStopName: {
        'zh-TW':
          busSubRoute.DestinationStopNameZh ??
          busRoute.DestinationStopNameZh ??
          '',
        en:
          busSubRoute.DestinationStopNameEn ??
          busRoute.DestinationStopNameEn ??
          '',
        ja: '',
        ko: '',
      },
      SubRouteName: toLocalizedText(
        busSubRoute.SubRouteName,
        busRoute.RouteName,
      ),
    })),
  }
}

export function transformStopOfRoute(
  stopOfRoute: TdxStopOfRoute,
  city: CityNameType,
): StopOfRoute {
  return {
    ...stopOfRoute,
    City: city,
    RouteName: toLocalizedText(stopOfRoute.RouteName),
    SubRouteName: toLocalizedText(
      stopOfRoute.SubRouteName,
      stopOfRoute.RouteName,
    ),
    Stops: stopOfRoute.Stops.map((stop) => ({
      ...stop,
      StopName: toLocalizedText(stop.StopName),
    })),
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
    position,
  }
}

export function transformStops(stops: TdxStop[]): Stop[] {
  return stops.flatMap((stop) => {
    const transformedStop = transformStop(stop)
    return transformedStop ? [transformedStop] : []
  })
}

export function transformRouteShape(
  routeShape: TdxRouteShape,
  city: CityNameType,
): RouteShape {
  return {
    ...routeShape,
    City: city,
    RouteName: toLocalizedText(routeShape.RouteName),
    SubRouteName: routeShape.SubRouteName
      ? toLocalizedText(routeShape.SubRouteName, routeShape.RouteName)
      : null,
    path: parseRouteShapePath({
      encodedPolyline: routeShape.EncodedPolyline,
      geometry: routeShape.Geometry,
    }),
  }
}
