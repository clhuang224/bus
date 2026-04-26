import { setGoogleAnalyticsEnabled } from '../shared/googleAnalytics'

export function applyAnalyticsPreference(isEnabled: boolean) {
  setGoogleAnalyticsEnabled(isEnabled)
}
