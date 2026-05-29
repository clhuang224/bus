import { Button, Flex, Modal } from '@mantine/core'
import { useTranslation } from 'react-i18next'

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
  confirmText,
  cancelText
}: PropType) => {
  const isConfirm = variant === 'confirm'
  const { t } = useTranslation()

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
            {cancelText ?? t('common.modal.cancel')}
          </Button>
        )}
        <Button onClick={onConfirm}>{confirmText ?? t('common.modal.confirm')}</Button>
      </Flex>
    </Modal>
  )
}

export default BaseModal
