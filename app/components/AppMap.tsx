import { Box } from '@mantine/core'
import { useId } from '@mantine/hooks'
import mapLibre, { Map, Marker, LngLat as MapLngLat } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useLayoutEffect, useRef, useState } from 'react'
import type { LngLat, LatLng } from '~/modules/types/CoordsType'

interface PropType {
  center: LatLng | null
  zoom?: number
  markers: Array<{
    position: LngLat
    label: string
  }>
  showUserLocation?: boolean
}

export const AppMap = ({ center, zoom = 16, markers = [], showUserLocation = false }: PropType) => {
  const id = useId()
  const [map, setMap] = useState<Map | null>(null)
  const markersRef = useRef<Marker[]>([])
  const userMarkerRef = useRef<Marker | null>(null)

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

    return () => {
      mapInstance.remove()
    }
  }, [id])

  useLayoutEffect(() => {
    if (map && !map.getCenter() && center) {
      map.setCenter(new MapLngLat(center[1], center[0]))
    }
  }, [center, map])

  useLayoutEffect(() => {
    if (!map && !center) return

    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    if (showUserLocation) {
      const el = document.createElement('div')
      el.style.width = '20px'
      el.style.height = '20px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = '#4A90E2'
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)'
    }

    return () => {
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
    }
  }, [map, showUserLocation, center])

  useLayoutEffect(() => {
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    if (markers) {
      const newMarkers = markers.map((markerData) => {
        const el = document.createElement('div')
        el.style.width = '36px'
        el.style.height = '36px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = 'var(--mantine-primary-color-filled)'
        el.style.border = '2px solid #fff'
        el.style.cursor = 'pointer'
        el.style.display = 'flex'
        el.style.alignItems = 'center'
        el.style.justifyContent = 'center'
        el.style.fontSize = '16px'
        el.style.color = 'white'
        el.style.fontWeight = 'bold'
        el.textContent = '🚏'

        const marker = new mapLibre.Marker({ element: el })
          .setLngLat(new MapLngLat(markerData.position[0], markerData.position[1]))

        if (markerData.label) {
          const popup = new mapLibre.Popup({ offset: 25 }).setText(markerData.label)
          marker.setPopup(popup)
        }

        marker.addTo(map)
        return marker
      })

      markersRef.current = newMarkers
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
    }
  }, [map, markers])

  return <Box id={id} style={{ width: '100%', height: 'calc(100vh - 64px)' }} />
}
