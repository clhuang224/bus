import { Flex, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { useMemo } from 'react'
import { BaseAlert } from '~/components/common/BaseAlert'
import { FavoriteRouteStopCard } from '~/components/favorite/FavoriteRouteStopCard'
import { favoriteMessages } from '~/modules/consts/pageMessages'
import { useFavoriteRouteStops } from '~/modules/hooks/useFavoriteRouteStops'

const favoriteRouteStopCollator = new Intl.Collator('zh-Hant-u-co-stroke', {
  numeric: true
})

export default function Favorite() {
  const { favoriteRouteStops, removeFavoriteRouteStop } = useFavoriteRouteStops()

  const sortedFavoriteRouteStops = useMemo(() => {
    return [...favoriteRouteStops].sort((left, right) => {
      const routeResult = favoriteRouteStopCollator.compare(left.routeName, right.routeName)
      if (routeResult !== 0) return routeResult

      return left.stopSequence - right.stopSequence
    })
  }, [favoriteRouteStops])

  return (
    <Flex justify="center" h="100%">
      <Stack p="lg" w="100%" maw={720} h="100%" gap="md">
        <Stack gap={4}>
          <Title order={3}>我的最愛</Title>
          <Text size="sm" c="dimmed">
            收藏常用的公車路線站牌，之後可以直接回到對應路線查看。
          </Text>
        </Stack>
        {sortedFavoriteRouteStops.length === 0
          ? (
            <BaseAlert {...favoriteMessages.emptyFavoriteRouteStops} />
          )
          : (
            <ScrollArea style={{ flex: 1, minHeight: 0 }}>
              <Stack gap="sm">
                {sortedFavoriteRouteStops.map((favoriteRouteStop) => (
                  <FavoriteRouteStopCard
                    key={favoriteRouteStop.favoriteId}
                    favoriteRouteStop={favoriteRouteStop}
                    onRemove={removeFavoriteRouteStop}
                  />
                ))}
              </Stack>
            </ScrollArea>
          )}
      </Stack>
    </Flex>
  )
}
