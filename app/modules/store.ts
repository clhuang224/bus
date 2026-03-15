import { configureStore } from '@reduxjs/toolkit'
import { busApi } from './apis/bus'
import favoriteSlice from './slices/favoriteSlice'
import geoSlice from './slices/geoSlice'
import cityGeoSlice, { setGeoJSON } from './slices/cityGeoSlice'
import globalModalSlice from './slices/globalModalSlice'

export const store = configureStore({
    reducer: {
        [busApi.reducerPath]: busApi.reducer,
        geolocation: geoSlice.reducer,
        favorite: favoriteSlice.reducer,
        cityGeo: cityGeoSlice.reducer,
        globalModal: globalModalSlice.reducer
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
