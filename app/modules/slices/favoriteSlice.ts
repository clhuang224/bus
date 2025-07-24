import { createSlice } from '@reduxjs/toolkit'

export const favoriteSlice = createSlice({
  name: 'favorite',
  initialState: {
    routeIds: JSON.parse(localStorage.getItem('favoriteRouteIds') ?? '[]') as string[]
  },
  reducers: {
    setFavoriteRouteIds: (state, action) => {
      state.routeIds = action.payload
      localStorage.setItem('favoriteRouteIds', JSON.stringify(state.routeIds))
    }
  },
  selectors: {
    getFavoriteRouteIds: (state) => state.routeIds,
    isRouteIdFavorite: (state, routeId) => state.routeIds.includes(routeId)
  }
})

export const {
  reducer: favoriteReducer,
  actions: favoriteActions,
  selectors: favoriteSelectors
} = favoriteSlice
