import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  ActionIcon,
  Flex,
  Group,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { RiArrowLeftSLine } from '@remixicon/react'
import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { BaseAlert } from '~/components/common/BaseAlert'
import { NavigationButton } from '~/components/common/NavigationButton'
import { SkeletonList } from '~/components/common/SkeletonList'
import { StopDistanceText } from '~/components/common/StopDistanceText'
import type { AlertMessageConfig } from '~/modules/interfaces/AlertMessageConfig'
import type { NearbyStation } from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { selectLocale } from '~/modules/slices/localeSlice'
import { toLatLng } from '~/modules/utils/geo/convertCoordinates'
import { getCityTranslationKey } from '~/modules/utils/i18n/getCityTranslationKey'
import { getLocalizedText } from '~/modules/utils/i18n/getLocalizedText'
import { getStationBearingLabel } from '~/modules/utils/nearby/getStationBearingLabel'
import { NearbyStationDetail } from './NearbyStationDetail'
import { NearbyStopRoutes } from './NearbyStopRoutes'

type StationItemRefs = RefObject<Map<string, HTMLDivElement | null>>

interface NearbySidebarListState {
  hasStationRouteBadgesError: boolean
  isStationsLoading: boolean
  isStationRoutesLoading: boolean
  isStationRouteBadgesRateLimited: boolean
  nearbyStations: NearbyStation[]
  onSelectStation: (value: string | null) => void
  onViewStationRoutes: (stationId: string) => void
  scrollViewportRef: RefObject<HTMLDivElement | null>
  selectedStationId: string | null
  stationRouteBadgesMap: Map<
    string,
    Array<Pick<StationRoute, 'routeUID' | 'name'>>
  >
  stationItemRefs: StationItemRefs
}

interface NearbySidebarDetailState {
  hasStationRoutesError: boolean
  isStationRoutesLoading: boolean
  isStationRoutesRateLimited: boolean
  onBack: () => void
  station: NearbyStation | null
  stationRoutes: StationRoute[]
}

interface PropType {
  detailState: NearbySidebarDetailState
  listState: NearbySidebarListState
  message: AlertMessageConfig | null
}

const NearbySidebarContentDetail = ({
  detailState,
}: {
  detailState: NearbySidebarDetailState
}) => {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)
  const stationBearingLabel = getStationBearingLabel(t, detailState.station!)

  return (
    <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
      <Flex gap="xs" align="center">
        <ActionIcon
          aria-label={t('components.nearbySidebarContent.backAriaLabel')}
          onClick={detailState.onBack}
        >
          <RiArrowLeftSLine size={18} />
        </ActionIcon>
        <Title order={4} style={{ flex: 1, minWidth: 0 }} lineClamp={1}>
          {getLocalizedText(detailState.station!.name, locale)}
        </Title>
        {stationBearingLabel && (
          <Text size="sm" c="dimmed">
            {stationBearingLabel}
          </Text>
        )}
      </Flex>
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">
            {t('components.nearbyStopDetail.distanceLabel')}
          </Text>
          <Group align="center" wrap="nowrap" gap="xs">
            <StopDistanceText
              position={detailState.station!.position}
              size="sm"
            />
            <NavigationButton
              ariaLabel={t('components.routeStopList.navigateAriaLabel', {
                stopName: getLocalizedText(detailState.station!.name, locale),
              })}
              destination={toLatLng(detailState.station!.position)}
            />
          </Group>
        </Stack>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">
            {t('components.nearbyStopDetail.cityLabel')}
          </Text>
          <Text size="sm">
            {detailState.station!.city
              ? t(getCityTranslationKey(detailState.station!.city))
              : t('components.nearbyStopDetail.notProvided')}
          </Text>
        </Stack>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">
            {t('components.nearbyStopDetail.addressLabel')}
          </Text>
          <Text size="sm">
            {detailState.station!.address
              ? getLocalizedText(detailState.station!.address, locale)
              : t('components.nearbyStopDetail.notProvided')}
          </Text>
        </Stack>
        <NearbyStopRoutes
          hasError={detailState.hasStationRoutesError}
          routes={detailState.stationRoutes}
          isLoading={detailState.isStationRoutesLoading}
          isRateLimited={detailState.isStationRoutesRateLimited}
        />
      </Stack>
    </Stack>
  )
}

const NearbySidebarContentList = ({
  listState,
}: {
  listState: NearbySidebarListState
}) => {
  const { t } = useTranslation()
  const locale = useSelector(selectLocale)

  return (
    <ScrollArea
      viewportRef={listState.scrollViewportRef}
      style={{ flex: 1, minHeight: 0 }}
    >
      {listState.isStationsLoading && (
        <SkeletonList count={5} gap="sm" testId="nearby-stops-skeleton">
          <Skeleton h={56} radius="md" />
        </SkeletonList>
      )}
      {!listState.isStationsLoading && (
        <Accordion
          variant="separated"
          value={listState.selectedStationId}
          onChange={listState.onSelectStation}
        >
          {listState.nearbyStations.map((station) => {
            const stationBearingLabel = getStationBearingLabel(t, station)

            return (
              <AccordionItem
                value={station.stationId}
                key={station.stationId}
                ref={(node) => {
                  if (node) {
                    listState.stationItemRefs.current.set(
                      station.stationId,
                      node,
                    )
                  } else {
                    listState.stationItemRefs.current.delete(station.stationId)
                  }
                }}
              >
                <AccordionControl>
                  <Flex
                    justify="space-between"
                    align="center"
                    gap="xs"
                    w="100%"
                  >
                    <Text
                      style={{ flex: '1 1 auto', minWidth: 0 }}
                      lineClamp={1}
                    >
                      {getLocalizedText(station.name, locale)}
                    </Text>
                    {stationBearingLabel && (
                      <Text size="sm" c="dimmed" mr="xs">
                        {stationBearingLabel}
                      </Text>
                    )}
                  </Flex>
                </AccordionControl>
                <AccordionPanel>
                  <NearbyStationDetail
                    station={station}
                    hasRoutesError={listState.hasStationRouteBadgesError}
                    routes={
                      listState.stationRouteBadgesMap.get(station.stationId) ??
                      []
                    }
                    isRoutesLoading={
                      listState.isStationRoutesLoading &&
                      listState.selectedStationId === station.stationId
                    }
                    isRoutesRateLimited={
                      listState.isStationRouteBadgesRateLimited
                    }
                    onViewStationRoutes={listState.onViewStationRoutes}
                  />
                </AccordionPanel>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}
    </ScrollArea>
  )
}

export const NearbySidebarContent = ({
  detailState,
  listState,
  message,
}: PropType) => (
  <Flex direction="column" h="100%" gap="md">
    {message && <BaseAlert {...message} />}
    {detailState.station ? (
      <NearbySidebarContentDetail detailState={detailState} />
    ) : (
      <NearbySidebarContentList listState={listState} />
    )}
  </Flex>
)
