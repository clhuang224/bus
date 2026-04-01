import { Box } from '@mantine/core'
import { useId } from '@mantine/hooks'
import mapLibre, { Map, Marker, LngLat as MapLngLat } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import type { LatLng } from '~/modules/types/CoordsType'
import type { RootState } from '~/modules/store'
import { createMapMarkerElement } from '~/modules/utils/map/createMapMarkerElement'

interface PropType {
  center: LatLng | null
  zoom?: number
  showUserLocation?: boolean
  onLoad?: (map: Map) => void
}

const BaseMap = ({ center, zoom = 16, showUserLocation = false, onLoad }: PropType) => {
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

  return <Box id={id} style={{ width: '100%', height: '100%' }} />
}

export default BaseMap
