import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import busReducer from '../slices/busSlice'
import tokenReducer from '../slices/tokenSlice'

export const store = configureStore({
    reducer: {
      tokenReducer,
      busReducer
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

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
