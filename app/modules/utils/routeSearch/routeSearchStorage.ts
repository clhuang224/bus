import { AreaType } from '../../enums/AreaType'
import type { RouteSearchState } from '../../slices/routeSearchSlice'
import { initialRouteSearchState } from '../../slices/routeSearchSlice'

export const ROUTE_SEARCH_STORAGE_KEY = 'bus-route-search'
const ROUTE_SEARCH_STORAGE_UNAVAILABLE_ERROR = 'Route search storage is unavailable in this environment.'

function getRouteSearchStorage() {
  if (typeof window === 'undefined') {
    throw new Error(ROUTE_SEARCH_STORAGE_UNAVAILABLE_ERROR)
  }

  try {
    return window.localStorage
  } catch (error) {
    throw new Error(ROUTE_SEARCH_STORAGE_UNAVAILABLE_ERROR, { cause: error })
  }
}

function isAreaType(value: unknown): value is AreaType {
  return Object.values(AreaType).includes(value as AreaType)
}

function normalizeStoredRouteSearch(value: unknown): RouteSearchState {
  if (typeof value !== 'object' || value == null) {
    return initialRouteSearchState
  }

  const storedValue = value as Partial<RouteSearchState>

  return {
    keyword: typeof storedValue.keyword === 'string' ? storedValue.keyword : initialRouteSearchState.keyword,
    selectedArea: storedValue.selectedArea == null || isAreaType(storedValue.selectedArea)
      ? (storedValue.selectedArea ?? null)
      : initialRouteSearchState.selectedArea
  }
}

export function getRouteSearchFromStorage(storage: Pick<Storage, 'getItem' | 'removeItem'>) {
  const storedValue = storage.getItem(ROUTE_SEARCH_STORAGE_KEY)

  if (!storedValue) {
    return initialRouteSearchState
  }

  try {
    return normalizeStoredRouteSearch(JSON.parse(storedValue))
  } catch {
    storage.removeItem(ROUTE_SEARCH_STORAGE_KEY)
    return initialRouteSearchState
  }
}

export function setRouteSearchInStorage(
  storage: Pick<Storage, 'setItem'>,
  routeSearch: RouteSearchState
) {
  storage.setItem(ROUTE_SEARCH_STORAGE_KEY, JSON.stringify(routeSearch))
}

export function loadRouteSearchFromStorage() {
  try {
    const storage = getRouteSearchStorage()
    return getRouteSearchFromStorage(storage)
  } catch (error) {
    console.warn('Failed to load route search from localStorage.', error)
    return initialRouteSearchState
  }
}

export function persistRouteSearchToStorage(routeSearch: RouteSearchState) {
  try {
    const storage = getRouteSearchStorage()
    setRouteSearchInStorage(storage, routeSearch)
  } catch (error) {
    console.warn('Failed to persist route search to localStorage.', error)
  }
}
