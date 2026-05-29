import { ScrollArea, Skeleton, Stack, Tabs, Text } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SkeletonList } from '~/components/common/SkeletonList'
import { useLocalizedTextCollator } from '~/modules/hooks/shared/useLocalizedTextCollator'
import { DirectionType } from '~/modules/enums/DirectionType'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { getDirectionTranslationKey } from '~/modules/utils/i18n/getDirectionTranslationKey'
import { getEnumValues } from '~/modules/utils/shared/getEnumValues'
import { RouteInfoCard } from '../route/RouteInfoCard'

interface PropType {
  hasError?: boolean
  routes: StationRoute[]
  isLoading?: boolean
  isRateLimited?: boolean
}

function getDefaultRouteDirection(directions: DirectionType[]) {
  return directions[0] != null ? String(directions[0]) : null
}

export const NearbyStopRoutes = ({
  routes,
  hasError = false,
  isLoading = false,
  isRateLimited = false
}: PropType) => {
  const { t } = useTranslation()
  const routeNameCollator = useLocalizedTextCollator()
  const routeSections = useMemo(() => getEnumValues(DirectionType)
    .map((direction) => ({
      direction,
      label: t(getDirectionTranslationKey(direction)),
      routes: routes
        .filter((route) => route.direction === direction)
        .sort((left, right) => routeNameCollator.compare(left.name, right.name))
    }))
    .filter((section) => section.routes.length > 0), [routeNameCollator, routes, t])
  const [selectedDirection, setSelectedDirection] = useState<string | null>(
    getDefaultRouteDirection(routeSections.map((section) => section.direction))
  )

  useEffect(() => {
    const defaultDirection = getDefaultRouteDirection(
      routeSections.map((section) => section.direction)
    )

    if (!defaultDirection) {
      setSelectedDirection(null)
      return
    }

    const hasSelectedDirection = routeSections.some(
      (section) => String(section.direction) === selectedDirection
    )

    if (!hasSelectedDirection) {
      setSelectedDirection(defaultDirection)
    }
  }, [routeSections, selectedDirection])

  if (isLoading) {
    return (
      <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
        <Text size="sm" c="dimmed">{t('components.nearbyStopRoutes.title')}</Text>
        <Tabs value={null}>
          <Tabs.List>
            <Tabs.Tab value="loading-go">{t('common.direction.go')}</Tabs.Tab>
            <Tabs.Tab value="loading-return">{t('common.direction.return')}</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        <ScrollArea style={{ flex: 1, minHeight: 0 }} data-testid="nearby-stop-routes-skeleton">
          <SkeletonList count={3} gap="xs" pt="sm">
            <Skeleton h={84} radius="md" />
          </SkeletonList>
        </ScrollArea>
      </Stack>
    )
  }

  if (routeSections.length === 0) {
    return (
      <Stack gap={4}>
        <Text size="sm" c="dimmed">{t('components.nearbyStopRoutes.title')}</Text>
        <Text size="sm">
          {isRateLimited
            ? t('components.nearbyStopRoutes.rateLimited')
            : hasError
              ? t('components.nearbyStopRoutes.error')
              : t('components.nearbyStopRoutes.empty')}
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
      <Text size="sm" c="dimmed">{t('components.nearbyStopRoutes.title')}</Text>
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
