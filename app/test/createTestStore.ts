import {
  configureStore,
  type ConfigureStoreOptions,
  type ReducersMapObject,
  type StateFromReducersMapObject,
  type UnknownAction
} from '@reduxjs/toolkit'
import { AppLocaleType } from '~/modules/enums/AppLocaleType'
import analyticsSlice from '~/modules/slices/analyticsSlice'
import localeSlice from '~/modules/slices/localeSlice'

type LocaleTestState = {
  analytics: {
    isEnabled: boolean
  }
  locale: {
    value: AppLocaleType
  }
}

interface CreateTestStoreOptions<TState extends Record<string, unknown>> {
  middleware?: ConfigureStoreOptions<LocaleTestState & TState, UnknownAction>['middleware']
  preloadedState?: Partial<LocaleTestState & TState>
  reducer?: ReducersMapObject<TState, UnknownAction>
}

export function createTestStore<TReducerMap extends ReducersMapObject = ReducersMapObject>(
  options: CreateTestStoreOptions<StateFromReducersMapObject<TReducerMap>> & {
    reducer?: TReducerMap
  } = {}
) {
  const {
    middleware,
    preloadedState,
    reducer
  } = options
  type TestState = LocaleTestState & StateFromReducersMapObject<TReducerMap>
  const extraReducers = (reducer ?? {}) as TReducerMap

  const store = configureStore({
    reducer: {
      analytics: analyticsSlice.reducer,
      locale: localeSlice.reducer,
      ...extraReducers
    },
    preloadedState: {
      analytics: {
        isEnabled: true
      },
      locale: {
        value: AppLocaleType.ZH_TW
      },
      ...preloadedState
    } as Partial<TestState>,
    ...(middleware ? { middleware } : {})
  })

  return store as typeof store & {
    getState: () => TestState
  }
}
