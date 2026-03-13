import { NavLink, Accordion, AccordionControl, AccordionItem, AccordionPanel, Alert, Card, Flex, ScrollArea } from '@mantine/core'
import { useSelector } from 'react-redux'
import type { RootState } from '~/modules/store'
import { GeoPermissionType } from '~/modules/enums/GeoPermissionType'
import { busApi } from '~/modules/apis/bus'
import { useCityByCoords } from '~/modules/hooks/useCityByCoords'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LngLat } from '~/modules/types/CoordsType'
import { NearbyStopMap } from '~/components/NearbyStopMap'

const Nearby = () => {
  const [selectedStop, setSelectedStop] = useState<string | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  const { coords, permission } = useSelector((state: RootState) => state.geolocation)
  const currentCity = useCityByCoords(coords)
  const { data: allStops, isLoading, error, isSuccess } = busApi.useGetStopsByCityQuery(
    currentCity,
    {
      skip: permission !== GeoPermissionType.GRANTED
    }
  )

  const nearbyStops = useMemo(() => {
    if (!coords || !isSuccess) return []
    // TODO: stop clustering
    return allStops.filter(stop => {
      if (!stop.position) return false
      // XXX: turf
      const distance = Math.sqrt(
        Math.pow(stop.position[1] - coords[0], 2) +
        Math.pow(stop.position[0] - coords[1], 2)
      )
      return distance <= 0.005
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
    if (permission === GeoPermissionType.UNSUPPORTED) {
      return {
        color: 'red',
        title: '不支援定位',
        description: '您的瀏覽器不支援地理定位功能'
      }
    }
    if (permission === GeoPermissionType.DENIED) {
      return {
        color: 'red',
        title: '無法取得位置',
        description: '請在瀏覽器設定中允許此網站存取您的位置資訊'
      }
    }
    if (error) {
      return {
        color: 'red',
        title: '載入站牌資料失敗',
        description: '請稍後再試，或確認您的網路連線'
      }
    }
    if (isLoading) {
      return {
        color: 'blue',
        title: '載入中',
        description: '正在取得附近的站牌資料，請稍候...'
      }
    }
    if (nearbyStops.length === 0) {
      return {
        color: 'yellow',
        title: '附近沒有站牌',
        description: '目前在您附近沒有找到任何站牌'
      }
    }
    return null
  }, [permission, nearbyStops, isLoading, error])

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
