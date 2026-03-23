import { afterEach, describe, expect, it } from 'vitest'
import {
  getTdxRateLimitModal,
  getTdxSystemErrorModal
} from '../apis/errors/busError'
import i18n from '../i18n'
import globalModalSlice, {
  closeGlobalModal,
  openGlobalModal
} from './globalModalSlice'
import { DEFAULT_APP_LOCALE } from '../consts/i18n'

describe('globalModalSlice', () => {
  afterEach(async () => {
    await i18n.changeLanguage(DEFAULT_APP_LOCALE)
  })

  it('stores modal content and confirm behavior when opened', () => {
    const tdxRateLimitModal = getTdxRateLimitModal()
    const state = globalModalSlice.reducer(
      undefined,
      openGlobalModal(tdxRateLimitModal)
    )

    expect(state).toMatchObject({
      opened: true,
      ...tdxRateLimitModal,
      cancelText: null,
      confirmAction: 'refresh'
    })
  })

  it('resets modal state when closed', () => {
    const tdxSystemErrorModal = getTdxSystemErrorModal()
    const openedState = globalModalSlice.reducer(
      undefined,
      openGlobalModal(tdxSystemErrorModal)
    )

    const closedState = globalModalSlice.reducer(openedState, closeGlobalModal())

    expect(closedState).toEqual({
      opened: false,
      title: '',
      message: '',
      variant: 'alert',
      confirmText: null,
      cancelText: null,
      confirmAction: 'close'
    })
  })

  it('keeps default modal button labels out of reducer state', async () => {
    await i18n.changeLanguage('en')

    const state = globalModalSlice.reducer(undefined, openGlobalModal({
      title: 'title',
      message: 'message',
      variant: 'alert'
    }))

    expect(state.confirmText).toBeNull()
    expect(state.cancelText).toBeNull()
  })
})
