import type { AlertMessageConfig } from '../interfaces/AlertMessageConfig'

export const nearbyMessages: {
  loadStopsError: AlertMessageConfig
  emptyStops: AlertMessageConfig
} = {
  loadStopsError: {
    type: 'error',
    title: '載入失敗',
    description: '請稍後再試，或確認您的網路連線。'
  },
  emptyStops: {
    type: 'warn',
    title: '附近沒有站牌',
    description: '目前在您附近沒有找到任何站牌。'
  }
}

export const favoriteMessages: {
  emptyFavoriteRouteStops: AlertMessageConfig
} = {
  emptyFavoriteRouteStops: {
    type: 'warn',
    title: '尚未收藏站牌路線',
    description: '你可以在路線頁的站序列表按愛心，把某條子路線的特定站牌加入我的最愛。'
  }
}

export const searchMessages: {
  loadRoutesError: AlertMessageConfig
  emptyRoutes: AlertMessageConfig
} = {
  loadRoutesError: {
    type: 'error',
    title: '載入失敗',
    description: '請稍後再試，或確認您的網路連線。'
  },
  emptyRoutes: {
    type: 'warn',
    title: '找不到符合的路線',
    description: '請試試其他關鍵字，或切換到不同區域。'
  }
}

export const routeMessages: {
  loadRouteError: AlertMessageConfig
  emptyRoute: AlertMessageConfig
} = {
  loadRouteError: {
    type: 'error',
    title: '載入路線失敗',
    description: '請稍後再試，或確認您的網路連線。'
  },
  emptyRoute: {
    type: 'warn',
    title: '查無路線',
    description: '目前找不到這條公車路線資料。'
  }
}
