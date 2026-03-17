import { Stack, Tabs, Text } from '@mantine/core'
import { directionMapName } from '~/modules/consts/direction'
import { DirectionType } from '~/modules/enums/DirectionType'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { getEnumValues } from '~/modules/utils/getEnumValues'
import { RouteInfoCard } from '../routes/RouteInfoCard'

interface PropType {
  routes: StationRoute[]
}

const routeNameCollator = new Intl.Collator('zh-Hant-u-co-stroke', {
  numeric: true
})

export const NearbyStopRoutes = ({ routes }: PropType) => {
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
      <Tabs defaultValue={String(routeSections[0].direction)}>
        <Tabs.List>
          {routeSections.map((section) => (
            <Tabs.Tab key={section.direction} value={String(section.direction)}>
              {section.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {routeSections.map((section) => (
          <Tabs.Panel key={section.direction} value={String(section.direction)} pt="sm">
            <Stack gap="xs">
              {section.routes.map((route) => (
                <Stack key={route.id} gap="xs">
                  <RouteInfoCard
                    to={`/bus-route/${route.city}/${route.routeUID}`}
                    name={route.name}
                    city={route.city}
                    departure={route.departure}
                    destination={route.destination}
                  />
                </Stack>
              ))}
            </Stack>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Stack>
  )
}
