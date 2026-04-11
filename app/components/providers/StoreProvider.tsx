import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { useDispatch } from 'react-redux'
import { store } from '../../modules/store'
import type { AppDispatch } from '../../modules/store'
import favoriteSlice from '../../modules/slices/favoriteSlice'
import { loadFavoriteRouteStopsFromStorage } from '../../modules/utils/favorite/favoriteRouteStopStorage'

interface PropType {
  children: React.ReactElement
}

function FavoriteInitializer() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(favoriteSlice.actions.restoreFavoriteRouteStopsFromStorage(loadFavoriteRouteStopsFromStorage()))
  }, [dispatch])

  return null
}

export const StoreProvider = ({ children }: PropType): React.ReactElement<PropType> => {
  return (
    <Provider store={store}>
      <FavoriteInitializer />
      {children}
    </Provider>
  )
}
