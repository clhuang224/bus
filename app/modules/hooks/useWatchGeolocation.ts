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
      console.error('Geolocation not supported')
      dispatch(setPermission(GeoPermissionType.UNSUPPORTED))
      return
    }

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        dispatch(setPermission(result.state as GeoPermissionType))
      }).catch((err) => {
        console.warn('Permission query failed:', err)
      })
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        dispatch(setCoords([pos.coords.latitude, pos.coords.longitude]))
        dispatch(setWatching(true))
      },
      (err) => {
        console.error(err)
        dispatch(setPermission(GeoPermissionType.DENIED))
        dispatch(setWatching(false))
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    )

    watchIdRef.current = id

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      dispatch(setWatching(false))
    }
  }, [dispatch, setCoords, setPermission, setWatching])
}
