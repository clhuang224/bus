import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { FavoriteRouteStop } from '../interfaces/FavoriteRouteStop'
import type { AppDispatch } from '../store'
import favoriteSlice from '../slices/favoriteSlice'

export function useFavoriteRouteStops() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(favoriteSlice.actions.loadLocalStorage())
  }, [dispatch])

  const favoriteRouteStops = useSelector(favoriteSlice.selectors.getFavoriteRouteStops)

  const addFavoriteRouteStop = (routeStop: FavoriteRouteStop) => {
    dispatch(favoriteSlice.actions.addFavoriteRouteStop(routeStop))
  }

  const removeFavoriteRouteStop = (routeStop: FavoriteRouteStop) => {
    dispatch(favoriteSlice.actions.removeFavoriteRouteStop(routeStop))
  }

  const isFavoriteRouteStop = (favoriteId: string) =>
    favoriteRouteStops.some((routeStop) => routeStop.favoriteId === favoriteId)

  const toggleFavoriteRouteStop = (routeStop: FavoriteRouteStop) => {
    if (isFavoriteRouteStop(routeStop.favoriteId)) {
      removeFavoriteRouteStop(routeStop)
      return
    }

    addFavoriteRouteStop(routeStop)
  }

  return {
    addFavoriteRouteStop,
    favoriteRouteStops,
    isFavoriteRouteStop,
    removeFavoriteRouteStop,
    toggleFavoriteRouteStop
  }
}
