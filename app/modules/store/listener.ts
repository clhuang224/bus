import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import analyticsSlice from '../slices/analyticsSlice'
import favoriteSlice from '../slices/favoriteSlice'
import routeSearchSlice from '../slices/routeSearchSlice'
import { applyAnalyticsPreference } from '../utils/analytics/applyAnalyticsPreference'
import { persistAnalyticsEnabledToStorage } from '../utils/analytics/analyticsPreferenceStorage'
import { persistFavoriteRouteStops } from '../utils/favorite/favoriteRouteStopStorage'
import { persistRouteSearchToStorage } from '../utils/routes/routeSearchStorage'
import { isWindowUnavailableError } from '../utils/shared/getLocalStorage'
import type { AppDispatch, RootState } from '.'

const favoritePersistenceListener = createListenerMiddleware()
const routeSearchPersistenceListener = createListenerMiddleware()
const analyticsPersistenceListener = createListenerMiddleware()

export const storeListenerMiddlewares = [
  favoritePersistenceListener.middleware,
  routeSearchPersistenceListener.middleware,
  analyticsPersistenceListener.middleware
] as const

export function startStoreListeners() {
  const startFavoriteListening =
    favoritePersistenceListener.startListening.withTypes<RootState, AppDispatch>()
  const startRouteSearchListening =
    routeSearchPersistenceListener.startListening.withTypes<RootState, AppDispatch>()
  const startAnalyticsListening =
    analyticsPersistenceListener.startListening.withTypes<RootState, AppDispatch>()

  startAnalyticsListening({
    actionCreator: analyticsSlice.actions.setAnalyticsEnabled,
    effect: (_, api) => {
      const previousAnalyticsEnabled = api.getOriginalState().analytics.isEnabled
      const currentAnalyticsEnabled = api.getState().analytics.isEnabled

      if (previousAnalyticsEnabled === currentAnalyticsEnabled) {
        return
      }

      applyAnalyticsPreference(currentAnalyticsEnabled)

      try {
        persistAnalyticsEnabledToStorage(currentAnalyticsEnabled)
      } catch (error) {
        if (isWindowUnavailableError(error)) {
          return
        }

        console.warn('Failed to persist analytics preference to localStorage.', error)
      }
    }
  })

  startFavoriteListening({
    matcher: isAnyOf(
      favoriteSlice.actions.setFavoriteRouteStops,
      favoriteSlice.actions.addFavoriteRouteStop,
      favoriteSlice.actions.removeFavoriteRouteStop
    ),
    effect: (_, api) => {
      const previousFavoriteRouteStops = favoriteSlice.selectors.getFavoriteRouteStops(
        api.getOriginalState()
      )
      const currentFavoriteRouteStops = favoriteSlice.selectors.getFavoriteRouteStops(
        api.getState()
      )

      if (previousFavoriteRouteStops === currentFavoriteRouteStops) {
        return
      }

      try {
        persistFavoriteRouteStops(currentFavoriteRouteStops)
      } catch (error) {
        if (isWindowUnavailableError(error)) {
          return
        }

        console.warn('Failed to persist favorite route stops to localStorage.', error)
      }
    }
  })

  startRouteSearchListening({
    matcher: isAnyOf(routeSearchSlice.actions.setSelectedArea),
    effect: (_, api) => {
      const previousSelectedArea = api.getOriginalState().routeSearch.selectedArea
      const currentRouteSearch = api.getState().routeSearch

      if (previousSelectedArea === currentRouteSearch.selectedArea) {
        return
      }

      try {
        persistRouteSearchToStorage(currentRouteSearch)
      } catch (error) {
        if (isWindowUnavailableError(error)) {
          return
        }

        console.warn('Failed to persist route search to localStorage.', error)
      }
    }
  })
}
