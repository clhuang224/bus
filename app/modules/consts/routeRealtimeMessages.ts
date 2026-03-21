export const routeRealtimeMessages = {
  loading: {
    color: 'gray',
    title: '更新中',
    description: '正在更新線上公車資料...'
  },
  error: {
    color: 'orange',
    title: '即時公車',
    description: '即時公車資料暫時無法完整更新。'
  },
  rateLimited: {
    color: 'orange',
    title: '即時公車',
    description: '目前同時查詢人數較多，即時公車資料會稍後自動重試。'
  },
  noService: {
    color: 'blue',
    title: '營運狀態',
    description: '目前沒有營運班次'
  },
  noRealtimeData: {
    color: 'yellow',
    title: '即時公車',
    description: '目前沒有可顯示的即時公車資訊，可能是已收班或上游暫時未提供完整資料。'
  }
} as const
