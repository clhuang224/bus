import { GeoPermissionType } from '../enums/geo/GeoPermissionType'
import { GeoErrorType } from '../enums/geo/GeoErrorType'

export interface MessagePayload {
  color: string,
  title: string,
  description: string
}

export const geoPermissionMessages: {[key in GeoPermissionType]: MessagePayload | null} = {
  [GeoPermissionType.UNSUPPORTED]: {
    color: 'red',
    title: '不支援定位',
    description: '您的瀏覽器不支援地理定位功能'
  },
  [GeoPermissionType.DENIED]: {
    color: 'red',
    title: '無法取得位置',
    description: '請在瀏覽器設定中允許此網站存取您的位置資訊'
  },
  [GeoPermissionType.PROMPT]: null,
  [GeoPermissionType.GRANTED]: null
}

export const geoErrorMessages: {[key in GeoErrorType]: MessagePayload } = {
  [GeoErrorType.PERMISSION_DENIED]: {
    color: 'red',
    title: '無法取得位置',
    description: '請在瀏覽器設定中允許此網站存取您的位置資訊'
  },
  [GeoErrorType.POSITION_UNAVAILABLE]: {
    color: 'red',
    title: '定位失敗',
    description: '目前無法取得您的位置，請稍後再試。'
  },
  [GeoErrorType.TIMEOUT]: {
    color: 'red',
    title: '定位失敗',
    description: '取得位置逾時，請稍後再試。'
  }
}
