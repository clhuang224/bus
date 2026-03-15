import { Button, Modal } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

type ModalVariant = 'alert' | 'confirm'

interface PropType {
  opened: boolean
  onConfirm: () => void
  onCancel?: () => void
  title: string
  children?: React.ReactNode
  variant?: ModalVariant
  confirmText?: string
  cancelText?: string
}

const BaseModal = ({
  opened,
  onConfirm,
  onCancel,
  title,
  children,
  variant = 'alert',
  confirmText = '確定',
  cancelText = '取消'
}: PropType) => {
  const isMobile = useMediaQuery('(max-width: 50em)')
  const isConfirm = variant === 'confirm'

  return (
    <Modal
      opened={opened}
      withCloseButton={false}
      closeOnClickOutside={false}
      onClose={() => {}}
      title={title}
      fullScreen={isMobile}
      centered
      transitionProps={{ transition: 'fade', duration: 200 }}
    >
      {children}
      <Button onClick={onConfirm}>{confirmText}</Button>
      {isConfirm && onCancel && (
        <Button onClick={onCancel}>{cancelText}</Button>
      )}
    </Modal>
  )
}

export default BaseModal
