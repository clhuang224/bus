import { GeoErrorType } from '../enums/geo/GeoErrorType'
import { GeoPermissionType } from '../enums/geo/GeoPermissionType'
import type { AlertMessageConfig } from '../interfaces/AlertMessageConfig'

export const geoPermissionMessages: { [key in GeoPermissionType]: AlertMessageConfig | null } = {
  [GeoPermissionType.UNSUPPORTED]: {
    type: 'error',
    title: '無法使用附近站牌',
    description: '您的瀏覽器不支援地理定位功能，因此無法使用附近站牌。'
  },
  [GeoPermissionType.DENIED]: {
    type: 'error',
    title: '無法使用附近站牌',
    description: '附近站牌功能需要位置權限，請在瀏覽器設定中允許此網站存取您的位置資訊。'
  },
  [GeoPermissionType.PROMPT]: null,
  [GeoPermissionType.GRANTED]: null
}

export const geoErrorMessages: { [key in GeoErrorType]: AlertMessageConfig } = {
  [GeoErrorType.PERMISSION_DENIED]: {
    type: 'error',
    title: '無法取得位置',
    description: '請在瀏覽器設定中允許此網站存取您的位置資訊'
  },
  [GeoErrorType.POSITION_UNAVAILABLE]: {
    type: 'error',
    title: '定位失敗',
    description: '目前無法取得您的位置，因此暫時無法使用附近站牌。請稍後再試，並確認裝置的定位服務與網路連線是否正常。'
  },
  [GeoErrorType.TIMEOUT]: {
    type: 'error',
    title: '定位失敗',
    description: '取得位置逾時，因此暫時無法使用附近站牌。請稍後再試，並確認裝置的定位服務與網路連線是否正常。'
  }
}
