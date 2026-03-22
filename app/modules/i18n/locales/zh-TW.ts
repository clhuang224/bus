export const zhTW = {
  translation: {
    app: {
      name: 'Finding the Bus',
      description: '一起找公車。'
    },
    layout: {
      nav: {
        favorite: '我的最愛',
        nearby: '附近站牌',
        routes: '搜尋公車'
      }
    },
    pages: {
      favorite: {
        title: '我的最愛',
        description: '收藏常用的公車路線站牌，之後可以直接回到對應路線查看。'
      },
      routes: {
        title: '搜尋公車'
      }
    },
    components: {
      searchInput: {
        ariaLabel: '搜尋公車路線',
        placeholder: '輸入關鍵字以搜尋路線、起點或終點'
      },
      favoriteRouteStopCard: {
        removeAriaLabel: '移除收藏站牌路線',
        terminalLabel: '起訖站'
      },
      routeStopList: {
        addFavoriteAriaLabel: '收藏站牌路線',
        removeFavoriteAriaLabel: '取消收藏站牌路線',
        missingPlate: '未提供車牌'
      },
      mapSidebarLayout: {
        openNearbyStops: '開啟附近站牌列表',
        openRouteList: '開啟路線列表'
      },
      nearbyStopDetail: {
        cityLabel: '縣市',
        addressLabel: '地址',
        routesLabel: '路線',
        notProvided: '未提供',
        viewRoutesAriaLabel: '查看 {{stopName}} 路線'
      },
      nearbySidebarContent: {
        backAriaLabel: '返回附近站牌列表'
      }
    },
    routePage: {
      backToRoutes: '返回路線列表'
    },
    messages: {
      nearby: {
        loadStopsError: {
          title: '載入失敗',
          description: '請稍後再試，或確認您的網路連線。'
        },
        emptyStops: {
          title: '附近沒有站牌',
          description: '目前在您附近沒有找到任何站牌。'
        }
      },
      favorite: {
        emptyFavoriteRouteStops: {
          title: '尚未收藏站牌路線',
          description: '你可以在路線頁的站序列表按愛心，把某條子路線的特定站牌加入我的最愛。'
        }
      },
      search: {
        loadRoutesError: {
          title: '載入失敗',
          description: '請稍後再試，或確認您的網路連線。'
        },
        emptyRoutes: {
          title: '找不到符合的路線',
          description: '請試試其他關鍵字，或切換到不同區域。'
        }
      },
      route: {
        loadRouteError: {
          title: '載入路線失敗',
          description: '請稍後再試，或確認您的網路連線。'
        },
        emptyRoute: {
          title: '查無路線',
          description: '目前找不到這條公車路線資料。'
        }
      },
      geo: {
        permission: {
          unsupported: {
            title: '無法使用附近站牌',
            description: '您的瀏覽器不支援地理定位功能，因此無法使用附近站牌。'
          },
          denied: {
            title: '無法使用附近站牌',
            description: '附近站牌功能需要位置權限，請在瀏覽器設定中允許此網站存取您的位置資訊。'
          }
        },
        error: {
          permissionDenied: {
            title: '無法取得位置',
            description: '請在瀏覽器設定中允許此網站存取您的位置資訊'
          },
          positionUnavailable: {
            title: '定位失敗',
            description: '目前無法取得您的位置，因此暫時無法使用附近站牌。請稍後再試，並確認裝置的定位服務與網路連線是否正常。'
          },
          timeout: {
            title: '定位失敗',
            description: '取得位置逾時，因此暫時無法使用附近站牌。請稍後再試，並確認裝置的定位服務與網路連線是否正常。'
          }
        }
      }
    }
  }
} as const
