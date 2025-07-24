import { Box } from '@mantine/core'
import { useId } from '@mantine/hooks'
import mapLibre, { Map } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useLayoutEffect, useState } from 'react'

interface PropType {
  center: [number, number],
  zoom: number
}

export const AppMap = ({ center, zoom }: PropType) => {
  const id = useId()
  const [, setMap] = useState<Map | null>(null)
  useLayoutEffect(() => {
    setMap(new mapLibre.Map({
      container: id,
      style: 'https://demotiles.maplibre.org/style.json',
      center: center,
      zoom: zoom
    }))
  }, [id])
  return (
    <Box id={id}/>
  )
}
