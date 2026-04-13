import { Card, Flex, ScrollArea, Skeleton, Stack, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { AreaSelect } from '~/components/AreaSelect'
import { SearchInput } from '~/components/SearchInput'
import { BaseAlert } from '~/components/common/BaseAlert'
import { RouteInfoCard } from '~/components/route/RouteInfoCard'
import { APP_PAGE_PADDING } from '~/modules/consts/layout'
import { useRoutesData } from '~/modules/hooks/useRoutesData'

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
    showRecentRoutesTitle
  } = useRoutesData()

  const routeCardSkeletons = Array.from({ length: 6 }, (_, index) => (
    <Card key={index} withBorder radius="md" p="xs" shadow="xs" data-testid="routes-skeleton-card">
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
      <Card p={APP_PAGE_PADDING} w="100%" maw={720} h="100%" withBorder={false}>
        <Stack gap="md" h="100%">
          <Stack gap={4}>
            <Title order={3}>{t('pages.routes.title')}</Title>
          </Stack>
          <Flex gap="sm" align="stretch">
            <AreaSelect value={area} onChange={setArea} />
            <SearchInput value={keyword} onChange={setKeyword} />
          </Flex>
          {message && <BaseAlert {...message} />}
          <ScrollArea viewportRef={scrollViewportRef} style={{ flex: 1, minHeight: 0 }}>
            <Stack gap="sm">
              {showRecentRoutesTitle && (
                <Title order={5}>{t('pages.routes.recentViewedRoutesTitle')}</Title>
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
                  />
                ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </Card>
    </Flex>
  )
}
