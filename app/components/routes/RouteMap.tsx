import type { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl'
import mapLibre from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LngLat, LatLng } from '~/modules/types/CoordsType'
import { createMapMarkerElement } from '~/modules/utils/createMapMarkerElement'
import BaseMap from '../common/BaseMap'

export interface RouteMapStop {
  id: string
  name: string
  position: LngLat | null
  sequence: number
}

export interface RouteMapVehicle {
  id: string
  estimateLabel: string
  plateNumb: string | null
  position: LngLat
  stopName: string
}

interface PropType {
  highlightedStopId?: string | null
  onSelectStop: (stopId: string | null) => void
  routePath?: LngLat[]
  selectedStop: string | null
  stops: RouteMapStop[]
  vehicles?: RouteMapVehicle[]
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

export const RouteMap = ({
  highlightedStopId = null,
  onSelectStop,
  routePath = [],
  selectedStop,
  stops,
  vehicles = []
}: PropType) => {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const markerMap = useRef<Map<string, Marker>>(new Map())
  const popupRef = useRef<Popup | null>(null)
  const vehicleMarkerMap = useRef<Map<string, Marker>>(new Map())

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
    vehicleMarkerMap.current.forEach((marker) => marker.remove())
    vehicleMarkerMap.current.clear()

    removeRouteLine(map)

    const lineCoordinates = routePath.length > 1
      ? routePath
      : positionedStops.length > 1
        ? positionedStops.map((stop) => stop.position)
        : []

    if (lineCoordinates.length > 1) {
      map.addSource(ROUTE_LINE_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: lineCoordinates
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
      const el = createMapMarkerElement({
        backgroundColor: isHighlighted ? HIGHLIGHTED_STOP_COLOR : ROUTE_COLOR,
        datasetLabel: stop.name,
        textContent: String(stop.sequence),
        title: stop.name,
        type: 'stop'
      })

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

    vehicles.forEach((vehicle) => {
      const el = createMapMarkerElement({
        datasetLabel: `${vehicle.plateNumb ?? '未提供車牌'}\n最近站牌：${vehicle.stopName}\n預估到站：${vehicle.estimateLabel}`,
        textContent: '🚌',
        type: 'vehicle'
      })

      const handleOpenVehiclePopup = (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()

        if (popupRef.current) {
          popupRef.current.remove()
          popupRef.current = null
        }

        const popup = new mapLibre.Popup({
          offset: 20,
          closeOnClick: false
        })
          .setLngLat(vehicle.position)
          .setText(el.dataset.label || '')
          .addTo(map)

        popupRef.current = popup

        map.flyTo({
          center: vehicle.position,
          zoom: 16,
          duration: 800
        })
      }

      el.addEventListener('click', handleOpenVehiclePopup)

      const marker = new mapLibre.Marker({ element: el })
        .setLngLat(vehicle.position)
        .addTo(map)

      vehicleMarkerMap.current.set(vehicle.id, marker)
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
  }, [highlightedStopId, isMapReady, map, onSelectStop, positionedStops, routePath, selectedStop, vehicles])

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
