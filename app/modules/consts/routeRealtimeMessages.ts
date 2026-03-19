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
  noService: {
    color: 'blue',
    title: '營運狀態',
    description: '目前沒有營運班次'
  }
} as const
