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

describe('globalModalSlice', () => {
  afterEach(async () => {
    await i18n.changeLanguage('zh-TW')
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

  it('uses the current locale for default modal button labels', async () => {
    await i18n.changeLanguage('en')

    const state = globalModalSlice.reducer(undefined, openGlobalModal({
      title: 'title',
      message: 'message',
      variant: 'alert'
    }))

    expect(state.confirmText).toBe(i18n.t('common.modal.confirm'))
    expect(state.cancelText).toBe(i18n.t('common.modal.cancel'))
  })
})
