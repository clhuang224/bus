// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { MantineProvider } from '@mantine/core'
import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { describe, expect, it, vi } from 'vitest'
import { busApi } from '~/modules/apis/bus'
import { tdxRateLimitModal } from '~/modules/apis/errors/busError'
import globalModalSlice, {
  closeGlobalModal,
  openGlobalModal
} from '~/modules/slices/globalModalSlice'
import { GlobalModal } from './GlobalModal'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

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

describe('GlobalModal', () => {
  it('resets bus api state when confirmAction is refresh', () => {
    const store = createTestStore()
    const dispatchSpy = vi.spyOn(store, 'dispatch')

    store.dispatch(openGlobalModal(tdxRateLimitModal))

    render(
      <MantineProvider>
        <Provider store={store}>
          <GlobalModal />
        </Provider>
      </MantineProvider>
    )

    expect(screen.getByText(tdxRateLimitModal.title)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: tdxRateLimitModal.confirmText! }))

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: closeGlobalModal.type })
    )
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: `${busApi.reducerPath}/resetApiState` })
    )
  })
})
