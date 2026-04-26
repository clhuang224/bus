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
  const pagePath = `${location.pathname}${location.search}${location.hash}`

  useEffect(() => {
    setGoogleAnalyticsEnabled(isAnalyticsEnabled)
  }, [isAnalyticsEnabled])

  useEffect(() => {
    if (!isAnalyticsEnabled) {
      return
    }

    const isGoogleAnalyticsReady = initializeGoogleAnalytics()

    if (!isGoogleAnalyticsReady) {
      return
    }

    trackGoogleAnalytics(pagePath)
  }, [isAnalyticsEnabled, pagePath])
}
