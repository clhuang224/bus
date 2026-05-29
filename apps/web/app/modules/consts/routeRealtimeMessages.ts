import type { TFunction } from 'i18next'
import { RouteRealtimeInfoState } from '../enums/RouteRealtimeInfoState'

interface RouteRealtimeMessage {
  color: string
  title: string
  description: string
}

interface RouteRealtimeMessages {
  loading: RouteRealtimeMessage
  error: RouteRealtimeMessage
  rateLimited: RouteRealtimeMessage
  noService: RouteRealtimeMessage
  noRealtimeData: RouteRealtimeMessage
}

function buildRouteRealtimeMessage(t: TFunction, color: string, key: string): RouteRealtimeMessage {
  return {
    color,
    title: t(`${key}.title`),
    description: t(`${key}.description`)
  }
}

export function getRouteRealtimeMessages(t: TFunction): RouteRealtimeMessages &
Record<RouteRealtimeInfoState.NO_SERVICE | RouteRealtimeInfoState.NO_REALTIME_DATA, RouteRealtimeMessage> {
  return {
    loading: buildRouteRealtimeMessage(t, 'gray', 'messages.routeRealtime.loading'),
    error: buildRouteRealtimeMessage(t, 'orange', 'messages.routeRealtime.error'),
    rateLimited: buildRouteRealtimeMessage(t, 'orange', 'messages.routeRealtime.rateLimited'),
    noService: buildRouteRealtimeMessage(t, 'blue', 'messages.routeRealtime.noService'),
    noRealtimeData: buildRouteRealtimeMessage(t, 'yellow', 'messages.routeRealtime.noRealtimeData')
  }
}
