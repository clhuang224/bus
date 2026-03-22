import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import i18n from '../i18n'
import type { RootState } from '../store'

type GlobalModalVariant = 'alert' | 'confirm'
type GlobalModalConfirmAction = 'close' | 'refresh'

interface GlobalModalState {
  opened: boolean
  title: string
  message: string
  variant: GlobalModalVariant
  confirmText: string
  cancelText: string
  confirmAction: GlobalModalConfirmAction
}

export type OpenGlobalModalPayload = Pick<GlobalModalState, 'title' | 'message' | 'variant'> &
  Partial<Pick<GlobalModalState, 'confirmText' | 'cancelText' | 'confirmAction'>>

function getDefaultModalTexts() {
  return {
    confirmText: i18n.t('common.modal.confirm'),
    cancelText: i18n.t('common.modal.cancel')
  }
}

const initialState: GlobalModalState = {
  opened: false,
  title: '',
  message: '',
  variant: 'alert',
  ...getDefaultModalTexts(),
  confirmAction: 'close'
}

const globalModalSlice = createSlice({
  name: 'globalModal',
  initialState,
  reducers: {
    openGlobalModal: (
      state,
      action: PayloadAction<OpenGlobalModalPayload>
    ) => {
      const defaultTexts = getDefaultModalTexts()
      state.opened = true
      state.title = action.payload.title
      state.message = action.payload.message
      state.variant = action.payload.variant
      state.confirmText = action.payload.confirmText ?? defaultTexts.confirmText
      state.cancelText = action.payload.cancelText ?? defaultTexts.cancelText
      state.confirmAction = action.payload.confirmAction ?? initialState.confirmAction
    },
    closeGlobalModal: (state) => {
      const defaultTexts = getDefaultModalTexts()
      state.opened = false
      state.title = initialState.title
      state.message = initialState.message
      state.variant = initialState.variant
      state.confirmText = defaultTexts.confirmText
      state.cancelText = defaultTexts.cancelText
      state.confirmAction = initialState.confirmAction
    }
  }
})

export const { openGlobalModal, closeGlobalModal } = globalModalSlice.actions

export const globalModalSelectors = {
  selectGlobalModal: (state: RootState) => state.globalModal
}

export default globalModalSlice
