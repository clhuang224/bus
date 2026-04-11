import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { useDispatch } from 'react-redux'
import { store } from '../../modules/store'
import type { AppDispatch } from '../../modules/store'
import { initializeFavoriteRouteStopsFromCache } from '../../modules/slices/favoriteSlice'

interface PropType {
  children: React.ReactElement
}

function FavoriteInitializer() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(initializeFavoriteRouteStopsFromCache())
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
