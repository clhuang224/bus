import { describe, expect, it } from 'vitest'
import {
  getTdxRateLimitModal,
  getTdxSystemErrorModal
} from '../apis/errors/busError'
import i18n from '../i18n'
import globalModalSlice, {
  closeGlobalModal,
  openGlobalModal
} from './globalModalSlice'

describe('globalModalSlice', () => {
  it('stores modal content and confirm behavior when opened', () => {
    const tdxRateLimitModal = getTdxRateLimitModal()
    const state = globalModalSlice.reducer(
      undefined,
      openGlobalModal(tdxRateLimitModal)
    )

    expect(state).toMatchObject({
      opened: true,
      ...tdxRateLimitModal,
      cancelText: i18n.t('common.modal.cancel'),
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
      confirmText: i18n.t('common.modal.confirm'),
      cancelText: i18n.t('common.modal.cancel'),
      confirmAction: 'close'
    })
  })
})
