import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { busApi } from '../apis/bus'
import analyticsSlice from '../slices/analyticsSlice'
import cityGeoSlice, { setGeoJSON } from '../slices/cityGeoSlice'
import favoriteSlice from '../slices/favoriteSlice'
import geoSlice from '../slices/geoSlice'
import globalModalSlice from '../slices/globalModalSlice'
import localeSlice from '../slices/localeSlice'
import routeSearchSlice from '../slices/routeSearchSlice'
import { applyAnalyticsPreference } from '../utils/analytics/applyAnalyticsPreference'
import {
  startStoreListeners,
  storeListenerMiddlewares
} from './listener'
import { getPreloadedState } from './preload'

export const store = configureStore({
  reducer: {
    [busApi.reducerPath]: busApi.reducer,
    analytics: analyticsSlice.reducer,
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
    }).prepend(...storeListenerMiddlewares).concat(busApi.middleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

applyAnalyticsPreference(store.getState().analytics.isEnabled)
startStoreListeners()
setupListeners(store.dispatch)
