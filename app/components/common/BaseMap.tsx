import { ActionIcon, Box, Flex } from '@mantine/core'
import { useId } from '@mantine/hooks'
import mapLibre, { Map, Marker, LngLat as MapLngLat } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { RiFocus3Line } from '@remixicon/react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import type { LatLng } from '~/modules/types/CoordsType'
import type { RootState } from '~/modules/store'
import { createMapMarkerElement } from '~/modules/utils/map/createMapMarkerElement'
import { APP_FLOATING_ACTION_OFFSET } from '~/modules/consts/layout'

interface PropType {
  center: LatLng | null
  zoom?: number
  showUserLocation?: boolean
  extraControls?: ReactNode
  onLoad?: (map: Map) => void
}

const BaseMap = ({ center, zoom = 16, showUserLocation = false, extraControls, onLoad }: PropType) => {
  const { t } = useTranslation()
  const id = useId()
  const [map, setMap] = useState<Map | null>(null)
  const userMarkerRef = useRef<Marker | null>(null)
  const initialCenterRef = useRef(Boolean(center))
  const onLoadRef = useRef(onLoad)

  const { coords } = useSelector((state: RootState) => state.geolocation)

  useEffect(() => {
    onLoadRef.current = onLoad
  }, [onLoad])

  useLayoutEffect(() => {
    const mapInstance = new mapLibre.Map({
      container: id,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: center ? [center[1], center[0]] : [121.53969560512759, 25.059928238479156],
      zoom
    })
    setMap(mapInstance)

    const handleLoad = () => {
      onLoadRef.current?.(mapInstance)
    }

    if (mapInstance.isStyleLoaded()) {
      handleLoad()
    } else {
      mapInstance.once('load', handleLoad)
    }

    return () => {
      mapInstance.off('load', handleLoad)
      mapInstance.remove()
    }
  }, [id])

  useEffect(() => {
    if (!map || !center || initialCenterRef.current) return

    map.flyTo({
      center: new MapLngLat(center[1], center[0]),
      zoom,
      duration: 800
    })
    initialCenterRef.current = true
  }, [center, map, zoom])

  useEffect(() => {
    if (!map || !coords || !showUserLocation) return

    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    const el = createMapMarkerElement({
      ariaLabel: t('components.baseMap.userLocationMarkerAriaLabel'),
      boxShadow: '0 0 10px rgba(0,0,0,0.3)',
      type: 'user'
    })

    userMarkerRef.current = new Marker({ element: el })
      .setLngLat(new MapLngLat(coords![1], coords![0]))
      .addTo(map!)

    return () => {
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
    }
  }, [coords, map, showUserLocation, t])

  return (
    <Box pos="relative" style={{ width: '100%', height: '100%' }}>
      <Box id={id} style={{ width: '100%', height: '100%' }} />
      {(showUserLocation || extraControls) && (
        <Flex
          pos="absolute"
          right={APP_FLOATING_ACTION_OFFSET}
          bottom="48px"
          direction="column"
          gap="sm"
          style={{ zIndex: 2 }}
        >
          {extraControls}
          {showUserLocation && (
            <ActionIcon
              aria-label={t('components.baseMap.focusUserLocationAriaLabel')}
              size="md"
              onClick={() => {
                if (!map || !coords) return

                map.flyTo({
                  center: [coords[1], coords[0]],
                  zoom,
                  duration: 800
                })
              }}
              disabled={!coords || !map}
            >
              <RiFocus3Line size={18} />
            </ActionIcon>
          )}
        </Flex>
      )}
    </Box>
  )
}

export default BaseMap
