/**
 * What a client should tell the user about a sub-route's realtime data, in
 * priority order: rate limits, then failures, then the service state.
 */
export enum RouteRealtimeStatus {
  NORMAL = 'normal',
  RATE_LIMITED = 'rate_limited',
  UNAVAILABLE = 'unavailable',
  NO_REALTIME_DATA = 'no_realtime_data',
  NO_SERVICE = 'no_service',
}
