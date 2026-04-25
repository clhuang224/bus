import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router'
import { selectAnalyticsEnabled } from '~/modules/slices/analyticsSlice'
import {
  initializeGoogleAnalytics,
  setGoogleAnalyticsEnabled,
  trackGoogleAnalytics
} from '~/modules/utils/shared/googleAnalytics'

export function useGoogleAnalytics() {
  const location = useLocation()
  const isAnalyticsEnabled = useSelector(selectAnalyticsEnabled)

  useEffect(() => {
    setGoogleAnalyticsEnabled(isAnalyticsEnabled)

    if (!isAnalyticsEnabled) {
      return
    }

    const isGoogleAnalyticsReady = initializeGoogleAnalytics()

    if (!isGoogleAnalyticsReady) {
      return
    }

    const pagePath = `${location.pathname}${location.search}${location.hash}`

    trackGoogleAnalytics(pagePath)
  }, [isAnalyticsEnabled, location.pathname, location.search, location.hash])
}
