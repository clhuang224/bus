import { ActionIcon, Box, Card, Flex, Group, Stack, Text } from '@mantine/core'
import { RiHeart2Fill } from '@remixicon/react'
import { Link } from 'react-router'
import { AppBadge } from '~/components/common/AppBadge'
import { cityMapName } from '~/modules/consts/city'
import { directionMapName } from '~/modules/consts/direction'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'

interface PropType {
  favoriteRouteStop: FavoriteRouteStop
  onRemove: (routeStop: FavoriteRouteStop) => void
}

export const FavoriteRouteStopCard = ({ favoriteRouteStop, onRemove }: PropType) => (
  <Card
    withBorder
    radius="md"
    p="md"
    shadow="xs"
  >
    <Stack gap="sm">
      <Flex justify="space-between" align="flex-start" gap="sm">
        <Box
          component={Link}
          to={`/routes/${favoriteRouteStop.city}/${favoriteRouteStop.routeUID}`}
          style={{
            color: 'inherit',
            flex: 1,
            minWidth: 0,
            textDecoration: 'none'
          }}
        >
          <Stack gap="xs">
            <Group gap="xs" wrap="wrap">
              <AppBadge type="route">
                {[
                  favoriteRouteStop.routeName,
                  favoriteRouteStop.subRouteName === favoriteRouteStop.routeName ? null : favoriteRouteStop.subRouteName,
                  directionMapName[favoriteRouteStop.direction]
                ].filter(Boolean).join(' ')}
              </AppBadge>
              <AppBadge type="city">
                {cityMapName[favoriteRouteStop.city]}
              </AppBadge>
            </Group>
            <Text p="sm">
              {favoriteRouteStop.stopSequence}. {favoriteRouteStop.stopName}
            </Text>
            <Text size="xs" c="dimmed">
              起訖站：{favoriteRouteStop.departure} → {favoriteRouteStop.destination}
            </Text>
          </Stack>
        </Box>
        <ActionIcon
          variant="subtle"
          color="pink"
          radius="50%"
          aria-label="移除收藏站牌路線"
          onClick={() => onRemove(favoriteRouteStop)}
        >
          <RiHeart2Fill />
        </ActionIcon>
      </Flex>
    </Stack>
  </Card>
)
