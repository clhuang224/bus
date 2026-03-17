import type { AlertMessageConfig } from '../interfaces/AlertMessageConfig'

export const nearbyMessages: {
  locating: AlertMessageConfig
  loadingStops: AlertMessageConfig
  loadStopsError: AlertMessageConfig
  emptyStops: AlertMessageConfig
} = {
  locating: {
    color: 'blue',
    title: '定位中',
    description: '正在取得您的目前位置，請稍候...'
  },
  loadingStops: {
    color: 'blue',
    title: '載入中',
    description: '正在取得附近的站牌資料，請稍候...'
  },
  loadStopsError: {
    color: 'red',
    title: '載入失敗',
    description: '請稍後再試，或確認您的網路連線。'
  },
  emptyStops: {
    color: 'yellow',
    title: '附近沒有站牌',
    description: '目前在您附近沒有找到任何站牌。'
  }
}

export const searchMessages: {
  loadingRoutes: AlertMessageConfig
  loadRoutesError: AlertMessageConfig
  emptyRoutes: AlertMessageConfig
} = {
  loadingRoutes: {
    color: 'blue',
    title: '載入中',
    description: '正在取得此區域的公車路線資料，請稍候...'
  },
  loadRoutesError: {
    color: 'red',
    title: '載入失敗',
    description: '請稍後再試，或確認您的網路連線。'
  },
  emptyRoutes: {
    color: 'yellow',
    title: '找不到符合的路線',
    description: '請試試其他關鍵字，或切換到不同區域。'
  }
}
