import { List } from '@mantine/core'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { favoriteSelectors } from '~/modules/slices/favoriteSlice'

export default function Favorite() {
  const favoriteRouteStops = useSelector(favoriteSelectors.getFavoriteRouteStops)

  const list = useMemo(() => favoriteRouteStops.map((stop) => ({
    name: stop.StopName.zh_TW
  })), [favoriteRouteStops])

  return (
    <List>
      {list.map((el) => (
        <List.Item key={el.name}>{el.name}</List.Item>
      ))}
    </List>
  )
}
