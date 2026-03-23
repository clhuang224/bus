import { ActionIcon, Box, Card, Flex, Group, Stack, Text } from '@mantine/core'
import { RiHeart2Fill } from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AppBadge } from '~/components/common/AppBadge'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import { getCityLabel } from '~/modules/utils/getCityLabel'
import { getDirectionLabel } from '~/modules/utils/getDirectionLabel'

interface PropType {
  favoriteRouteStop: FavoriteRouteStop
  onRemove: (routeStop: FavoriteRouteStop) => void
}

export const FavoriteRouteStopCard = ({ favoriteRouteStop, onRemove }: PropType) => {
  const { t } = useTranslation()

  return (
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
            state={{ favoriteRouteStop }}
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
                    getDirectionLabel(t, favoriteRouteStop.direction)
                  ].filter(Boolean).join(' ')}
                </AppBadge>
                <AppBadge type="city">
                  {getCityLabel(t, favoriteRouteStop.city)}
                </AppBadge>
              </Group>
              <Text p="sm">
                {favoriteRouteStop.stopSequence}. {favoriteRouteStop.stopName}
              </Text>
              <Text size="xs" c="dimmed">
                {t('components.favoriteRouteStopCard.terminal', {
                  departure: favoriteRouteStop.departure,
                  destination: favoriteRouteStop.destination
                })}
              </Text>
            </Stack>
          </Box>
          <ActionIcon
            variant="subtle"
            color="pink"
            radius="50%"
            aria-label={t('components.favoriteRouteStopCard.removeAriaLabel')}
            onClick={() => onRemove(favoriteRouteStop)}
          >
            <RiHeart2Fill />
          </ActionIcon>
        </Flex>
      </Stack>
    </Card>
  )
}
