import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { NearStop } from '../interfaces/NearStop'

export const favoriteSlice = createSlice({
  name: 'favorite',
  initialState: {
    routeStops: JSON.parse(localStorage.getItem('favorites') ?? '[]') as NearStop[]
  },
  reducers: {
    setFavoriteRouteStops: (state, action: PayloadAction<NearStop[]>) => {
      state.routeStops = action.payload
      localStorage.setItem('favorite', JSON.stringify(state.routeStops))
    },
    addFavoriteRouteStop: (state, action: PayloadAction<NearStop>) => {
      const newStop = action.payload
      if (!state.routeStops.map((stop) => stop.StopUID).includes(newStop.StopUID)) {
        state.routeStops.push(newStop)
        localStorage.setItem('favorite', JSON.stringify(state.routeStops))
      }
    },
    removeFavoriteRouteStop: (state, action: PayloadAction<NearStop>) => {
      const stopToRemove = action.payload
      state.routeStops = state.routeStops.filter((stop) => stop.StopUID === stopToRemove.StopUID)
      localStorage.setItem('favorite', JSON.stringify(state.routeStops))
    }
  },
  selectors: {
    getFavoriteRouteStops: (state) => state.routeStops,
    isRouteStopFavorite: (state, uid: string) => state.routeStops.map((stop) => stop.StopUID).includes(uid)
  }
})

export const {
  reducer: favoriteReducer,
  actions: favoriteActions,
  selectors: favoriteSelectors
} = favoriteSlice
