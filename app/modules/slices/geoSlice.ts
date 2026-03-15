import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { GeoState } from '~/modules/interfaces/GeoState'
import { GeoPermissionType } from '../enums/geo/GeoPermissionType'
import { GeoActionType } from '../enums/geo/GeoActionType'
import { GeoErrorType } from '../enums/geo/GeoErrorType'
import type { LatLng } from '../types/CoordsType'

type GeoTransitionPayload =
  | {
    type: GeoActionType.UNSUPPORTED
  }
  | {
    type: GeoActionType.PERMISSION_CHANGED
    permission: GeoPermissionType
  }
  | {
    type: GeoActionType.WATCH_STARTED
  }
  | {
    type: GeoActionType.WATCH_STOPPED
  }
  | {
    type: GeoActionType.POSITION_UPDATED
    coords: LatLng
  }
  | {
    type: GeoActionType.POSITION_DENIED
  }
  | {
    type: GeoActionType.POSITION_UNAVAILABLE
  }
  | {
    type: GeoActionType.POSITION_TIMEOUT
  }

const initialState: GeoState = {
  coords: null,
  permission: GeoPermissionType.PROMPT,
  watching: false,
  error: null
}

const geoSlice = createSlice({
  name: 'geolocation',
  initialState,
  reducers: {
    transitionState: (
      state,
      action: PayloadAction<GeoTransitionPayload>
    ) => {
      switch (action.payload.type) {
        case GeoActionType.UNSUPPORTED:
          state.permission = GeoPermissionType.UNSUPPORTED
          state.coords = null
          state.error = null
          state.watching = false
          return
        case GeoActionType.PERMISSION_CHANGED:
          state.permission = action.payload.permission
          return
        case GeoActionType.WATCH_STARTED:
          state.watching = true
          return
        case GeoActionType.WATCH_STOPPED:
          state.watching = false
          return
        case GeoActionType.POSITION_UPDATED:
          state.coords = action.payload.coords
          state.error = null
          state.permission = GeoPermissionType.GRANTED
          return
        case GeoActionType.POSITION_DENIED:
          state.error = GeoErrorType.PERMISSION_DENIED
          state.permission = GeoPermissionType.DENIED
          state.coords = null
          state.watching = false
          return
        case GeoActionType.POSITION_UNAVAILABLE:
          state.error = GeoErrorType.POSITION_UNAVAILABLE
          state.coords = null
          state.watching = false
          return
        case GeoActionType.POSITION_TIMEOUT:
          state.error = GeoErrorType.TIMEOUT
          state.coords = null
          state.watching = false
          return
      }
    }
  }
})

export default geoSlice
