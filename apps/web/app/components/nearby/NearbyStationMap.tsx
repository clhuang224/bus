import mapLibre, { Marker, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import type { LngLat, LatLng } from '~/modules/types/CoordsType'
import { addMapMarkerActivationListeners } from '~/modules/utils/map/addMapMarkerActivationListeners'
import { createMapMarkerElement } from '~/modules/utils/map/createMapMarkerElement'
import BaseMap from '../common/BaseMap'

interface PropType {
  center: LatLng | null
  markers: Array<{
    id: string
    position: LngLat
    label: string
  }>
  extraControls?: ReactNode
  selectedStation: string | null
  selectedStationPopupContent?: ReactNode
  isSm?: boolean
  onSelectStation: (id: string | null) => void
}

export const NearbyStationMap = ({
  center,
  markers = [],
  extraControls,
  selectedStation,
  selectedStationPopupContent,
  isSm = false,
  onSelectStation,
}: PropType) => {
  const { t } = useTranslation()
  const [map, setMap] = useState<mapLibre.Map | null>(null)
  const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(
    null,
  )
  const markerMap = useRef<Map<string, Marker>>(new Map<string, Marker>())
  const popupRef = useRef<Popup | null>(null)

  useEffect(() => {
    if (!map) return
    const markerCleanupFns: Array<() => void> = []

    markerMap.current.forEach((marker) => marker.remove())
    markerMap.current.clear()

    markers.forEach((data) => {
      const el = createMapMarkerElement({
        ariaLabel: t('components.nearbyStopMap.stopMarkerAriaLabel', {
          stopName: data.label,
        }),
        backgroundColor: 'var(--mantine-primary-color-filled)',
        datasetLabel: data.label,
        fontSize: '16px',
        fontWeight: 'bold',
        interactive: true,
        textContent: '🚏',
        type: 'stop',
      })

      const handleSelectStation = (event: MouseEvent | KeyboardEvent) => {
        event.preventDefault()
        event.stopPropagation()
        onSelectStation(data.id)
      }

      markerCleanupFns.push(
        addMapMarkerActivationListeners(el, handleSelectStation),
      )

      const marker = new Marker({ element: el })
        .setLngLat(data.position)
        .addTo(map)

      markerMap.current.set(data.id, marker)
    })

    return () => {
      markerCleanupFns.forEach((cleanup) => cleanup())
      markerMap.current.forEach((marker) => {
        marker.remove()
      })
      markerMap.current.clear()
    }
  }, [map, markers, onSelectStation, t])

  useEffect(() => {
    if (!map || !markerMap.current.size) return

    if (popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }
    setPopupContainer(null)

    if (!selectedStation) return

    const marker = markerMap.current.get(selectedStation)
    if (!marker) return

    const popup = new Popup({
      closeButton: false,
      offset: 25,
      closeOnClick: false,
    }).setLngLat(marker.getLngLat())

    if (selectedStationPopupContent) {
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
    }
  }, [map, markers, selectedStation, selectedStationPopupContent])

  useEffect(() => {
    if (!map) return
    if (!selectedStation) return

    const marker = markerMap.current.get(selectedStation)
    if (!marker) return

    map.flyTo({
      center: marker.getLngLat(),
      zoom: 16,
      duration: 800,
    })
  }, [map, markers, selectedStation])

  return (
    <>
      <BaseMap
        center={center}
        zoom={16}
        showUserLocation
        extraControls={extraControls}
        onLoad={setMap}
      />
      {popupContainer && selectedStationPopupContent
        ? createPortal(
            <div
              style={{
                maxHeight: isSm ? '50dvh' : '40dvh',
                overflowY: 'auto',
              }}
            >
              {selectedStationPopupContent}
            </div>,
            popupContainer,
          )
        : null}
    </>
  )
}
