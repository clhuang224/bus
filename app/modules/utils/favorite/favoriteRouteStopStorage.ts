import type { FavoriteRouteStop } from '../../interfaces/FavoriteRouteStop'
import { normalizeStoredFavoriteRouteStop } from './normalizeStoredFavoriteRouteStop'

export const FAVORITE_ROUTE_STOPS_STORAGE_KEY = 'bus-favorite-route-stops'

function getFavoriteRouteStopStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
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
  const storage = getFavoriteRouteStopStorage()

  if (!storage) {
    return [] as FavoriteRouteStop[]
  }

  try {
    return getFavoriteRouteStopsFromStorage(storage)
  } catch (error) {
    console.warn('Failed to load favorite route stops from localStorage.', error)
    return [] as FavoriteRouteStop[]
  }
}

export function cacheFavoriteRouteStops(routeStops: FavoriteRouteStop[]) {
  const storage = getFavoriteRouteStopStorage()

  if (!storage) {
    return
  }

  try {
    setFavoriteRouteStopsInStorage(storage, routeStops)
  } catch (error) {
    console.warn('Failed to persist favorite route stops to localStorage.', error)
  }
}
