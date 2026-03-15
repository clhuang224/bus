import { configureStore } from '@reduxjs/toolkit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { busApi } from './bus'
import { CityNameType } from '../enums/CityNameType'
import {
  getBusErrorModal,
  TdxErrorStatus,
  tdxRateLimitModal,
  tdxSystemErrorModal
} from './errors/busError'
import globalModalSlice from '../slices/globalModalSlice'

function createTestStore() {
  return configureStore({
    reducer: {
      [busApi.reducerPath]: busApi.reducer,
      globalModal: globalModalSlice.reducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(busApi.middleware)
  })
}

describe('busApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('opens the global modal when TDX responds with 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Too Many Requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    ))

    const store = createTestStore()

    await store.dispatch(busApi.endpoints.getRoutesByCity.initiate(CityNameType.TAIPEI))

    expect(store.getState().globalModal).toMatchObject({
      opened: true,
      ...tdxRateLimitModal
    })
  })

  it('maps fetch errors to the system error modal', () => {
    expect(getBusErrorModal(TdxErrorStatus.FETCH_ERROR)).toMatchObject(tdxSystemErrorModal)
  })
})
