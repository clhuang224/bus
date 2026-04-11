import type { TFunction } from 'i18next'
import type { AlertMessageConfig } from '../interfaces/AlertMessageConfig'

interface NearbyMessages {
  loadStopsError: AlertMessageConfig
  emptyStops: AlertMessageConfig
}

interface FavoriteMessages {
  emptyFavoriteRouteStops: AlertMessageConfig
}

interface SearchMessages {
  loadRoutesError: AlertMessageConfig
  emptyRoutes: AlertMessageConfig
  emptyRouteSearch: AlertMessageConfig
}

interface RouteMessages {
  loadRouteError: AlertMessageConfig
  emptyRoute: AlertMessageConfig
}

function buildAlertMessage(
  t: TFunction,
  type: AlertMessageConfig['type'],
  key: string
): AlertMessageConfig {
  return {
    type,
    title: t(`${key}.title`),
    description: t(`${key}.description`)
  }
}

export function getNearbyMessages(t: TFunction): NearbyMessages {
  return {
    loadStopsError: buildAlertMessage(t, 'error', 'messages.nearby.loadStopsError'),
    emptyStops: buildAlertMessage(t, 'warn', 'messages.nearby.emptyStops')
  }
}

export function getFavoriteMessages(t: TFunction): FavoriteMessages {
  return {
    emptyFavoriteRouteStops: buildAlertMessage(t, 'warn', 'messages.favorite.emptyFavoriteRouteStops')
  }
}

export function getSearchMessages(t: TFunction): SearchMessages {
  return {
    loadRoutesError: buildAlertMessage(t, 'error', 'messages.search.loadRoutesError'),
    emptyRoutes: buildAlertMessage(t, 'warn', 'messages.search.emptyRoutes'),
    emptyRouteSearch: buildAlertMessage(t, 'warn', 'messages.search.emptyRouteSearch')
  }
}

export function getRouteMessages(t: TFunction): RouteMessages {
  return {
    loadRouteError: buildAlertMessage(t, 'error', 'messages.route.loadRouteError'),
    emptyRoute: buildAlertMessage(t, 'warn', 'messages.route.emptyRoute')
  }
}
