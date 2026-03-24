import { useSearchParams } from 'react-router'
import { updateSearchParam } from '../utils/shared/updateSearchParam'

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
      updateSearchParam(nextSearchParams, 'stop', selectedStopId)
      updateSearchParam(nextSearchParams, 'routeStop', selectedRouteStopId)

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
