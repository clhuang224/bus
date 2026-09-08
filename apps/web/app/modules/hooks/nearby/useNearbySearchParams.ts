import { useSearchParams } from 'react-router'
import { updateSearchParam } from '~/modules/utils/shared/updateSearchParam'

interface NearbySearchParamUpdates {
  selectedStationId?: string | null
  selectedStationRoutesId?: string | null
}

export const useNearbySearchParams = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedStationId = searchParams.get('stop')
  const selectedStationRoutesId = searchParams.get('routeStop')

  const setNearbySearchParams = ({
    selectedStationId,
    selectedStationRoutesId,
  }: NearbySearchParamUpdates) => {
    setSearchParams((currentSearchParams) => {
      const nextSearchParams = new URLSearchParams(currentSearchParams)
      updateSearchParam(nextSearchParams, 'stop', selectedStationId)
      updateSearchParam(nextSearchParams, 'routeStop', selectedStationRoutesId)

      return nextSearchParams
    })
  }

  return {
    selectedStationId,
    selectedStationRoutesId,
    selectStation: (stationId: string | null) =>
      setNearbySearchParams({
        selectedStationId: stationId,
        selectedStationRoutesId: null,
      }),
    viewStationRoutes: (stationId: string) =>
      setNearbySearchParams({
        selectedStationId: stationId,
        selectedStationRoutesId: stationId,
      }),
    backToNearbyStations: () =>
      setNearbySearchParams({
        selectedStationId: selectedStationRoutesId,
        selectedStationRoutesId: null,
      }),
  }
}
