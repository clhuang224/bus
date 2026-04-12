import { AreaType } from '../../enums/AreaType'
import type { RouteSearchState } from '../../slices/routeSearchSlice'
import { initialRouteSearchState } from '../../slices/routeSearchSlice'
import { getLocalStorage } from '../shared/getLocalStorage'

export const ROUTE_SEARCH_STORAGE_KEY = 'bus-route-search'

interface RouteSearchStorage {
  selectedArea: AreaType | null
}

function isAreaType(value: unknown): value is AreaType {
  return Object.values(AreaType).includes(value as AreaType)
}

function normalizeStoredRouteSearch(value: unknown): RouteSearchState {
  if (typeof value !== 'object' || value == null) {
    return initialRouteSearchState
  }

  const storedValue = value as Partial<RouteSearchStorage>

  return {
    keyword: initialRouteSearchState.keyword,
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
  storage.setItem(ROUTE_SEARCH_STORAGE_KEY, JSON.stringify({
    selectedArea: routeSearch.selectedArea
  } satisfies RouteSearchStorage))
}

export function loadRouteSearchFromStorage() {
  try {
    const storage = getLocalStorage()
    return getRouteSearchFromStorage(storage)
  } catch (error) {
    console.warn('Failed to load route search from localStorage.', error)
    return initialRouteSearchState
  }
}

export function persistRouteSearchToStorage(routeSearch: RouteSearchState) {
  try {
    const storage = getLocalStorage()
    setRouteSearchInStorage(storage, routeSearch)
  } catch (error) {
    console.warn('Failed to persist route search to localStorage.', error)
  }
}
