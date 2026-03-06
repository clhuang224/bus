import { Alert, Card, Flex } from '@mantine/core'
import { useSelector } from 'react-redux'
import { AppMap } from '~/components/AppMap'
import type { RootState } from '~/modules/store'
import { GeoPermissionType } from '~/modules/enums/GeoPermissionType'
import { busApi } from '~/modules/apis/bus'
import { useCityByCoords } from '~/modules/hooks/useCityByCoords'
import { useMemo } from 'react'
import type { NearStop } from '~/modules/interfaces/NearStop'
import type { CoordsType } from '~/modules/types/CoordsType'

const Nearby = () => {
  const { coords, permission } = useSelector((state: RootState) => state.geolocation)
  const currentCity = useCityByCoords(coords)
  const { data: allStops, isLoading, error } = busApi.useGetNearStopsByCityQuery(
    currentCity,
    {
      skip: permission !== GeoPermissionType.GRANTED,
      selectFromResult: ({ data, ...rest }) => ({
        ...rest,
        data: (data ?? []).map((stop) => ({
          ...stop,
            GPSTime: stop.GPSTime ? new Date(stop.GPSTime) : null,
            TripStartTime: stop.TripStartTime ? new Date(stop.TripStartTime) : null,
            TransTime: stop.TransTime ? new Date(stop.TransTime) : null,
            SrcRecTime: stop.SrcRecTime ? new Date(stop.SrcRecTime) : null,
            SrcTransTime: stop.SrcTransTime ? new Date(stop.SrcTransTime) : null,
            SrcUpdateTime: stop.SrcUpdateTime ? new Date(stop.SrcUpdateTime) : null,
            UpdateTime: stop.UpdateTime ? new Date(stop.UpdateTime) : null
          }) as NearStop)
        })
      }
  )

  const markers = useMemo(() => allStops
    .filter(stop => stop.position)
    .map(stop => ({
      position: stop.position as CoordsType,
      label: `${stop.StopName.zh_TW} (${stop.RouteName.zh_TW})`
    })
  ), [allStops])

  const message = useMemo(() => {
    if (permission === GeoPermissionType.UNSUPPORTED) {
      return {
        color: 'red',
        title: '不支援定位',
        description: '您的瀏覽器不支援地理定位功能'
      }
    }
    if (permission === GeoPermissionType.DENIED) {
      return {
        color: 'red',
        title: '無法取得位置',
        description: '請在瀏覽器設定中允許此網站存取您的位置資訊'
      }
    }
    if (error) {
      return {
        color: 'red',
        title: '載入站牌資料失敗',
        description: '請稍後再試，或確認您的網路連線'
      }
    }
    if (isLoading) {
      return {
        color: 'blue',
        title: '載入中',
        description: '正在取得附近的站牌資料，請稍候...'
      }
    }
    if (allStops.length === 0) {
      return {
        color: 'yellow',
        title: '附近沒有站牌',
        description: '目前在您附近沒有找到任何站牌'
      }
    }
    return null
  }, [permission])

  return (
    <Flex>
      <Card shadow="sm" p="lg" w="375px" mih="400px">
        { message && (
          <Alert color={message.color} title={message.title}>
            {message.description}
          </Alert>
        )}
        {/* TODO: stop info list */}
      </Card>
      <AppMap
        center={coords}
        zoom={14}
        showUserLocation={true}
        markers={markers}
      />
    </Flex>
  )
}

export default Nearby
