import { NavLink, Accordion, AccordionControl, AccordionItem, AccordionPanel, Alert, Card, Flex, ScrollArea } from '@mantine/core'
import distance from '@turf/distance'
import { point } from '@turf/helpers'
import { useSelector } from 'react-redux'
import type { RootState } from '~/modules/store'
import { GeoPermissionType } from '~/modules/enums/geo/GeoPermissionType'
import { busApi } from '~/modules/apis/bus'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  geoErrorMessages,
  geoPermissionMessages
} from '~/modules/constants/geoMessages'
import type { LngLat } from '~/modules/types/CoordsType'
import { getCityByCoords } from '~/modules/utils/getCityByCoords'
import { NearbyStopMap } from '~/components/nearby/NearbyStopMap'

const NEARBY_DISTANCE_KM = 0.5
const locatingMessage = {
  color: 'blue',
  title: '定位中',
  description: '正在取得您的目前位置，請稍候...'
} as const

const loadingStopsMessage = {
  color: 'blue',
  title: '載入中',
  description: '正在取得附近的站牌資料，請稍候...'
} as const

const loadStopsErrorMessage = {
  color: 'red',
  title: '載入站牌資料失敗',
  description: '請稍後再試，或確認您的網路連線'
} as const

const emptyStopsMessage = {
  color: 'yellow',
  title: '附近沒有站牌',
  description: '目前在您附近沒有找到任何站牌'
} as const

const Nearby = () => {
  const [selectedStop, setSelectedStop] = useState<string | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  const { coords, error: geolocationError, permission } = useSelector((state: RootState) => state.geolocation)
  const geojson = useSelector((state: RootState) => state.cityGeo.geojson)
  const currentCity = getCityByCoords(coords, geojson)
  const { data: allStops, isLoading, error, isSuccess } = busApi.useGetStopsByCityQuery(
    currentCity,
    {
      skip: !coords
    }
  )

  const nearbyStops = useMemo(() => {
    if (!coords || !isSuccess) return []
    // TODO: stop clustering

    const currentPoint = point([coords[1], coords[0]])

    return allStops.filter(stop => {
      if (!stop.position) return false

      const stopPoint = point(stop.position)
      return distance(currentPoint, stopPoint, { units: 'kilometers' }) <= NEARBY_DISTANCE_KM
    })
  }, [allStops, coords])

  const markers = useMemo(() => nearbyStops
    .filter(stop => stop.position)
    .map(stop => ({
      stopUID: stop.StopUID,
      position: stop.position as LngLat,
      label: stop.StopName.zh_TW
    })
  ), [nearbyStops])

  const message = useMemo(() => {
    if ([GeoPermissionType.UNSUPPORTED, GeoPermissionType.DENIED].includes(permission)) {
      return geoPermissionMessages[permission]
    }
    if (geolocationError) return geoErrorMessages[geolocationError]
    if (!coords) return locatingMessage
    if (error) return loadStopsErrorMessage
    if (isLoading) return loadingStopsMessage
    if (nearbyStops.length === 0) return emptyStopsMessage

    return null
  }, [permission, geolocationError, coords, nearbyStops, isLoading, error])

  useEffect(() => {
    if (!selectedStop || !scrollViewportRef.current) return

    const item = itemRefs.current.get(selectedStop)
    if (!item) return

    item.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    })

  }, [selectedStop, nearbyStops])

  return (
    <Flex h="100%">
      <Card shadow="sm" p="lg" w="375px" mih="400px">
        { message && (
          <Alert color={message.color} title={message.title}>
            {message.description}
          </Alert>
        )}
        <ScrollArea viewportRef={scrollViewportRef} style={{ height: '100%', marginTop: '1rem' }}>
          <Accordion variant="separated" value={selectedStop} onChange={setSelectedStop}>
            {nearbyStops.map((stop) => (
              <AccordionItem
                value={stop.StopUID}
                key={stop.StopUID}
                ref={(node) => {
                  if (node) {
                    itemRefs.current.set(stop.StopUID, node)
                  } else {
                    itemRefs.current.delete(stop.StopUID)
                  }
                }}
              >
                <AccordionControl>
                  {stop.StopName.zh_TW}
                </AccordionControl>
                <AccordionPanel>
                  {stop.City}
                  {stop.StopAddress}
                  <NavLink
                    href={`/stop/${stop.StopUID}`}
                    style={{ marginTop: '0.5rem' }}
                    label="查看路線"
                  />
                </AccordionPanel>
              </AccordionItem>
            ))}
            </Accordion>
          </ScrollArea>
      </Card>
      <NearbyStopMap
        center={coords}
        markers={markers}
        selectedStop={selectedStop}
        onSelectStop={setSelectedStop}
      />
    </Flex>
  )
}

export default Nearby
