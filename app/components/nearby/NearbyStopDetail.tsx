import { ActionIcon, Flex, Group, Skeleton, Stack, Text } from '@mantine/core'
import { RiArrowRightSLine } from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { AppBadge } from '~/components/common/AppBadge'
import { NavigationButton } from '~/components/common/NavigationButton'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { selectLocale } from '~/modules/slices/localeSlice'
import { getCityTranslationKey } from '~/modules/utils/i18n/getCityTranslationKey'
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
  const destination: [number, number] = [stopGroup.position[1], stopGroup.position[0]]

  if (displayMode === 'title') {
    return (
      <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
        <Text style={{ flex: 1, minWidth: 0 }} lineClamp={1}>
          {stopName}
        </Text>
        <NavigationButton
          ariaLabel={t('components.routeStopList.navigateAriaLabel', { stopName })}
          destination={destination}
        />
      </Group>
    )
  }

  const detailSections = [
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
      {(displayMode === 'full') && (
        <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
          <Text style={{ flex: 1, minWidth: 0 }} lineClamp={1}>
            {stopName}
          </Text>
          <NavigationButton
            ariaLabel={t('components.routeStopList.navigateAriaLabel', { stopName })}
            destination={destination}
          />
        </Group>
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
