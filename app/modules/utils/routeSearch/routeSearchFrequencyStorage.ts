import { getLocalStorage } from '../shared/getLocalStorage'

export const ROUTE_SEARCH_FREQUENCY_STORAGE_KEY = 'bus-route-search-frequency'

const MAX_ROUTE_SEARCH_FREQUENCY_ENTRIES = 100

export type RouteSearchFrequencyMap = Record<string, number>

function normalizeRouteSearchFrequencyMap(value: unknown): RouteSearchFrequencyMap {
  if (typeof value !== 'object' || value == null || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(([routeUID, count]) =>
      routeUID.length > 0 && typeof count === 'number' && Number.isFinite(count) && count > 0
    )
  )
}

function trimRouteSearchFrequencyMap(routeSearchFrequencyMap: RouteSearchFrequencyMap) {
  return Object.fromEntries(
    Object.entries(routeSearchFrequencyMap)
      .sort((left, right) => {
        const countDiff = right[1] - left[1]
        if (countDiff !== 0) {
          return countDiff
        }

        return left[0].localeCompare(right[0])
      })
      .slice(0, MAX_ROUTE_SEARCH_FREQUENCY_ENTRIES)
  )
}

export function getRouteSearchFrequencyFromStorage(storage: Pick<Storage, 'getItem' | 'removeItem'>) {
  const storedValue = storage.getItem(ROUTE_SEARCH_FREQUENCY_STORAGE_KEY)

  if (!storedValue) {
    return {} as RouteSearchFrequencyMap
  }

  try {
    return trimRouteSearchFrequencyMap(normalizeRouteSearchFrequencyMap(JSON.parse(storedValue)))
  } catch {
    storage.removeItem(ROUTE_SEARCH_FREQUENCY_STORAGE_KEY)
    return {} as RouteSearchFrequencyMap
  }
}

export function setRouteSearchFrequencyInStorage(
  storage: Pick<Storage, 'setItem'>,
  routeSearchFrequencyMap: RouteSearchFrequencyMap
) {
  storage.setItem(
    ROUTE_SEARCH_FREQUENCY_STORAGE_KEY,
    JSON.stringify(trimRouteSearchFrequencyMap(routeSearchFrequencyMap))
  )
}

export function loadRouteSearchFrequencyFromStorage() {
  try {
    const storage = getLocalStorage()
    return getRouteSearchFrequencyFromStorage(storage)
  } catch (error) {
    console.warn('Failed to load route search frequency from localStorage.', error)
    return {} as RouteSearchFrequencyMap
  }
}

export function incrementRouteSearchFrequency(routeUID: string) {
  if (!routeUID) {
    return
  }

  try {
    const storage = getLocalStorage()
    const routeSearchFrequencyMap = getRouteSearchFrequencyFromStorage(storage)

    setRouteSearchFrequencyInStorage(storage, {
      ...routeSearchFrequencyMap,
      [routeUID]: (routeSearchFrequencyMap[routeUID] ?? 0) + 1
    })
  } catch (error) {
    console.warn('Failed to persist route search frequency to localStorage.', error)
  }
}
