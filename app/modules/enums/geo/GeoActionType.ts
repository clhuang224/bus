export enum GeoActionType {
  /**
   * Geolocation is not supported in the current environment
   */
  UNSUPPORTED = 'unsupported',
  /**
   * The browser-reported geolocation permission state has changed
   */
  PERMISSION_CHANGED = 'permission_changed',
  /**
   * Geolocation watching has started
   */
  WATCH_STARTED = 'watch_started',
  /**
   * Geolocation watching has stopped
   */
  WATCH_STOPPED = 'watch_stopped',
  /**
   * A new position update has been received
   */
  POSITION_UPDATED = 'position_updated',
  /**
   * The user denied geolocation permission
   */
  POSITION_DENIED = 'position_denied',
  /**
   * The current device position is unavailable
   */
  POSITION_UNAVAILABLE = 'position_unavailable',
  /**
   * The geolocation request timed out
   */
  POSITION_TIMEOUT = 'position_timeout'
}
