import { NavLink, Stack, Text } from '@mantine/core'
import { Link } from 'react-router'
import { directionMapName } from '~/modules/consts/direction'
import { DirectionType } from '~/modules/enums/DirectionType'
import type { CityNameType } from '~/modules/enums/CityNameType'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { getEnumValues } from '~/modules/utils/getEnumValues'

interface PropType {
  city: CityNameType
  routes: StationRoute[]
}

const routeNameCollator = new Intl.Collator('zh-Hant-u-co-stroke', {
  numeric: true
})

export const NearbyStopRoutes = ({ city, routes }: PropType) => {
  const routeSections = getEnumValues(DirectionType)
    .map((direction) => ({
      direction,
      label: directionMapName[direction],
      routes: routes
        .filter((route) => route.direction === direction)
        .sort((left, right) => routeNameCollator.compare(left.name, right.name))
    }))
    .filter((section) => section.routes.length > 0)

  if (routeSections.length === 0) {
    return (
      <Stack gap={4}>
        <Text size="sm" c="dimmed">此站路線</Text>
        <Text size="sm">目前沒有可顯示的路線資訊</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">此站路線</Text>
      {routeSections.map((section) => (
        <Stack key={section.direction} gap={4}>
          <Text size="sm" fw={500}>{section.label}</Text>
          <Stack gap={6} pl="sm">
            {section.routes.map((route) => (
              <NavLink
                key={route.id}
                component={Link}
                to={`/bus-route/${city}/${route.routeUID}`}
                label={route.name}
                description={`往 ${route.destination}`}
              />
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
