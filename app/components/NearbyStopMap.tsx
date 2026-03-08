import mapLibre, { Marker, LngLat as MapLngLat } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useLayoutEffect, useRef } from 'react'
import type { LngLat, LatLng } from '~/modules/types/CoordsType'
import BaseMap from './BaseMap'

interface PropType {
  center: LatLng | null
  markers: Array<{
    stopUID: string
    position: LngLat
    label: string
  }>
  selectedStop: string | null
  onMarkerClick?: (stopUID: string) => void
}

export const NearbyStopMap = ({ center, markers = [], onMarkerClick, selectedStop }: PropType) => {
  const mapRef = useRef<mapLibre.Map | null>(null)
  const markersRef = useRef<Marker[]>([])

  useLayoutEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    const handleMarkerClick = (stopUID: string) => {
      if (!mapRef.current) return
      mapRef.current.flyTo({ center: new MapLngLat(...markers.find(marker => marker.stopUID === stopUID)!.position), zoom: 18 })
      .setCenter(new MapLngLat(...markers.find(marker => marker.stopUID === stopUID)!.position))
      onMarkerClick?.(stopUID)
    }

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
        el.id = markerData.stopUID

        const marker = new mapLibre.Marker({ element: el })
          .setLngLat(new MapLngLat(markerData.position[0], markerData.position[1]))
          
        marker.on('click', handleMarkerClick)

        if (markerData.label) {
          const popup = new mapLibre.Popup({ offset: 25 }).setText(markerData.label)
          marker.setPopup(popup)
        }

        marker.addTo(mapRef.current!)
        return marker
      })

      markersRef.current = newMarkers
    }

    return () => {
      markersRef.current.forEach((marker) => {
        marker.off('click', handleMarkerClick)
        marker.remove()
      }
    )
      markersRef.current = []
    }
  }, [mapRef, markers])

  useLayoutEffect(() => {
    if (!mapRef.current) return

    if (selectedStop) {
      mapRef.current.flyTo({ center: new MapLngLat(...markers.find(marker => marker.stopUID === selectedStop)!.position) })
      markersRef.current.forEach(m => {
        if (m.getPopup().isOpen()) m.togglePopup()
      })
      const marker = markersRef.current.find(marker => marker.getElement().id === selectedStop)
      if (marker && !marker.getPopup().isOpen()) marker.togglePopup()
    }
  }, [selectedStop, markers])

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
