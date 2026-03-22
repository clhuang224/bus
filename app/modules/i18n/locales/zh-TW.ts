export const zhTW = {
  translation: {
    app: {
      name: 'Finding the Bus',
      description: '一起找公車。'
    },
    common: {
      city: {
        Taipei: '台北市',
        NewTaipei: '新北市',
        Taoyuan: '桃園市',
        Taichung: '台中市',
        Tainan: '台南市',
        Kaohsiung: '高雄市',
        Keelung: '基隆市',
        Hsinchu: '新竹市',
        HsinchuCounty: '新竹縣',
        MiaoliCounty: '苗栗縣',
        ChanghuaCounty: '彰化縣',
        NantouCounty: '南投縣',
        YunlinCounty: '雲林縣',
        ChiayiCounty: '嘉義縣',
        Chiayi: '嘉義市',
        PingtungCounty: '屏東縣',
        YilanCounty: '宜蘭縣',
        HualienCounty: '花蓮縣',
        TaitungCounty: '台東縣',
        KinmenCounty: '金門縣',
        PenghuCounty: '澎湖縣',
        LienchiangCounty: '連江縣'
      },
      direction: {
        go: '去程',
        return: '返程',
        loop: '迴圈',
        shuttle: '循環',
        unknown: '未知'
      }
    },
    layout: {
      nav: {
        favorite: '我的最愛',
        nearby: '附近站牌',
        routes: '搜尋公車',
        settings: '設定'
      }
    },
    pages: {
      favorite: {
        title: '我的最愛'
      },
      routes: {
        title: '搜尋公車'
      },
      settings: {
        title: '設定',
        backAriaLabel: '返回上一頁',
        languageSectionTitle: '語言',
        localeOptions: {
          zhTW: {
            label: '繁體中文'
          },
          en: {
            label: 'English'
          }
        }
      }
    },
    components: {
      searchInput: {
        ariaLabel: '搜尋公車路線',
        placeholder: '輸入關鍵字以搜尋路線、起點或終點'
      },
      favoriteRouteStopCard: {
        removeAriaLabel: '移除收藏站牌路線',
        terminalLabel: '起訖站',
        terminal: '{{departure}} → {{destination}}'
      },
      routeInfoCard: {
        terminal: '起訖站： {{departure}} → {{destination}}'
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
      nearbyStopRoutes: {
        title: '此站路線',
        empty: '目前沒有可顯示的路線資訊'
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
