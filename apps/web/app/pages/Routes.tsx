import { Card, Flex, ScrollArea, Skeleton, Stack, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { AreaSelect } from '~/components/AreaSelect'
import { SearchInput } from '~/components/SearchInput'
import { BaseAlert } from '~/components/common/BaseAlert'
import { RouteInfoCard } from '~/components/route/RouteInfoCard'
import { APP_PAGE_MAX_WIDTH, APP_PAGE_PADDING } from '~/modules/consts/layout'
import { useRoutesData } from '~/modules/hooks/routes/useRoutesData'

export default function Routes() {
  const { t } = useTranslation()
  const {
    area,
    displayedRoutes,
    isLoading,
    keyword,
    message,
    scrollViewportRef,
    setArea,
    setKeyword,
    showRecentRoutesTitle,
    trackRouteSelected,
  } = useRoutesData()

  const routeCardSkeletons = Array.from({ length: 6 }, (_, index) => (
    <Card key={index} p="xs" data-testid="routes-skeleton-card">
      <Stack gap={8}>
        <Flex justify="space-between" align="center">
          <Skeleton h={26} w={64} radius="xl" />
          <Skeleton h={26} w={72} radius="xl" />
        </Flex>
        <Skeleton h={14} radius="sm" />
      </Stack>
    </Card>
  ))

  return (
    <Flex justify="center" h="100%">
      <Stack
        p={APP_PAGE_PADDING}
        w="100%"
        maw={APP_PAGE_MAX_WIDTH}
        h="100%"
        gap="md"
      >
        <Stack gap={4}>
          <Title order={2} size="h3">
            {t('pages.routes.title')}
          </Title>
        </Stack>
        <Flex gap="sm" align="stretch">
          <AreaSelect value={area} onChange={setArea} />
          <SearchInput value={keyword} onChange={setKeyword} />
        </Flex>
        {message && <BaseAlert {...message} />}
        <ScrollArea viewportRef={scrollViewportRef} flex={1} mih={0}>
          <Stack gap="sm">
            {showRecentRoutesTitle && (
              <Title order={3} size="h5">
                {t('pages.routes.recentViewedRoutesTitle')}
              </Title>
            )}
            {isLoading
              ? routeCardSkeletons
              : displayedRoutes.map((route) => (
                  <RouteInfoCard
                    key={route.routeUID}
                    to={route.to}
                    name={route.name}
                    city={route.city}
                    departure={route.departure}
                    destination={route.destination}
                    onClick={() => trackRouteSelected(route)}
                  />
                ))}
          </Stack>
        </ScrollArea>
      </Stack>
    </Flex>
  )
}
