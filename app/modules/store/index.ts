import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { busApi } from '../apis/bus'
import cityGeoSlice, { setGeoJSON } from '../slices/cityGeoSlice'
import favoriteSlice from '../slices/favoriteSlice'
import geoSlice from '../slices/geoSlice'
import globalModalSlice from '../slices/globalModalSlice'
import localeSlice from '../slices/localeSlice'
import routeSearchSlice from '../slices/routeSearchSlice'
import { persistFavoriteRouteStops } from '../utils/favorite/favoriteRouteStopStorage'
import { persistRouteSearchToStorage } from '../utils/routes/routeSearchStorage'
import { isWindowUnavailableError } from '../utils/shared/getLocalStorage'
import { getPreloadedState } from './preload'

const favoritePersistenceListener = createListenerMiddleware()

export const store = configureStore({
  reducer: {
    [busApi.reducerPath]: busApi.reducer,
    geolocation: geoSlice.reducer,
    favorite: favoriteSlice.reducer,
    cityGeo: cityGeoSlice.reducer,
    globalModal: globalModalSlice.reducer,
    locale: localeSlice.reducer,
    routeSearch: routeSearchSlice.reducer
  },
  preloadedState: getPreloadedState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 64,
        ignoredActions: [setGeoJSON.type],
        ignoredPaths: ['cityGeo.geojson', busApi.reducerPath]
      }
    }).prepend(favoritePersistenceListener.middleware).concat(busApi.middleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

const startAppListening =
  favoritePersistenceListener.startListening.withTypes<RootState, AppDispatch>()

startAppListening({
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

startAppListening({
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

setupListeners(store.dispatch)
