import { List } from '@mantine/core'

// TODO: useSelector to get favorite route stops and display them in the list

export default function Favorite() {
  // const favoriteRouteStops = useSelector(favoriteSelectors.getFavoriteRouteStops)

  // const list = useMemo(() => favoriteRouteStops.map((stop) => ({
  //   name: stop.StopName.zh_TW
  // })), [favoriteRouteStops])

  return (
    <List>
      {/* {list.map((el) => (
        <List.Item key={el.name}>{el.name}</List.Item>
      ))} */}
    </List>
  )
}
