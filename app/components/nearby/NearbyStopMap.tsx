import mapLibre, { Marker, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { LngLat, LatLng } from '~/modules/types/CoordsType'
import BaseMap from '../common/BaseMap'

interface PropType {
  center: LatLng | null
  markers: Array<{
    id: string
    position: LngLat
    label: string
  }>
  selectedStop: string | null
  selectedStopPopupContent?: ReactNode
  onSelectStop: (id: string | null) => void
}

export const NearbyStopMap = ({
  center,
  markers = [],
  selectedStop,
  selectedStopPopupContent,
  onSelectStop
}: PropType) => {
  const [map, setMap] = useState<mapLibre.Map | null>(null)
  const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null)
  const markerMap = useRef<Map<string, Marker>>(new Map<string, Marker>())
  const popupRef = useRef<Popup | null>(null)

  useEffect(() => {
    if (!map) return

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
        onSelectStop(data.id)
      }

      el.addEventListener('click', handleSelectStop)

      const marker = new Marker({ element: el })
        .setLngLat(data.position)
        .addTo(map)

      markerMap.current.set(data.id, marker)
    })

    return () => {
      markerMap.current.forEach((marker) => {
        marker.remove()
      })
      markerMap.current.clear()
    }
  }, [map, markers, onSelectStop])

  useEffect(() => {
    if (!map || !markerMap.current.size) return

    if (popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }
    setPopupContainer(null)

    if (!selectedStop) return

    const marker = markerMap.current.get(selectedStop)
    if (!marker) return

    const popup = new Popup({
      offset: 25,
      closeOnClick: false
    }).setLngLat(marker.getLngLat())

    if (selectedStopPopupContent) {
      const container = document.createElement('div')
      popup.setDOMContent(container)
      setPopupContainer(container)
    } else {
      popup.setText(marker.getElement().dataset.label || '')
    }

    popup.addTo(map)

    popupRef.current = popup

    return () => {
      if (!popupRef.current) return
      popupRef.current.remove()
      popupRef.current = null
      setPopupContainer(null)
    }
  }, [map, markers, selectedStop, selectedStopPopupContent])

  useEffect(() => {
    if (!map) return
    if (!selectedStop) return

    const marker = markerMap.current.get(selectedStop)
    if (!marker) return

    map.flyTo({
      center: marker.getLngLat(),
      zoom: 16,
      duration: 800
    })
  }, [map, markers, selectedStop])

  return (
    <>
      <BaseMap
        center={center}
        zoom={16}
        showUserLocation
        onLoad={(map) => {
          setMap(map)
        }}
      />
      {popupContainer && selectedStopPopupContent
        ? createPortal(selectedStopPopupContent, popupContainer)
        : null}
    </>
  )
}
