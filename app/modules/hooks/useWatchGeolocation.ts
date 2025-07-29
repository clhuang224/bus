import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { geolocationActions } from '../slices/geolocationSlice'
import { GeoPermissionType } from '../enums/GeoPermissionType'

export const useWatchGeolocation = () => {
  const { setCoords, setPermission, setWatching } = geolocationActions
  const dispatch = useDispatch()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      dispatch(setPermission(GeoPermissionType.UNSUPPORTED))
      return
    }

    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      dispatch(setPermission(result.state))
    })

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        dispatch(setCoords([pos.coords.latitude, pos.coords.longitude]))
        dispatch(setWatching(true))
      },
      (err) => {
        console.warn(err)
        dispatch(setPermission(GeoPermissionType.DENIED))
        dispatch(setWatching(false))
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    )

    return () => {
      if (id) navigator.geolocation.clearWatch(id)
      dispatch(setWatching(false))
    }
  }, [dispatch])
}
