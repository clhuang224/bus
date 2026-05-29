import type { AlertType } from '../types/AlertType'

export interface AlertMessageConfig {
  type: AlertType
  title: string
  description: string
}
