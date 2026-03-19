import type { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl'
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
  highlightedStopId?: string | null
  onSelectStop: (stopId: string | null) => void
  selectedStop: string | null
  stops: RouteMapStop[]
}

const ROUTE_LINE_SOURCE_ID = 'route-line-source'
const ROUTE_LINE_LAYER_ID = 'route-line-layer'
const ROUTE_COLOR = '#868e96'
const HIGHLIGHTED_STOP_COLOR = '#1c7ed6'

function removeRouteLine(map: MapLibreMap) {
  if (map.getLayer(ROUTE_LINE_LAYER_ID)) {
    map.removeLayer(ROUTE_LINE_LAYER_ID)
  }

  if (map.getSource(ROUTE_LINE_SOURCE_ID)) {
    map.removeSource(ROUTE_LINE_SOURCE_ID)
  }
}

export const RouteMap = ({ highlightedStopId = null, onSelectStop, selectedStop, stops }: PropType) => {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const markerMap = useRef<Map<string, Marker>>(new Map())
  const popupRef = useRef<Popup | null>(null)

  const positionedStops = useMemo(
    () => stops.filter((stop): stop is RouteMapStop & { position: LngLat } => stop.position != null),
    [stops]
  )

  const center = positionedStops[0]
    ? [positionedStops[0].position[1], positionedStops[0].position[0]] as LatLng
    : null

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

    markerMap.current.forEach((marker) => marker.remove())
    markerMap.current.clear()

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
          'line-color': ROUTE_COLOR,
          'line-width': 4,
          'line-opacity': 0.85
        }
      })
    }

    positionedStops.forEach((stop) => {
      const isHighlighted = stop.id === highlightedStopId
      const el = document.createElement('div')
      el.style.width = '28px'
      el.style.height = '28px'
      el.style.borderRadius = '999px'
      el.style.backgroundColor = isHighlighted ? HIGHLIGHTED_STOP_COLOR : ROUTE_COLOR
      el.style.border = '2px solid #ffffff'
      el.style.color = '#ffffff'
      el.style.fontSize = '12px'
      el.style.fontWeight = '700'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.cursor = 'pointer'
      el.title = stop.name
      el.dataset.label = stop.name
      el.textContent = String(stop.sequence)

      const handleSelectStop = (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        onSelectStop(stop.id)
      }

      el.addEventListener('click', handleSelectStop)

      const marker = new mapLibre.Marker({ element: el })
        .setLngLat(stop.position)
        .addTo(map)

      markerMap.current.set(stop.id, marker)
    })

    if (positionedStops.length > 0 && !selectedStop) {
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
  }, [highlightedStopId, isMapReady, map, onSelectStop, positionedStops, selectedStop])

  useEffect(() => {
    if (!map || !markerMap.current.size) return

    if (popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }

    if (!selectedStop) return

    const marker = markerMap.current.get(selectedStop)
    if (!marker) return

    const popup = new mapLibre.Popup({
      offset: 25,
      closeOnClick: false
    })
      .setLngLat(marker.getLngLat())
      .setText(marker.getElement().dataset.label || '')
      .addTo(map)

    popupRef.current = popup

    return () => {
      if (!popupRef.current) return
      popupRef.current.remove()
      popupRef.current = null
    }
  }, [map, selectedStop])

  useEffect(() => {
    if (!map || !selectedStop) return

    const marker = markerMap.current.get(selectedStop)
    if (!marker) return

    map.flyTo({
      center: marker.getLngLat(),
      zoom: 16,
      duration: 800
    })
  }, [map, selectedStop])

  return (
    <>
      <BaseMap
        center={center}
        zoom={13}
        onLoad={setMap}
      />
    </>
  )
}
