import type { ApiRouteSummary } from '@bus/shared'
import type { BusRoute } from '../../interfaces/BusRoute'
import type { RouteSummary } from '../../interfaces/RouteSummary'
import { toLocalizedText } from '../i18n/toLocalizedText'

export function toRouteSummaryFromTdx(route: BusRoute<string>): RouteSummary {
  return {
    routeUID: route.RouteUID,
    city: route.City,
    name: route.RouteName,
    departure: route.DepartureStopName,
    destination: route.DestinationStopName,
  }
}

export function toRouteSummaryFromApi(route: ApiRouteSummary): RouteSummary {
  return {
    routeUID: route.uuid,
    city: route.city,
    name: toLocalizedText(route.name),
    departure: toLocalizedText(route.departure),
    destination: toLocalizedText(route.destination),
  }
}
