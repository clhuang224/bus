import { Badge, Button, Flex, Stack, Text } from '@mantine/core'
import { cityMapName } from '~/modules/consts/city'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'

interface PropType {
  stopGroup: NearbyStopGroup
  routes: Array<Pick<StationRoute, 'routeUID' | 'name'>>
  onViewRoutes: (stationID: string) => void
}

const renderInfoRow = (label: string, value: string) => (
  <Stack gap={2}>
    <Text size="sm" c="dimmed">{label}</Text>
    <Text size="sm">{value}</Text>
  </Stack>
)

export const NearbyStopDetail = ({ stopGroup, routes, onViewRoutes }: PropType) => (
  <Stack gap="xs">
    {renderInfoRow('縣市', stopGroup.City ? cityMapName[stopGroup.City] : '未提供')}
    {renderInfoRow(
      '地址',
      Array.from(new Set(stopGroup.stops.map((stop) => stop.StopAddress).filter(Boolean))).join('、') || '未提供'
    )}
    <Stack gap={4}>
      <Text size="sm" c="dimmed">路線</Text>
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
    </Stack>
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
