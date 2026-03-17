import { Badge, Button, Flex, Stack, Text } from '@mantine/core'
import { cityMapName } from '~/modules/consts/city'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'

interface PropType {
  stopGroup: NearbyStopGroup
  routes: Array<Pick<StationRoute, 'routeUID' | 'name'>>
  onViewRoutes: (stationID: string) => void
}

export const NearbyStopDetail = ({ stopGroup, routes, onViewRoutes }: PropType) => {
  const detailSections = [
    {
      label: '縣市',
      content: (
        <Text size="sm">{stopGroup.City ? cityMapName[stopGroup.City] : '未提供'}</Text>
      )
    },
    {
      label: '地址',
      content: (
        <Text size="sm">
          {Array.from(new Set(stopGroup.stops.map((stop) => stop.StopAddress).filter(Boolean))).join('、') || '未提供'}
        </Text>
      )
    },
    {
      label: '路線',
      content: (
        <Flex gap="xs" wrap="wrap">
          {routes.map((route) => (
            <Badge
              key={route.routeUID}
              variant="light"
              color="blue"
              radius="sm"
              size="lg"
            >
              {route.name}
            </Badge>
          ))}
        </Flex>
      )
    }
  ]

  return (
    <Stack gap="xs">
      {detailSections.map((section) => (
        <Stack key={section.label} gap={4}>
          <Text size="sm" c="dimmed">{section.label}</Text>
          {section.content}
        </Stack>
      ))}
      <Button
        variant="subtle"
        p={0}
        justify="flex-start"
        onClick={() => onViewRoutes(stopGroup.StationID)}
      >
        查看此站路線
      </Button>
    </Stack>
  )
}
