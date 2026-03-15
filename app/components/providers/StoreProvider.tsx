import { Provider } from 'react-redux'
import { store } from '../../modules/store'

interface PropType {
  children: React.ReactElement
}

export const StoreProvider = ({ children }: PropType): React.ReactElement<PropType> => {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}
