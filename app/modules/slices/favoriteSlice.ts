import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FavoriteRouteStop } from '../interfaces/FavoriteRouteStop'

const FAVORITE_ROUTE_STOPS_STORAGE_KEY = 'favoriteRouteStops'

function loadStoredFavoriteRouteStops() {
  const storedValue = localStorage.getItem(FAVORITE_ROUTE_STOPS_STORAGE_KEY)
  if (!storedValue) return [] as FavoriteRouteStop[]

  const parsedValue = JSON.parse(storedValue) as unknown
  if (!Array.isArray(parsedValue)) return [] as FavoriteRouteStop[]

  return parsedValue.filter((item): item is FavoriteRouteStop =>
    typeof item === 'object' &&
    item !== null &&
    'favoriteId' in item &&
    typeof item.favoriteId === 'string'
  )
}

function persistFavoriteRouteStops(routeStops: FavoriteRouteStop[]) {
  localStorage.setItem(FAVORITE_ROUTE_STOPS_STORAGE_KEY, JSON.stringify(routeStops))
}

const favoriteSlice = createSlice({
  name: 'favorite',
  initialState: {
    routeStops: [] as FavoriteRouteStop[]
  },
  reducers: {
    loadLocalStorage: (state) => {
      state.routeStops = loadStoredFavoriteRouteStops()
    },
    setFavoriteRouteStops: (state, action: PayloadAction<FavoriteRouteStop[]>) => {
      state.routeStops = action.payload
      persistFavoriteRouteStops(state.routeStops)
    },
    addFavoriteRouteStop: (state, action: PayloadAction<FavoriteRouteStop>) => {
      const newRouteStop = action.payload
      if (!state.routeStops.some((routeStop) => routeStop.favoriteId === newRouteStop.favoriteId)) {
        state.routeStops.push(newRouteStop)
        persistFavoriteRouteStops(state.routeStops)
      }
    },
    removeFavoriteRouteStop: (state, action: PayloadAction<FavoriteRouteStop>) => {
      const routeStopToRemove = action.payload
      state.routeStops = state.routeStops.filter((routeStop) => routeStop.favoriteId !== routeStopToRemove.favoriteId)
      persistFavoriteRouteStops(state.routeStops)
    }
  },
  selectors: {
    getFavoriteRouteStops: (state) => state.routeStops,
    isRouteStopFavorite: (state, favoriteId: string) =>
      state.routeStops.some((routeStop) => routeStop.favoriteId === favoriteId)
  }
})

export default favoriteSlice
