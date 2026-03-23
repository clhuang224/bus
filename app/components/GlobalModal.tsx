import { useDispatch, useSelector } from 'react-redux'
import BaseModal from './common/BaseModal'
import { busApi } from '~/modules/apis/bus'
import {
  closeGlobalModal,
  globalModalSelectors
} from '~/modules/slices/globalModalSlice'
import type { AppDispatch } from '~/modules/store'

const handleGlobalModalConfirm = (
  dispatch: AppDispatch,
  confirmAction: 'close' | 'refresh'
) => {
  dispatch(closeGlobalModal())

  if (confirmAction === 'refresh') {
    dispatch(busApi.util.resetApiState())
  }
}

export const GlobalModal = () => {
  const dispatch = useDispatch()
  const globalModal = useSelector(globalModalSelectors.selectGlobalModal)
  const {
    opened,
    title,
    message,
    variant,
    confirmText,
    cancelText,
    confirmAction
  } = globalModal

  return (
    <BaseModal
      opened={opened}
      onConfirm={() => handleGlobalModalConfirm(dispatch, confirmAction)}
      onCancel={() => dispatch(closeGlobalModal())}
      title={title}
      variant={variant}
      confirmText={confirmText ?? undefined}
      cancelText={cancelText ?? undefined}
    >
      {message}
    </BaseModal>
  )
}
