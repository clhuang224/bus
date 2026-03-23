import { ActionIcon, Box, Card, Flex, Group, Stack, Text } from '@mantine/core'
import { RiHeart2Fill } from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link } from 'react-router'
import { AppBadge } from '~/components/common/AppBadge'
import type { FavoriteRouteStop } from '~/modules/interfaces/FavoriteRouteStop'
import { selectLocale } from '~/modules/slices/localeSlice'
import { getCityLabel } from '~/modules/utils/getCityLabel'
import { getDirectionLabel } from '~/modules/utils/getDirectionLabel'
import { getLocalizedText } from '~/modules/utils/getLocalizedText'

interface PropType {
  favoriteRouteStop: FavoriteRouteStop
  onRemove: (routeStop: FavoriteRouteStop) => void
}

export const FavoriteRouteStopCard = ({ favoriteRouteStop, onRemove }: PropType) => {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const routeName = getLocalizedText(favoriteRouteStop.routeName, locale)
  const subRouteName = getLocalizedText(favoriteRouteStop.subRouteName, locale)
  const stopName = getLocalizedText(favoriteRouteStop.stopName, locale)
  const departure = getLocalizedText(favoriteRouteStop.departure, locale)
  const destination = getLocalizedText(favoriteRouteStop.destination, locale)

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
                    routeName,
                    subRouteName === routeName ? null : subRouteName,
                    getDirectionLabel(t, favoriteRouteStop.direction)
                  ].filter(Boolean).join(' ')}
                </AppBadge>
                <AppBadge type="city">
                  {getCityLabel(t, favoriteRouteStop.city)}
                </AppBadge>
              </Group>
              <Text p="sm">
                {favoriteRouteStop.stopSequence}. {stopName}
              </Text>
              <Text size="xs" c="dimmed">
                {t('components.favoriteRouteStopCard.terminal', {
                  departure,
                  destination
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
