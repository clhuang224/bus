import { useEffect } from 'react'
import { useLocation } from 'react-router'
import {
  initializeGoogleAnalytics,
  trackGoogleAnalytics
} from '~/modules/utils/shared/googleAnalytics'

export function useGoogleAnalytics() {
  const location = useLocation()

  useEffect(() => {
    const isGoogleAnalyticsReady = initializeGoogleAnalytics()

    if (!isGoogleAnalyticsReady) {
      return
    }

    const pagePath = `${location.pathname}${location.search}${location.hash}`

    trackGoogleAnalytics(pagePath)
  }, [location.pathname, location.search, location.hash])
}
