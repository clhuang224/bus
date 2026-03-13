import { Box } from '@mantine/core'
import { useId } from '@mantine/hooks'
import mapLibre, { Map, Marker, LngLat as MapLngLat } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import type { LatLng } from '~/modules/types/CoordsType'
import type { RootState } from '~/modules/store'

interface PropType {
  center: LatLng | null
  zoom?: number
  showUserLocation?: boolean
  onLoad?: (map: Map) => void
}

const BaseMap = ({ center, zoom = 16, showUserLocation = false, onLoad }: PropType) => {
  const id = useId()
  const [map, setMap] = useState<Map | null>(null)
  const userMarkerRef = useRef<Marker | null>(null)

  const { coords } = useSelector((state: RootState) => state.geolocation)

  useLayoutEffect(() => {
    const mapInstance = new mapLibre.Map({
      container: id,
      style: {
        version: 8,
        sources: {
          carto: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#E0E0E0'
            }
          },
          {
            id: 'carto-base',
            type: 'raster',
            source: 'carto',
            minzoom: 0,
            maxzoom: 17
          }
        ]
      },
      center: center ? [center[1], center[0]] : [121.53969560512759, 25.059928238479156],
      zoom: zoom
    })
    setMap(mapInstance)

    onLoad?.(mapInstance)

    return () => {
      mapInstance.remove()
    }
  }, [id])

  useEffect(() => {
    if (map && !map.getCenter() && center) {
      map.setCenter(new MapLngLat(center[1], center[0]))
    }
  }, [center, map])

  useEffect(() => {
    if (!map || !coords || !showUserLocation) return

    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    const el = document.createElement('div')
    el.style.width = '20px'
    el.style.height = '20px'
    el.style.borderRadius = '50%'
    el.style.backgroundColor = '#4A90E2'
    el.style.border = '3px solid white'
    el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)'

    userMarkerRef.current = new Marker({ element: el })
      .setLngLat(new MapLngLat(coords![1], coords![0]))
      .addTo(map!)

    return () => {
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
    }
  }, [map, showUserLocation, coords])

  return <Box id={id} style={{ width: '100%', height: 'calc(100vh - 64px)' }} />
}

export default BaseMap
