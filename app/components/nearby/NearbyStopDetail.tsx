import { ActionIcon, Flex, Group, Skeleton, Stack, Text } from '@mantine/core'
import { RiArrowRightSLine } from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { AppBadge } from '~/components/common/AppBadge'
import { NavigationButton } from '~/components/common/NavigationButton'
import { StopDistanceText } from '~/components/common/StopDistanceText'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { selectLocale } from '~/modules/slices/localeSlice'
import { toLatLng } from '~/modules/utils/geo/convertCoordinates'
import { getCityTranslationKey } from '~/modules/utils/i18n/getCityTranslationKey'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { getStopGroupBearingLabel } from '~/modules/utils/nearby/getStopGroupBearingLabel'

interface PropType {
  stopGroup: NearbyStopGroup
  routes: Array<Pick<StationRoute, 'routeUID' | 'name'>>
  hasRoutesError?: boolean
  isRoutesLoading?: boolean
  isRoutesRateLimited?: boolean
  onViewRoutes: (stationID: string) => void
  displayMode?: 'content' | 'full' | 'title'
}

export const NearbyStopDetail = ({
  stopGroup,
  routes,
  hasRoutesError = false,
  isRoutesLoading = false,
  isRoutesRateLimited = false,
  onViewRoutes,
  displayMode = 'content'
}: PropType) => {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const stopName = getLocalizedText(stopGroup.StopName, locale)
  const destination = toLatLng(stopGroup.position)!
  const bearingLabel = getStopGroupBearingLabel(t, stopGroup)

  if (displayMode === 'title') {
    return (
      <Flex gap="xs" align="center" wrap="nowrap">
        <Text style={{ flex: 1, minWidth: 0 }} lineClamp={1}>
          {stopName}
        </Text>
        <Text size="sm" c="dimmed" mr="xs">
          {bearingLabel}
        </Text>
      </Flex>
    )
  }

  const detailSections = [
    {
      label: t('components.nearbyStopDetail.distanceLabel'),
      content: (
        <Group align="center" wrap="nowrap" gap="xs">
          <StopDistanceText position={stopGroup.position} size="sm" />
          <NavigationButton
            ariaLabel={t('components.routeStopList.navigateAriaLabel', { stopName })}
            destination={destination}
          />
        </Group>
      )
    },
    {
      label: t('components.nearbyStopDetail.cityLabel'),
      content: (
        <Text size="sm">
          {stopGroup.City ? t(getCityTranslationKey(stopGroup.City)) : t('components.nearbyStopDetail.notProvided')}
        </Text>
      )
    },
    {
      label: t('components.nearbyStopDetail.addressLabel'),
      content: (
        <Text size="sm">
          {Array.from(new Set(stopGroup.stops.map((stop) => stop.StopAddress).filter(Boolean))).join('、') ||
            t('components.nearbyStopDetail.notProvided')}
        </Text>
      )
    },
    {
      label: t('components.nearbyStopDetail.routesLabel'),
      content: isRoutesLoading
        ? (
          <Flex gap="xs" wrap="wrap" data-testid="nearby-stop-routes-skeleton">
            <Skeleton h={26} w={56} radius="xl" />
            <Skeleton h={26} w={64} radius="xl" />
            <Skeleton h={26} w={52} radius="xl" />
          </Flex>
          )
        : isRoutesRateLimited
          ? (
            <Text size="sm">
              {t('components.nearbyStopRoutes.rateLimited')}
            </Text>
            )
          : hasRoutesError
            ? (
              <Text size="sm">
                {t('components.nearbyStopRoutes.error')}
              </Text>
              )
        : (
          <Flex gap="xs" wrap="wrap">
            {routes.map((route) => (
              <AppBadge key={route.routeUID} type="route">
                {route.name}
              </AppBadge>
            ))}
          </Flex>
          )
    }
  ]

  return (
    <Stack gap="xs">
      {displayMode === 'full' && (
        <Stack
          gap={4}
          pb="xs"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backgroundColor: 'var(--mantine-color-body)'
          }}
        >
          <Flex gap="xs" align="center" wrap="nowrap">
            <Text style={{ flex: 1, minWidth: 0 }} lineClamp={1}>
              {stopName}
            </Text>
            <Text size="sm" c="dimmed" mr="xs">
              {bearingLabel}
            </Text>
          </Flex>
        </Stack>
      )}
      {detailSections.map((section) => (
        <Stack key={section.label} gap={4}>
          <Text size="sm" c="dimmed">{section.label}</Text>
          {section.content}
        </Stack>
      ))}
      <Group justify="flex-end" gap="xs">
        <ActionIcon
          aria-label={t('components.nearbyStopDetail.viewRoutesAriaLabel', { stopName })}
          onClick={() => onViewRoutes(stopGroup.StationID)}
        >
          <RiArrowRightSLine size={18}/>
        </ActionIcon>
      </Group>
    </Stack>
  )
}
