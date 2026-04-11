import type { FavoriteRouteStop } from '../../interfaces/FavoriteRouteStop'
import { normalizeStoredFavoriteRouteStop } from './normalizeStoredFavoriteRouteStop'

export const FAVORITE_ROUTE_STOPS_STORAGE_KEY = 'bus-favorite-route-stops'
const FAVORITE_ROUTE_STOP_STORAGE_UNAVAILABLE_ERROR = 'Favorite route stop storage is unavailable in this environment.'

function getFavoriteRouteStopStorage() {
  if (typeof window === 'undefined') {
    throw new Error(FAVORITE_ROUTE_STOP_STORAGE_UNAVAILABLE_ERROR)
  }

  try {
    return window.localStorage
  } catch {
    throw new Error(FAVORITE_ROUTE_STOP_STORAGE_UNAVAILABLE_ERROR)
  }
}

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

export function loadFavoriteRouteStopsFromCache() {
  try {
    const storage = getFavoriteRouteStopStorage()
    return getFavoriteRouteStopsFromStorage(storage)
  } catch (error) {
    console.warn('Failed to load favorite route stops from localStorage.', error)
    return [] as FavoriteRouteStop[]
  }
}

export function cacheFavoriteRouteStops(routeStops: FavoriteRouteStop[]) {
  try {
    const storage = getFavoriteRouteStopStorage()
    setFavoriteRouteStopsInStorage(storage, routeStops)
  } catch (error) {
    console.warn('Failed to persist favorite route stops to localStorage.', error)
  }
}
