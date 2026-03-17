import { Badge, Card, Flex, NavLink, Stack, Tabs, Text } from '@mantine/core'
import { Link } from 'react-router'
import { cityMapName } from '~/modules/consts/city'
import { directionMapName } from '~/modules/consts/direction'
import { DirectionType } from '~/modules/enums/DirectionType'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { getEnumValues } from '~/modules/utils/getEnumValues'

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
                  <Card
                    withBorder
                    radius="md"
                    p="xs"
                    shadow="xs"
                  >
                    <NavLink
                      component={Link}
                      to={`/bus-route/${route.city}/${route.routeUID}`}
                      variant="light"
                      color="blue"
                      px="xs"
                      py={6}
                      bdrs="sm"
                      label={(
                        <Stack gap={8}>
                          <Flex justify="space-between" align="center">
                            <Badge
                              variant="light"
                              color="blue"
                              radius="sm"
                              size="lg"
                            >
                              {route.name}
                            </Badge>
                            <Badge
                              variant="light"
                              color="gray"
                              radius="sm"
                              size="lg"
                            >
                              {cityMapName[route.city]}
                            </Badge>
                          </Flex>
                          <Text size="xs" c="dimmed">起訖站</Text>
                          <Text size="sm">{`${route.departure} → ${route.destination}`}</Text>
                        </Stack>
                      )}
                    />
                  </Card>
                </Stack>
              ))}
            </Stack>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Stack>
  )
}
