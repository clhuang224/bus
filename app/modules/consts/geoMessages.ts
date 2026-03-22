import type { TFunction } from 'i18next'
import { GeoErrorType } from '../enums/geo/GeoErrorType'
import { GeoPermissionType } from '../enums/geo/GeoPermissionType'
import type { AlertMessageConfig } from '../interfaces/AlertMessageConfig'

function buildAlertMessage(t: TFunction, key: string): AlertMessageConfig {
  return {
    type: 'error',
    title: t(`${key}.title`),
    description: t(`${key}.description`)
  }
}

export function getGeoPermissionMessages(
  t: TFunction
): { [key in GeoPermissionType]: AlertMessageConfig | null } {
  return {
    [GeoPermissionType.UNSUPPORTED]: buildAlertMessage(t, 'messages.geo.permission.unsupported'),
    [GeoPermissionType.DENIED]: buildAlertMessage(t, 'messages.geo.permission.denied'),
    [GeoPermissionType.PROMPT]: null,
    [GeoPermissionType.GRANTED]: null
  }
}

export function getGeoErrorMessages(t: TFunction): { [key in GeoErrorType]: AlertMessageConfig } {
  return {
    [GeoErrorType.PERMISSION_DENIED]: buildAlertMessage(t, 'messages.geo.error.permissionDenied'),
    [GeoErrorType.POSITION_UNAVAILABLE]: buildAlertMessage(t, 'messages.geo.error.positionUnavailable'),
    [GeoErrorType.TIMEOUT]: buildAlertMessage(t, 'messages.geo.error.timeout')
  }
}
