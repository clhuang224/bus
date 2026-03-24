import { ActionIcon, Flex, Skeleton, Stack, Text } from '@mantine/core'
import { RiArrowRightSLine } from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { AppBadge } from '~/components/common/AppBadge'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { selectLocale } from '~/modules/slices/localeSlice'
import { getCityLabel } from '~/modules/utils/i18n/getCityLabel'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'

interface PropType {
  stopGroup: NearbyStopGroup
  routes: Array<Pick<StationRoute, 'routeUID' | 'name'>>
  isRoutesLoading?: boolean
  onViewRoutes: (stationID: string) => void
  displayMode?: 'content' | 'full' | 'title'
}

export const NearbyStopDetail = ({
  stopGroup,
  routes,
  isRoutesLoading = false,
  onViewRoutes,
  displayMode = 'content'
}: PropType) => {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const stopName = getLocalizedText(stopGroup.StopName, locale)

  if (displayMode === 'title') {
    return <Text>{stopName}</Text>
  }

  const detailSections = [
    {
      label: t('components.nearbyStopDetail.cityLabel'),
      content: (
        <Text size="sm">
          {stopGroup.City ? getCityLabel(t, stopGroup.City) : t('components.nearbyStopDetail.notProvided')}
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
          <Text>{stopName}</Text>
      )}
      {detailSections.map((section) => (
        <Stack key={section.label} gap={4}>
          <Text size="sm" c="dimmed">{section.label}</Text>
          {section.content}
        </Stack>
      ))}
      <ActionIcon
        ml="auto"
        aria-label={t('components.nearbyStopDetail.viewRoutesAriaLabel', { stopName })}
        onClick={() => onViewRoutes(stopGroup.StationID)}
      >
        <RiArrowRightSLine size={18}/>
      </ActionIcon>
    </Stack>
  )
}
