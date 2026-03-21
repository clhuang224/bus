// @vitest-environment jsdom

import { configureStore } from '@reduxjs/toolkit'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { busApi } from '~/modules/apis/bus'
import { tdxRateLimitModal } from '~/modules/apis/errors/busError'
import globalModalSlice, {
  closeGlobalModal,
  openGlobalModal
} from '~/modules/slices/globalModalSlice'
import { renderWithStore } from '~/test/render'
import { GlobalModal } from './GlobalModal'

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

    renderWithStore(<GlobalModal />, { store })

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
