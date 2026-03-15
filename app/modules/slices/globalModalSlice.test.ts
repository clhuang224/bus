import { describe, expect, it } from 'vitest'
import {
  tdxRateLimitModal,
  tdxSystemErrorModal
} from '../apis/errors/busError'
import globalModalSlice, {
  closeGlobalModal,
  openGlobalModal
} from './globalModalSlice'

describe('globalModalSlice', () => {
  it('stores modal content and confirm behavior when opened', () => {
    const state = globalModalSlice.reducer(
      undefined,
      openGlobalModal(tdxRateLimitModal)
    )

    expect(state).toMatchObject({
      opened: true,
      ...tdxRateLimitModal,
      cancelText: '取消',
      confirmAction: 'refresh'
    })
  })

  it('resets modal state when closed', () => {
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
      confirmText: '確定',
      cancelText: '取消',
      confirmAction: 'close'
    })
  })
})
