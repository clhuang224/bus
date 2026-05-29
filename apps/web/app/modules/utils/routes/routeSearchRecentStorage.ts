import { getLocalStorage } from '../shared/getLocalStorage'

export const ROUTE_SEARCH_RECENT_STORAGE_KEY = 'bus-route-search-recent-viewed'
const MAX_ROUTE_SEARCH_RECENT_ROUTES = 100

function normalizeRecentRouteUIDs(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[]
  }

  return Array.from(
    new Set(value.filter((routeUID): routeUID is string => typeof routeUID === 'string' && routeUID.length > 0))
  ).slice(0, MAX_ROUTE_SEARCH_RECENT_ROUTES)
}

export function getRouteSearchRecentFromStorage(storage: Pick<Storage, 'getItem' | 'removeItem'>) {
  const storedValue = storage.getItem(ROUTE_SEARCH_RECENT_STORAGE_KEY)

  if (!storedValue) {
    return [] as string[]
  }

  try {
    return normalizeRecentRouteUIDs(JSON.parse(storedValue))
  } catch {
    storage.removeItem(ROUTE_SEARCH_RECENT_STORAGE_KEY)
    return [] as string[]
  }
}

export function setRouteSearchRecentInStorage(
  storage: Pick<Storage, 'setItem'>,
  recentRouteUIDs: string[]
) {
  storage.setItem(
    ROUTE_SEARCH_RECENT_STORAGE_KEY,
    JSON.stringify(normalizeRecentRouteUIDs(recentRouteUIDs))
  )
}

export function loadRouteSearchRecentFromStorage() {
  try {
    const storage = getLocalStorage()
    return getRouteSearchRecentFromStorage(storage)
  } catch (error) {
    console.warn('Failed to load recently viewed routes from localStorage.', error)
    return [] as string[]
  }
}

export function saveRouteSearchRecent(routeUID: string) {
  if (!routeUID) {
    return
  }

  try {
    const storage = getLocalStorage()
    const recentRouteUIDs = getRouteSearchRecentFromStorage(storage)

    setRouteSearchRecentInStorage(storage, [
      routeUID,
      ...recentRouteUIDs.filter((storedRouteUID) => storedRouteUID !== routeUID)
    ])
  } catch (error) {
    console.warn('Failed to persist recently viewed routes to localStorage.', error)
  }
}
