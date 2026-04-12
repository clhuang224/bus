import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { busApi } from './apis/bus'
import favoriteSlice from './slices/favoriteSlice'
import geoSlice from './slices/geoSlice'
import cityGeoSlice, { setGeoJSON } from './slices/cityGeoSlice'
import globalModalSlice from './slices/globalModalSlice'
import localeSlice from './slices/localeSlice'
import routeSearchSlice from './slices/routeSearchSlice'
import { persistFavoriteRouteStops } from './utils/favorite/favoriteRouteStopStorage'
import { persistRouteSearchToStorage } from './utils/routes/routeSearchStorage'

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

    persistFavoriteRouteStops(currentFavoriteRouteStops)
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

    persistRouteSearchToStorage(currentRouteSearch)
  }
})

setupListeners(store.dispatch)
