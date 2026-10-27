import { createContext } from 'react'

interface MapOverlayInsets {
  top: number
  bottom: number
}

export const MapOverlayInsetsContext = createContext<MapOverlayInsets>({
  top: 0,
  bottom: 0,
})
