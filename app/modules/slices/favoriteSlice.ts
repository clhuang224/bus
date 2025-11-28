import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { NearStop } from '../interfaces/NearStop'

const favoriteSlice = createSlice({
  name: 'favorite',
  initialState: {
    stops: [] as NearStop[]
  },
  reducers: {
    loadLocalStorage: (state) => {
      state.stops = JSON.parse(localStorage.getItem('favoriteStops') ?? '[]') as NearStop[]
    },
    setFavoriteStops: (state, action: PayloadAction<NearStop[]>) => {
      state.stops = action.payload
      localStorage.setItem('favorite', JSON.stringify(state.stops))
    },
    addFavoriteStop: (state, action: PayloadAction<NearStop>) => {
      const newStop = action.payload
      if (!state.stops.map((stop) => stop.StopUID).includes(newStop.StopUID)) {
        state.stops.push(newStop)
        localStorage.setItem('favorite', JSON.stringify(state.stops))
      }
    },
    removeFavoriteStop: (state, action: PayloadAction<NearStop>) => {
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
