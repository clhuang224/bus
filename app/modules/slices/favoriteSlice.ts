import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Stop } from '../interfaces/Stop'

const favoriteSlice = createSlice({
  name: 'favorite',
  initialState: {
    stops: [] as Stop[]
  },
  reducers: {
    loadLocalStorage: (state) => {
      state.stops = JSON.parse(localStorage.getItem('favoriteStops') ?? '[]') as Stop[]
    },
    setFavoriteStops: (state, action: PayloadAction<Stop[]>) => {
      state.stops = action.payload
      localStorage.setItem('favorite', JSON.stringify(state.stops))
    },
    addFavoriteStop: (state, action: PayloadAction<Stop>) => {
      const newStop = action.payload
      if (!state.stops.map((stop) => stop.StopUID).includes(newStop.StopUID)) {
        state.stops.push(newStop)
        localStorage.setItem('favorite', JSON.stringify(state.stops))
      }
    },
    removeFavoriteStop: (state, action: PayloadAction<Stop>) => {
      const stopToRemove = action.payload
      state.stops = state.stops.filter((stop) => stop.StopUID === stopToRemove.StopUID)
      localStorage.setItem('favorite', JSON.stringify(state.stops))
    }
  },
  selectors: {
    getFavoriteStops: (state) => state.stops,
    isStopFavorite: (state, uid: string) => state.stops.map((stop) => stop.StopUID).includes(uid)
  }
})

export default favoriteSlice
