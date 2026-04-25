export const zhTW = {
  translation: {
    app: {
      name: 'Finding the Bus',
      description: '一起找公車。'
    },
    common: {
      modal: {
        confirm: '確定',
        cancel: '取消',
        refresh: '重整頁面'
      },
      area: {
        Taipei: '雙北',
        Taoyuan: '桃園',
        Taichung: '台中',
        Tainan: '台南',
        Kaohsiung: '高雄',
        Keelung: '基隆',
        Hsinchu: '新竹',
        Miaoli: '苗栗',
        Changhua: '彰化',
        Nantou: '南投',
        Yunlin: '雲林',
        Chiayi: '嘉義',
        Pingtung: '屏東',
        Yilan: '宜蘭',
        Hualien: '花蓮',
        Taitung: '台東',
        Kinmen: '金門',
        Penghu: '澎湖',
        Lienchiang: '連江'
      },
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
      },
      bearing: {
        east: '往東',
        west: '往西',
        south: '往南',
        north: '往北',
        southeast: '往東南',
        northeast: '往東北',
        southwest: '往西南',
        northwest: '往西北'
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
        title: '搜尋公車',
        recentViewedRoutesTitle: '最近查看路線'
      },
      settings: {
        title: '設定',
        backAriaLabel: '返回上一頁',
        languageSectionTitle: '語言',
        analyticsSectionTitle: '隱私與分析',
        analyticsDescription: '這個網站會使用 Google Analytics 收集匿名使用資料，協助了解哪些功能常被使用、哪些路線被搜尋，以改善服務。',
        analyticsDataNotice: '我們不會傳送你的目前位置、姓名或聯絡資訊；搜尋關鍵字與開啟的公車路線可能會被記錄。',
        analyticsToggleLabel: '允許使用情況分析',
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
        placeholder: '搜尋路線、起點或終點',
        clearAriaLabel: '清除搜尋關鍵字'
      },
      areaSelect: {
        ariaLabel: '選擇區域'
      },
      favoriteRouteStopCard: {
        removeAriaLabel: '移除收藏站牌路線',
        terminalLabel: '起訖站',
        departureLabel: '起點站',
        destinationLabel: '終點站',
        terminal: '{{departure}} → {{destination}}'
      },
      routeInfoCard: {
        terminalLabel: '起訖站',
        departureLabel: '起點站',
        destinationLabel: '終點站',
        terminal: '起訖站： {{departure}} → {{destination}}'
      },
      routeStopList: {
        navigateAriaLabel: '導航至 {{stopName}}',
        addFavoriteAriaLabel: '收藏站牌路線',
        removeFavoriteAriaLabel: '取消收藏站牌路線'
      },
      stopDistance: {
        meters: '{{count}} 公尺',
        kilometers: '{{count}} 公里'
      },
      routeMap: {
        stopMarkerAriaLabel: '{{stopName}}，第 {{sequence}} 站',
        vehicleMarkerAriaLabel: '{{plateNumb}}，最近站牌 {{stopName}}，預估到站 {{estimateLabel}}',
        vehiclePopup: {
          recentStop: '最近站牌',
          recentStopUnknown: '未知',
          estimate: '預估到站'
        }
      },
      baseMap: {
        userLocationMarkerAriaLabel: '目前位置',
        focusUserLocationAriaLabel: '我的位置'
      },
      mapSidebarLayout: {
        openNearbyStops: '開啟附近站牌列表',
        openRouteList: '開啟路線列表'
      },
      nearbyStopDetail: {
        cityLabel: '縣市',
        distanceLabel: '距離',
        addressLabel: '地址',
        routesLabel: '路線',
        notProvided: '未提供',
        viewRoutesAriaLabel: '查看 {{stopName}} 路線'
      },
      nearbyStopRoutes: {
        title: '此站路線',
        empty: '目前沒有可顯示的路線資訊',
        error: '目前無法載入路線資訊，請稍後再試',
        rateLimited: '目前查詢路線的人太多，請稍後再試'
      },
      nearbyStopMap: {
        stopMarkerAriaLabel: '附近站牌 {{stopName}}'
      },
      nearbySidebarContent: {
        backAriaLabel: '返回附近站牌列表'
      }
    },
    routePage: {
      backToRoutes: '返回路線列表',
      realtime: {
        inService: '行駛中',
        comingSoon: '即將進站',
        noEstimate: '暫無預估',
        minutesAway_one: '{{count}} 分後到站',
        minutesAway_other: '{{count}} 分後到站',
        stopStatus: {
          normal: '正常',
          notYetDeparted: '- 分後到站',
          noStopDueToTrafficControl: '交管不停靠',
          lastBusPassed: '末班已過',
          notInServiceToday: '今日未營運',
          unknown: '未知狀態'
        }
      }
    },
    errorBoundary: {
      default: {
        title: '發生錯誤'
      },
      notFound: {
        title: '404',
        description: '找不到你要的頁面。'
      }
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
          description: '請試試路線名稱、起點站或終點站等其他關鍵字。'
        },
        emptyRouteSearch: {
          title: '開始搜尋公車',
          description: '請輸入路線、起點站或終點站，快速找到想搭的公車。'
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
      routeRealtime: {
        loading: {
          title: '更新中',
          description: '正在更新線上公車資料...'
        },
        error: {
          title: '即時公車',
          description: '即時公車資料暫時無法完整更新。'
        },
        rateLimited: {
          title: '即時公車',
          description: '目前同時查詢人數較多，即時公車資料會稍後自動重試。'
        },
        noService: {
          title: '營運狀態',
          description: '目前沒有營運班次'
        },
        noRealtimeData: {
          title: '即時公車',
          description: '目前沒有可顯示的即時公車資訊，可能是已收班或上游暫時未提供完整資料。'
        }
      },
      busService: {
        unauthorized: {
          title: '公車資料服務驗證失敗',
          description: '目前無法驗證公車資料服務，請稍後再試。'
        },
        rateLimited: {
          title: '目前查詢人數較多',
          description: '系統暫時無法取得公車資料，請稍候一段時間再試。'
        },
        systemError: {
          title: '系統暫時無法使用',
          description: '目前無法取得公車資料，請稍後再試。'
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
