import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
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

const initialState: GlobalModalState = {
  opened: false,
  title: '',
  message: '',
  variant: 'alert',
  confirmText: '確定',
  cancelText: '取消',
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
      state.opened = true
      state.title = action.payload.title
      state.message = action.payload.message
      state.variant = action.payload.variant
      state.confirmText = action.payload.confirmText ?? initialState.confirmText
      state.cancelText = action.payload.cancelText ?? initialState.cancelText
      state.confirmAction = action.payload.confirmAction ?? initialState.confirmAction
    },
    closeGlobalModal: (state) => {
      state.opened = false
      state.title = initialState.title
      state.message = initialState.message
      state.variant = initialState.variant
      state.confirmText = initialState.confirmText
      state.cancelText = initialState.cancelText
      state.confirmAction = initialState.confirmAction
    }
  }
})

export const { openGlobalModal, closeGlobalModal } = globalModalSlice.actions

export const globalModalSelectors = {
  selectGlobalModal: (state: RootState) => state.globalModal
}

export default globalModalSlice
