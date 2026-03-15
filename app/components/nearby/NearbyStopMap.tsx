import mapLibre, { Marker, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import type { LngLat, LatLng } from '~/modules/types/CoordsType'
import BaseMap from '../common/BaseMap'

interface PropType {
  center: LatLng | null
  markers: Array<{
    stopUID: string
    position: LngLat
    label: string
  }>
  selectedStop: string | null
  onSelectStop: (id: string | null) => void
}

export const NearbyStopMap = ({ center, markers = [], selectedStop, onSelectStop }: PropType) => {
  const mapRef = useRef<mapLibre.Map | null>(null)
  const markerMap = useRef<Map<string, Marker>>(new Map<string, Marker>())
  const popupRef = useRef<Popup | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    markerMap.current.forEach((marker) => marker.remove())
    markerMap.current.clear()

    markers.forEach(data => {
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
      el.dataset.label = data.label

      const handleSelectStop = (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        onSelectStop(data.stopUID)
      }

      el.addEventListener('click', handleSelectStop)

      const marker = new Marker({ element: el })
        .setLngLat(data.position)
        .addTo(mapRef.current!)

      markerMap.current.set(data.stopUID, marker)
    })

    return () => {
      markerMap.current.forEach((marker) => {
        marker.remove()
      })
      markerMap.current.clear()
    }
  }, [mapRef, markers])

  useEffect(() => {
    if (!mapRef.current || !markerMap.current.size) return

    if (popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }

    if (!selectedStop) return

    const marker = markerMap.current.get(selectedStop)
    if (!marker) return

    const popup = new Popup({
      offset: 25,
      closeOnClick: false
    })
      .setText(marker.getElement().dataset.label || '')
      .setLngLat(marker.getLngLat())
      .addTo(mapRef.current!)

    popupRef.current = popup

    return () => {
      if (!popupRef.current) return
      popupRef.current.remove()
      popupRef.current = null
    }
  }, [selectedStop])

  useEffect(() => {
    if (!mapRef.current) return
    if (!selectedStop) return

    const marker = markerMap.current.get(selectedStop)
    if (!marker) return

    mapRef.current.flyTo({
      center: marker.getLngLat(),
      zoom: 16,
      duration: 800
    })
  }, [selectedStop])

  return (
    <BaseMap
      center={center}
      zoom={16}
      showUserLocation
      onLoad={(map) => {
        mapRef.current = map
      }}
    />
  )
}
