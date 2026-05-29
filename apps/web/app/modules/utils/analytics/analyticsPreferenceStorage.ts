import { getLocalStorage } from '../shared/getLocalStorage'

export const ANALYTICS_ENABLED_STORAGE_KEY = 'bus-preferences-analytics-enabled'

export function loadAnalyticsEnabledFromStorage() {
  const storedValue = getLocalStorage().getItem(ANALYTICS_ENABLED_STORAGE_KEY)

  if (storedValue == null) {
    return true
  }

  return storedValue !== 'false'
}

export function persistAnalyticsEnabledToStorage(isEnabled: boolean) {
  getLocalStorage().setItem(ANALYTICS_ENABLED_STORAGE_KEY, String(isEnabled))
}
