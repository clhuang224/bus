import { useSearchParams } from 'react-router'

interface NearbySearchParamUpdates {
  selectedStopId?: string | null
  selectedRouteStopId?: string | null
}

export const useNearbySearchParams = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedStopId = searchParams.get('stop')
  const selectedRouteStopId = searchParams.get('routeStop')

  const setNearbySearchParams = ({
    selectedStopId,
    selectedRouteStopId
  }: NearbySearchParamUpdates) => {
    setSearchParams((currentSearchParams) => {
      const nextSearchParams = new URLSearchParams(currentSearchParams)

      if (selectedStopId !== undefined) {
        if (selectedStopId) {
          nextSearchParams.set('stop', selectedStopId)
        } else {
          nextSearchParams.delete('stop')
        }
      }

      if (selectedRouteStopId !== undefined) {
        if (selectedRouteStopId) {
          nextSearchParams.set('routeStop', selectedRouteStopId)
        } else {
          nextSearchParams.delete('routeStop')
        }
      }

      return nextSearchParams
    })
  }

  return {
    selectedStopId,
    selectedRouteStopId,
    selectStop: (stopId: string | null) => setNearbySearchParams({
      selectedStopId: stopId,
      selectedRouteStopId: null
    }),
    viewStopRoutes: (stationID: string) => setNearbySearchParams({
      selectedStopId: stationID,
      selectedRouteStopId: stationID
    }),
    backToNearbyStops: () => setNearbySearchParams({
      selectedStopId: selectedRouteStopId,
      selectedRouteStopId: null
    })
  }
}
