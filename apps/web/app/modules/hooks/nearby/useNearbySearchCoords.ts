import distance from '@turf/distance'
import { point } from '@turf/helpers'
import { useEffect, useState } from 'react'
import { NEARBY_SEARCH_MOVE_THRESHOLD_KM } from '~/modules/consts/nearby'
import type { LatLng } from '~/modules/types/CoordsType'
import { toLngLat } from '~/modules/utils/geo/convertCoordinates'

function hasMovedPastThreshold(from: LatLng, to: LatLng) {
  const movedKm = distance(point(toLngLat(from)!), point(toLngLat(to)!), {
    units: 'kilometers',
  })

  return movedKm > NEARBY_SEARCH_MOVE_THRESHOLD_KM
}

export function useNearbySearchCoords(coords: LatLng | null) {
  const [searchCoords, setSearchCoords] = useState(coords)

  useEffect(() => {
    setSearchCoords((currentSearchCoords) => {
      if (!coords || !currentSearchCoords) return coords

      return hasMovedPastThreshold(currentSearchCoords, coords)
        ? coords
        : currentSearchCoords
    })
  }, [coords])

  return searchCoords
}
