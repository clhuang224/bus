import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { useDispatch } from 'react-redux'
import { store } from '../../modules/store'
import type { AppDispatch } from '../../modules/store'
import favoriteSlice from '../../modules/slices/favoriteSlice'
import routeSearchSlice from '../../modules/slices/routeSearchSlice'
import { loadFavoriteRouteStopsFromStorage } from '../../modules/utils/favorite/favoriteRouteStopStorage'
import { loadRouteSearchFromStorage } from '../../modules/utils/routeSearch/routeSearchStorage'

interface PropType {
  children: React.ReactElement
}

function StorageInitializers() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(favoriteSlice.actions.restoreFavoriteRouteStopsFromStorage(loadFavoriteRouteStopsFromStorage()))
    dispatch(routeSearchSlice.actions.restoreRouteSearchFromStorage(loadRouteSearchFromStorage()))
  }, [dispatch])

  return null
}

export const StoreProvider = ({ children }: PropType): React.ReactElement<PropType> => {
  return (
    <Provider store={store}>
      <StorageInitializers />
      {children}
    </Provider>
  )
}
