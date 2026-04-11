import { configureStore, type ConfigureStoreOptions, type Reducer, type UnknownAction } from '@reduxjs/toolkit'
import { AppLocaleType } from '~/modules/enums/AppLocaleType'
import localeSlice from '~/modules/slices/localeSlice'

type LocaleTestState = {
  locale: {
    value: AppLocaleType
  }
}

interface CreateTestStoreOptions<TState extends Record<string, unknown>> {
  middleware?: ConfigureStoreOptions<LocaleTestState & TState, UnknownAction>['middleware']
  preloadedState?: Partial<LocaleTestState & TState>
  reducer?: Record<string, Reducer<unknown, UnknownAction>>
}

export function createTestStore<TState extends Record<string, unknown> = Record<never, never>>({
  middleware,
  preloadedState,
  reducer = {}
}: CreateTestStoreOptions<TState> = {}) {
  const store = configureStore({
    reducer: {
      locale: localeSlice.reducer as unknown as Reducer<unknown, UnknownAction>,
      ...reducer
    } as unknown as ConfigureStoreOptions<LocaleTestState & TState, UnknownAction>['reducer'],
    preloadedState: {
      locale: {
        value: AppLocaleType.ZH_TW
      },
      ...preloadedState
    } as unknown as ConfigureStoreOptions<LocaleTestState & TState, UnknownAction>['preloadedState'],
    ...(middleware ? { middleware } : {})
  })

  return store as typeof store & {
    getState: () => LocaleTestState & TState
  }
}
