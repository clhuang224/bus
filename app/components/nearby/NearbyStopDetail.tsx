import { ActionIcon, Flex, Stack, Text } from '@mantine/core'
import { RiArrowRightSLine } from '@remixicon/react'
import { AppBadge } from '~/components/common/AppBadge'
import { cityMapName } from '~/modules/consts/city'
import type { NearbyStopGroup } from '~/modules/interfaces/Nearby'
import type { StationRoute } from '~/modules/interfaces/StationRoute'

interface PropType {
  stopGroup: NearbyStopGroup
  routes: Array<Pick<StationRoute, 'routeUID' | 'name'>>
  onViewRoutes: (stationID: string) => void
  displayMode?: 'content' | 'full' | 'title'
}

export const NearbyStopDetail = ({
  stopGroup,
  routes,
  onViewRoutes,
  displayMode = 'content'
}: PropType) => {
  if (displayMode === 'title') {
    return <Text>{stopGroup.StopName.zh_TW}</Text>
  }

  const detailSections = [
    {
      label: '縣市',
      content: (
        <Text size="sm">{stopGroup.City ? cityMapName[stopGroup.City] : '未提供'}</Text>
      )
    },
    {
      label: '地址',
      content: (
        <Text size="sm">
          {Array.from(new Set(stopGroup.stops.map((stop) => stop.StopAddress).filter(Boolean))).join('、') || '未提供'}
        </Text>
      )
    },
    {
      label: '路線',
      content: (
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
          <Text>{stopGroup.StopName.zh_TW}</Text>
      )}
      {detailSections.map((section) => (
        <Stack key={section.label} gap={4}>
          <Text size="sm" c="dimmed">{section.label}</Text>
          {section.content}
        </Stack>
      ))}
      <ActionIcon
        ml="auto"
        onClick={() => onViewRoutes(stopGroup.StationID)}
      >
        <RiArrowRightSLine size={18}/>
      </ActionIcon>
    </Stack>
  )
}
