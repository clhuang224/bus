import { configureStore } from '@reduxjs/toolkit'
import { busApi } from './apis/bus'
import { geolocationReducer } from './slices/geolocationSlice'
import { favoriteReducer } from './slices/favoriteSlice'

export const store = configureStore({
    reducer: {
        [busApi.reducerPath]: busApi.reducer,
        geolocationReducer,
        favoriteReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(busApi.middleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
