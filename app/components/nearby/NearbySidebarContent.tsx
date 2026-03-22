import { Accordion, AccordionControl, AccordionItem, AccordionPanel, ActionIcon, Flex, ScrollArea, Skeleton, Stack, Text, Title } from '@mantine/core'
import { RiArrowLeftSLine } from '@remixicon/react'
import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { BaseAlert } from '~/components/common/BaseAlert'
import { SkeletonList } from '~/components/common/SkeletonList'
import type { AlertMessageConfig } from '~/modules/interfaces/AlertMessageConfig'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'
import { getCityLabel } from '~/modules/utils/getCityLabel'
import { NearbyStopDetail } from './NearbyStopDetail'
import { NearbyStopRoutes } from './NearbyStopRoutes'

type StopItemRefs = RefObject<Map<string, HTMLDivElement | null>>

interface NearbySidebarListState {
  isStopsLoading: boolean
  isStationRoutesLoading: boolean
  nearbyStopGroups: NearbyStopGroup[]
  onSelectStop: (value: string | null) => void
  onViewRoutes: (stationID: string) => void
  scrollViewportRef: RefObject<HTMLDivElement | null>
  selectedStopId: string | null
  stationRouteBadgesMap: Map<string, Array<Pick<StationRoute, 'routeUID' | 'name'>>>
  stopItemRefs: StopItemRefs
}

interface NearbySidebarDetailState {
  isStationRoutesLoading: boolean
  onBack: () => void
  stopGroup: NearbyStopGroup | null
  stationRoutes: StationRoute[]
}

interface PropType {
  detailState: NearbySidebarDetailState
  listState: NearbySidebarListState
  message: AlertMessageConfig | null
}

const NearbySidebarContentDetail = ({ detailState }: { detailState: NearbySidebarDetailState }) => {
  const { t } = useTranslation()

  return (
    <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
      <Flex gap="xs" align="center">
        <ActionIcon
          aria-label={t('components.nearbySidebarContent.backAriaLabel')}
          onClick={detailState.onBack}
        >
          <RiArrowLeftSLine size={18} />
        </ActionIcon>
        <Title order={4}>{detailState.stopGroup!.StopName.zh_TW}</Title>
      </Flex>
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">{t('components.nearbyStopDetail.cityLabel')}</Text>
          <Text size="sm">
            {detailState.stopGroup!.City
              ? getCityLabel(t, detailState.stopGroup!.City)
              : t('components.nearbyStopDetail.notProvided')}
          </Text>
        </Stack>
        <Stack gap={2}>
          <Text size="sm" c="dimmed">{t('components.nearbyStopDetail.addressLabel')}</Text>
          <Text size="sm">
            {Array.from(new Set(detailState.stopGroup!.stops.map((stop) => stop.StopAddress).filter(Boolean))).join('、') ||
              t('components.nearbyStopDetail.notProvided')}
          </Text>
        </Stack>
        <NearbyStopRoutes
          routes={detailState.stationRoutes}
          isLoading={detailState.isStationRoutesLoading}
        />
      </Stack>
    </Stack>
  )
}

const NearbySidebarContentList = ({ listState }: { listState: NearbySidebarListState }) => (
  <ScrollArea
    viewportRef={listState.scrollViewportRef}
    style={{ flex: 1, minHeight: 0 }}
  >
    {listState.isStopsLoading && (
      <SkeletonList
        count={5}
        gap="sm"
        testId="nearby-stops-skeleton"
      >
        <Skeleton h={56} radius="md" />
      </SkeletonList>
    )}
    {!listState.isStopsLoading && (
    <Accordion
      variant="separated"
      value={listState.selectedStopId}
      onChange={listState.onSelectStop}
    >
      {listState.nearbyStopGroups.map((stopGroup) => (
        <AccordionItem
          value={stopGroup.StationID}
          key={stopGroup.StationID}
          ref={(node) => {
            if (node) {
              listState.stopItemRefs.current.set(stopGroup.StationID, node)
            } else {
              listState.stopItemRefs.current.delete(stopGroup.StationID)
            }
          }}
        >
          <AccordionControl>
            {stopGroup.StopName.zh_TW}
          </AccordionControl>
          <AccordionPanel>
            <NearbyStopDetail
              stopGroup={stopGroup}
              routes={listState.stationRouteBadgesMap.get(stopGroup.StationID) ?? []}
              isRoutesLoading={listState.isStationRoutesLoading && listState.selectedStopId === stopGroup.StationID}
              onViewRoutes={listState.onViewRoutes}
            />
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
    )}
  </ScrollArea>
)

export const NearbySidebarContent = ({
  detailState,
  listState,
  message
}: PropType) => (
  <Flex direction="column" h="100%" gap="md">
    {message && <BaseAlert {...message} />}
    { detailState.stopGroup
      ? <NearbySidebarContentDetail detailState={detailState} />
      : <NearbySidebarContentList listState={listState} />
    }
  </Flex>
)
