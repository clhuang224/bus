import type { Map as MapLibreMap, Marker } from 'maplibre-gl'
import mapLibre from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LngLat, LatLng } from '~/modules/types/CoordsType'
import BaseMap from '../common/BaseMap'

export interface RouteMapStop {
  id: string
  name: string
  position: LngLat | null
  sequence: number
}

interface PropType {
  stops: RouteMapStop[]
}

const ROUTE_LINE_SOURCE_ID = 'route-line-source'
const ROUTE_LINE_LAYER_ID = 'route-line-layer'

function removeRouteLine(map: MapLibreMap) {
  if (map.getLayer(ROUTE_LINE_LAYER_ID)) {
    map.removeLayer(ROUTE_LINE_LAYER_ID)
  }

  if (map.getSource(ROUTE_LINE_SOURCE_ID)) {
    map.removeSource(ROUTE_LINE_SOURCE_ID)
  }
}

export const RouteMap = ({ stops }: PropType) => {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const isUnmountingRef = useRef(false)
  const markerRef = useRef<Marker[]>([])

  const positionedStops = useMemo(
    () => stops.filter((stop): stop is RouteMapStop & { position: LngLat } => stop.position != null),
    [stops]
  )

  const center = positionedStops[0]
    ? [positionedStops[0].position[1], positionedStops[0].position[0]] as LatLng
    : null

  useEffect(() => {
    isUnmountingRef.current = false

    return () => {
      isUnmountingRef.current = true
    }
  }, [])

  useEffect(() => {
    if (!map) {
      setIsMapReady(false)
      return
    }

    if (map.isStyleLoaded()) {
      setIsMapReady(true)
      return
    }

    const handleLoad = () => {
      setIsMapReady(true)
    }

    map.once('load', handleLoad)

    return () => {
      map.off('load', handleLoad)
    }
  }, [map])

  useEffect(() => {
    if (!map || !isMapReady) return

    markerRef.current.forEach((marker) => marker.remove())
    markerRef.current = []

    removeRouteLine(map)

    if (positionedStops.length > 1) {
      map.addSource(ROUTE_LINE_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: positionedStops.map((stop) => stop.position)
          }
        }
      })

      map.addLayer({
        id: ROUTE_LINE_LAYER_ID,
        type: 'line',
        source: ROUTE_LINE_SOURCE_ID,
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#228be6',
          'line-width': 4,
          'line-opacity': 0.85
        }
      })
    }

    positionedStops.forEach((stop) => {
      const el = document.createElement('div')
      el.style.width = '28px'
      el.style.height = '28px'
      el.style.borderRadius = '999px'
      el.style.backgroundColor = '#228be6'
      el.style.border = '2px solid #ffffff'
      el.style.color = '#ffffff'
      el.style.fontSize = '12px'
      el.style.fontWeight = '700'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.title = stop.name
      el.textContent = String(stop.sequence)

      markerRef.current.push(
        new mapLibre.Marker({ element: el })
          .setLngLat(stop.position)
          .addTo(map)
      )
    })

    if (positionedStops.length > 0) {
      const bounds = positionedStops.reduce(
        (result, stop) => result.extend(stop.position),
        new mapLibre.LngLatBounds(positionedStops[0].position, positionedStops[0].position)
      )

      map.fitBounds(bounds, {
        padding: 48,
        maxZoom: 15,
        duration: 800
      })
    }

    return () => {
      markerRef.current.forEach((marker) => marker.remove())
      markerRef.current = []

      if (!map || isUnmountingRef.current) return
      removeRouteLine(map)
    }
  }, [isMapReady, map, positionedStops])

  return (
    <>
      <BaseMap
        center={center}
        zoom={13}
        onBeforeDestroy={(map) => {
          markerRef.current.forEach((marker) => marker.remove())
          markerRef.current = []
          removeRouteLine(map)
        }}
        onLoad={setMap}
      />
    </>
  )
}
