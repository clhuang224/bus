import { configureStore } from '@reduxjs/toolkit'
import { busApi } from './apis/bus'
import favoriteSlice from './slices/favoriteSlice'
import geolocationSlice from './slices/geolocationSlice'
import cityGeoSlice, { setGeoJSON } from './slices/cityGeoSlice'

export const store = configureStore({
    reducer: {
        [busApi.reducerPath]: busApi.reducer,
        geolocation: geolocationSlice.reducer,
        favorite: favoriteSlice.reducer,
        cityGeo: cityGeoSlice.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                warnAfter: 64,
                ignoredActions: [setGeoJSON.type],
                ignoredPaths: ['cityGeo.geojson', busApi.reducerPath]
            }
        }).concat(busApi.middleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
