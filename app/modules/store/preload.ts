import { DEFAULT_APP_LOCALE } from '../consts/i18n'
import { getLocaleFromStorage } from '../i18n/locale'
import type { AppLocaleType } from '../enums/AppLocaleType'
import routeSearchSlice from '../slices/routeSearchSlice'
import { loadFavoriteRouteStopsFromStorage } from '../utils/favorite/favoriteRouteStopStorage'
import { loadRouteSearchFromStorage } from '../utils/routes/routeSearchStorage'
import { getLocalStorage, isWindowUnavailableError } from '../utils/shared/getLocalStorage'

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

function getPreloadedLocale(): AppLocaleType {
  try {
    return getLocaleFromStorage(getLocalStorage())
  } catch (error) {
    if (!isWindowUnavailableError(error)) {
      console.warn('Failed to load app locale from localStorage.', error)
    }

    return DEFAULT_APP_LOCALE
  }
}

export function getPreloadedState() {
  return {
    favorite: {
      routeStops: getPreloadedFavoriteRouteStops()
    },
    routeSearch: getPreloadedRouteSearch(),
    locale: {
      value: getPreloadedLocale()
    }
  }
}
