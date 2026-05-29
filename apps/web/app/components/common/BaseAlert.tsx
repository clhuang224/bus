import { Alert } from '@mantine/core'
import type { AlertProps } from '@mantine/core'
import type { AlertMessageConfig } from '~/modules/interfaces/AlertMessageConfig'
import type { AlertType } from '~/modules/types/AlertType'

const alertTypeColorMap: Record<AlertType, AlertProps['color']> = {
  error: 'red',
  warn: 'yellow'
}

interface BaseAlertProps extends Omit<AlertProps, 'color' | 'title' | 'children'>, AlertMessageConfig {}

export const BaseAlert = ({ type, title, description, ...props }: BaseAlertProps) => (
  <Alert color={alertTypeColorMap[type]} title={title} {...props}>
    {description}
  </Alert>
)
