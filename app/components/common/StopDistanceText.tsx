import { Text, type TextProps } from '@mantine/core'
import distance from '@turf/distance'
import { point } from '@turf/helpers'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import type { RootState } from '~/modules/store'
import type { LngLat } from '~/modules/types/CoordsType'

interface PropType extends Omit<TextProps, 'children'> {
  position: LngLat | null
}

export const StopDistanceText = ({ position, ...textProps }: PropType) => {
  const { t } = useTranslation()
  const { coords } = useSelector((state: RootState) => state.geolocation)

  const distanceKm = useMemo(() => {
    if (!coords || !position) {
      return null
    }

    return distance(point([coords[1], coords[0]]), point(position), {
      units: 'kilometers'
    })
  }, [coords, position])

  if (distanceKm == null) {
    return null
  }

  const distanceLabel = distanceKm < 1
    ? t('components.stopDistance.meters', {
        count: Math.round(distanceKm * 1000)
      })
    : t('components.stopDistance.kilometers', {
        count: distanceKm < 10 ? Number(distanceKm.toFixed(1)) : Math.round(distanceKm)
      })

  return <Text {...textProps}>{distanceLabel}</Text>
}
