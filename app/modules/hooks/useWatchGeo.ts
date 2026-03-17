import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { GeoActionType } from '../enums/geo/GeoActionType'
import { GeoPermissionType } from '../enums/geo/GeoPermissionType'
import geoSlice from '../slices/geoSlice'
import type { LatLng } from '../types/CoordsType'

const getDevFallbackCoords = (): LatLng | null => {
  if (!import.meta.env.DEV) return null

  const latitude = Number(import.meta.env.VITE_DEV_GEO_FALLBACK_LAT)
  const longitude = Number(import.meta.env.VITE_DEV_GEO_FALLBACK_LNG)

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null
  }

  return [latitude, longitude]
}

export const useWatchGeo = () => {
  const { transitionState } = geoSlice.actions
  const dispatch = useDispatch()
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      console.warn('Geolocation is not supported in this environment.')
      dispatch(transitionState({ type: GeoActionType.UNSUPPORTED }))
      return
    }

    let permissionStatus: PermissionStatus | null = null;

    (async () => {
      const permissions = navigator.permissions
      const queryPermission = permissions?.query?.bind(permissions)
      if (!queryPermission) return
      try {
        const result = await queryPermission({ name: 'geolocation' })
        permissionStatus = result
        dispatch(transitionState({
          type: GeoActionType.PERMISSION_CHANGED,
          permission: result.state as GeoPermissionType
        }))
        result.onchange = () => {
          dispatch(transitionState({
            type: GeoActionType.PERMISSION_CHANGED,
            permission: result.state as GeoPermissionType
          }))
        }
      } catch (err) {
        console.warn('Permission query failed:', err)
      }
    })()

    dispatch(transitionState({ type: GeoActionType.WATCH_STARTED }))
    const fallbackCoords = getDevFallbackCoords()
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        dispatch(transitionState({
          type: GeoActionType.POSITION_UPDATED,
          coords: [pos.coords.latitude, pos.coords.longitude]
        }))
      },
      (err) => {
        console.error(err)
        if (err.code === err.PERMISSION_DENIED) {
          dispatch(transitionState({ type: GeoActionType.POSITION_DENIED }))
          return
        }

        if (err.code === err.POSITION_UNAVAILABLE) {
          if (fallbackCoords) {
            console.warn('Using development geolocation fallback after position unavailable error.')
            dispatch(transitionState({
              type: GeoActionType.POSITION_UPDATED,
              coords: fallbackCoords
            }))
            return
          }
          dispatch(transitionState({ type: GeoActionType.POSITION_UNAVAILABLE }))
          return
        }

        if (err.code === err.TIMEOUT) {
          if (fallbackCoords) {
            console.warn('Using development geolocation fallback after timeout error.')
            dispatch(transitionState({
              type: GeoActionType.POSITION_UPDATED,
              coords: fallbackCoords
            }))
            return
          }
          dispatch(transitionState({ type: GeoActionType.POSITION_TIMEOUT }))
          return
        }

        console.warn('Geolocation temporarily unavailable.')
      },
      {
        enableHighAccuracy: false,
        maximumAge: 30000,
        timeout: 10000
      }
    )

    watchIdRef.current = id

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      dispatch(transitionState({ type: GeoActionType.WATCH_STOPPED }))
    }
  }, [dispatch])
}
