import { ScrollArea, Stack, Tabs, Text } from '@mantine/core'
import { useState } from 'react'
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
  const [selectedDirection, setSelectedDirection] = useState<string | null>(
    routeSections[0] ? String(routeSections[0].direction) : null
  )

  if (routeSections.length === 0) {
    return (
      <Stack gap={4}>
        <Text size="sm" c="dimmed">此站路線</Text>
        <Text size="sm">目前沒有可顯示的路線資訊</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
      <Text size="sm" c="dimmed">此站路線</Text>
      <Tabs
        value={selectedDirection}
        onChange={setSelectedDirection}
      >
        <Tabs.List>
          {routeSections.map((section) => (
            <Tabs.Tab key={section.direction} value={String(section.direction)}>
              {section.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <ScrollArea style={{ flex: 1, minHeight: 0 }}>
        <Stack gap="xs" pt="sm">
          {routeSections
            .find((section) => String(section.direction) === selectedDirection)
            ?.routes.map((route) => (
              <Stack key={route.id} gap="xs">
                <RouteInfoCard
                  to={`/routes/${route.city}/${route.routeUID}`}
                  name={route.name}
                  city={route.city}
                  departure={route.departure}
                  destination={route.destination}
                />
              </Stack>
            ))}
        </Stack>
      </ScrollArea>
    </Stack>
  )
}
