import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { GeolocationState } from '~/modules/interfaces/GeolocationState'

const initialState: GeolocationState = {
  coords: null,
  permission: 'prompt',
  watching: false
}

export const geolocationSlice = createSlice({
  name: 'geolocation',
  initialState,
  reducers: {
    setCoords: (state, action: PayloadAction<[number, number]>) => {
      state.coords = action.payload
    },
    setPermission: (state, action: PayloadAction<GeolocationState['permission']>) => {
      state.permission = action.payload
    },
    setWatching: (state, action: PayloadAction<boolean>) => {
      state.watching = action.payload
    }
  }
})

export const {
  reducer: geolocationReducer,
  actions: geolocationActions,
  selectors: geolocationSelectors
} = geolocationSlice
