import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { GeoPermissionType } from '../enums/GeoPermissionType'
import geolocationSlice from '../slices/geolocationSlice'

export const useWatchGeolocation = () => {
  const { setCoords, setPermission, setWatching } = geolocationSlice.actions
  const dispatch = useDispatch()
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      console.warn('Geolocation is not supported in this environment.')
      dispatch(setPermission(GeoPermissionType.UNSUPPORTED))
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
        dispatch(setPermission(result.state as GeoPermissionType))
        result.onchange = () => {
          dispatch(setPermission(result.state as GeoPermissionType))
        }
      } catch (err) {
        console.warn('Permission query failed:', err)
      }
    })()

    dispatch(setWatching(true))
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        dispatch(setPermission(GeoPermissionType.GRANTED))
        dispatch(setCoords([pos.coords.latitude, pos.coords.longitude]))
      },
      (err) => {
        console.error(err)
        if (err.code === err.PERMISSION_DENIED) {
          dispatch(setPermission(GeoPermissionType.DENIED))
          dispatch(setCoords(null))
          dispatch(setWatching(false))
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
      dispatch(setWatching(false))
    }
  }, [dispatch])
}
