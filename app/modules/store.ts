import { configureStore } from '@reduxjs/toolkit'
import { busApi } from './apis/bus'
import { geolocationReducer } from './slices/geolocationSlice' 

export const store = configureStore({
    reducer: {
        [busApi.reducerPath]: busApi.reducer,
        geolocationReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(busApi.middleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
