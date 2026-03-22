import { Button, Flex, Modal } from '@mantine/core'
import i18n from '~/modules/i18n'

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
  confirmText = i18n.t('common.modal.confirm'),
  cancelText = i18n.t('common.modal.cancel')
}: PropType) => {
  const isConfirm = variant === 'confirm'

  return (
    <Modal
      opened={opened}
      withCloseButton={false}
      closeOnClickOutside={false}
      onClose={() => {}}
      title={title}
      centered
      transitionProps={{ transition: 'fade', duration: 200 }}
    >
      {children}
      <Flex justify="flex-end" mt="md" gap="sm">
        {isConfirm && onCancel && (
          <Button variant="default" onClick={onCancel}>
            {cancelText}
          </Button>
        )}
        <Button onClick={onConfirm}>{confirmText}</Button>
      </Flex>
    </Modal>
  )
}

export default BaseModal
