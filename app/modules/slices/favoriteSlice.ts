import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FavoriteRouteStop } from '../interfaces/FavoriteRouteStop'

const favoriteSlice = createSlice({
  name: 'favorite',
  initialState: {
    routeStops: [] as FavoriteRouteStop[]
  },
  reducers: {
    restoreFavoriteRouteStopsFromCache: (state, action: PayloadAction<FavoriteRouteStop[]>) => {
      state.routeStops = action.payload
    },
    setFavoriteRouteStops: (state, action: PayloadAction<FavoriteRouteStop[]>) => {
      state.routeStops = action.payload
    },
    addFavoriteRouteStop: (state, action: PayloadAction<FavoriteRouteStop>) => {
      const newRouteStop = action.payload
      if (!state.routeStops.some((routeStop) => routeStop.favoriteId === newRouteStop.favoriteId)) {
        state.routeStops.push(newRouteStop)
      }
    },
    removeFavoriteRouteStop: (state, action: PayloadAction<FavoriteRouteStop>) => {
      const routeStopToRemove = action.payload
      state.routeStops = state.routeStops.filter((routeStop) => routeStop.favoriteId !== routeStopToRemove.favoriteId)
    }
  },
  selectors: {
    getFavoriteRouteStops: (state) => state.routeStops,
    isRouteStopFavorite: (state, favoriteId: string) =>
      state.routeStops.some((routeStop) => routeStop.favoriteId === favoriteId)
  }
})

export default favoriteSlice
