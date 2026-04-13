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
import { toLngLat } from '~/modules/utils/geo/convertCoordinates'
import { createMapMarkerElement } from '~/modules/utils/map/createMapMarkerElement'
import { APP_FLOATING_ACTION_OFFSET } from '~/modules/consts/layout'

const FOCUS_ZOOM = 16

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
  const mapCenter = center ? toLngLat(center) : null
  const userLngLat = coords ? toLngLat(coords) : null

  useEffect(() => {
    onLoadRef.current = onLoad
  }, [onLoad])

  useLayoutEffect(() => {
    const mapInstance = new mapLibre.Map({
      container: id,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: mapCenter ?? [121.53969560512759, 25.059928238479156],
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
      center: new MapLngLat(mapCenter![0], mapCenter![1]),
      zoom,
      duration: 800
    })
    initialCenterRef.current = true
  }, [center, map, mapCenter, zoom])

  useEffect(() => {
    if (!map || !userLngLat || !showUserLocation) return

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
      .setLngLat(new MapLngLat(userLngLat[0], userLngLat[1]))
      .addTo(map!)

    return () => {
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
    }
  }, [map, showUserLocation, t, userLngLat])

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
                if (!map || !userLngLat) return

                map.flyTo({
                  center: userLngLat,
                  zoom: FOCUS_ZOOM,
                  duration: 800
                })
              }}
              disabled={!userLngLat || !map}
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
