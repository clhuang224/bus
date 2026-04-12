import type { FavoriteRouteStop } from '../../interfaces/FavoriteRouteStop'
import { getLocalStorage } from '../shared/getLocalStorage'
import { normalizeStoredFavoriteRouteStop } from './normalizeStoredFavoriteRouteStop'

export const FAVORITE_ROUTE_STOPS_STORAGE_KEY = 'bus-favorite-route-stops'

export function getFavoriteRouteStopsFromStorage(storage: Pick<Storage, 'getItem' | 'removeItem'>) {
  const storedValue = storage.getItem(FAVORITE_ROUTE_STOPS_STORAGE_KEY)

  if (!storedValue) {
    return [] as FavoriteRouteStop[]
  }

  let parsedValue: unknown

  try {
    parsedValue = JSON.parse(storedValue)
  } catch {
    storage.removeItem(FAVORITE_ROUTE_STOPS_STORAGE_KEY)
    return [] as FavoriteRouteStop[]
  }

  if (!Array.isArray(parsedValue)) {
    return [] as FavoriteRouteStop[]
  }

  return parsedValue.flatMap((item) => {
    const favoriteRouteStop = normalizeStoredFavoriteRouteStop(item)

    return favoriteRouteStop ? [favoriteRouteStop] : []
  })
}

export function setFavoriteRouteStopsInStorage(
  storage: Pick<Storage, 'setItem'>,
  routeStops: FavoriteRouteStop[]
) {
  storage.setItem(FAVORITE_ROUTE_STOPS_STORAGE_KEY, JSON.stringify(routeStops))
}

export function loadFavoriteRouteStopsFromStorage() {
  const storage = getLocalStorage()
  return getFavoriteRouteStopsFromStorage(storage)
}

export function persistFavoriteRouteStops(routeStops: FavoriteRouteStop[]) {
  const storage = getLocalStorage()
  setFavoriteRouteStopsInStorage(storage, routeStops)
}
