import { useSearchParams } from 'react-router'

interface SetNearbySearchParamsPayload {
  stop?: string | null
  routeStop?: string | null
}

export const useNearbySearchParams = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedStop = searchParams.get('stop')
  const selectedRouteStop = searchParams.get('routeStop')

  const setNearbySearchParams = ({ stop, routeStop }: SetNearbySearchParamsPayload) => {
    const updates = {
      stop,
      routeStop
    }

    setSearchParams((currentSearchParams) => {
      const nextSearchParams = new URLSearchParams(currentSearchParams)

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined) return
        if (value) {
          nextSearchParams.set(key, value)
          return
        }
        nextSearchParams.delete(key)
      })

      return nextSearchParams
    })
  }

  return {
    selectedStop,
    selectedRouteStop,
    selectStop: (stop: string | null) => setNearbySearchParams({
      stop,
      routeStop: null
    }),
    viewStopRoutes: (stationID: string) => setNearbySearchParams({
      stop: stationID,
      routeStop: stationID
    }),
    backToNearbyStops: () => setNearbySearchParams({
      stop: selectedRouteStop,
      routeStop: null
    })
  }
}
