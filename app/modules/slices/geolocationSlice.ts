import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { GeolocationState } from '~/modules/interfaces/GeolocationState'
import { GeoPermissionType } from '../enums/GeoPermissionType'
import type { CoordsType } from '../types/CoordsType'

const initialState: GeolocationState = {
  coords: null,
  permission: GeoPermissionType.PROMPT,
  watching: false
}

const geolocationSlice = createSlice({
  name: 'geolocation',
  initialState,
  reducers: {
    setCoords: (state, action: PayloadAction<CoordsType>) => {
      state.coords = action.payload
    },
    setPermission: (state, action: PayloadAction<GeoPermissionType>) => {
      state.permission = action.payload
    },
    setWatching: (state, action: PayloadAction<boolean>) => {
      state.watching = action.payload
    }
  }
})

export default geolocationSlice
