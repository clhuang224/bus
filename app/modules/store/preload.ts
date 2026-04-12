import routeSearchSlice from '../slices/routeSearchSlice'
import { loadFavoriteRouteStopsFromStorage } from '../utils/favorite/favoriteRouteStopStorage'
import { loadRouteSearchFromStorage } from '../utils/routes/routeSearchStorage'
import { isWindowUnavailableError } from '../utils/shared/getLocalStorage'

function getPreloadedFavoriteRouteStops() {
  try {
    return loadFavoriteRouteStopsFromStorage()
  } catch (error) {
    if (!isWindowUnavailableError(error)) {
      console.warn('Failed to load favorite route stops from localStorage.', error)
    }

    return []
  }
}

function getPreloadedRouteSearch() {
  try {
    return loadRouteSearchFromStorage()
  } catch (error) {
    if (!isWindowUnavailableError(error)) {
      console.warn('Failed to load route search from localStorage.', error)
    }

    return routeSearchSlice.getInitialState()
  }
}

export function getPreloadedState() {
  return {
    favorite: {
      routeStops: getPreloadedFavoriteRouteStops()
    },
    routeSearch: getPreloadedRouteSearch()
  }
}
