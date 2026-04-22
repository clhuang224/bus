const GA_SCRIPT_ID = 'google-analytics-gtag-script'
const GA_DEBUG_QUERY_KEY = 'ga_debug'
const GA_DEBUG_ENABLED_VALUE = '1'

let isInitialized = false

function isBrowserEnvironment () {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function getGaMeasurementId () {
  const gaId = import.meta.env.VITE_GA_ID
  return gaId || undefined
}

function isGaDebugEnabled () {
  if (!isBrowserEnvironment()) return false
  const debugValue = new URLSearchParams(window.location.search).get(GA_DEBUG_QUERY_KEY)
  return debugValue === GA_DEBUG_ENABLED_VALUE
}

function logGaDebug (...args: unknown[]) {
  if (!isGaDebugEnabled()) return
  console.info('[ga-debug]', ...args)
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function initializeGoogleAnalytics () {
  const gaId = getGaMeasurementId()
  if (!gaId || !isBrowserEnvironment()) return false

  if (isInitialized && window.gtag) return true

  const existingScript = document.getElementById(GA_SCRIPT_ID)

  if (!existingScript) {
    const script = document.createElement('script')
    script.id = GA_SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(script)
  }

  const dataLayer = window.dataLayer ?? []
  window.dataLayer = dataLayer

  function gtag () {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments)
  }

  window.gtag = window.gtag || gtag

  logGaDebug('initialize', {
    measurementId: gaId,
    hasExistingScript: Boolean(existingScript)
  })

  window.gtag('js', new Date())
  window.gtag('config', gaId, {
    send_page_view: false
  })

  isInitialized = true

  return true
}

export function trackGoogleAnalytics (pagePath: string) {
  const gaId = getGaMeasurementId()
  if (!gaId || !isBrowserEnvironment() || !window.gtag) {
    return
  }

  logGaDebug('page_view', {
    pageTitle: document.title,
    pageLocation: window.location.href,
    pagePath,
    measurementId: gaId
  })

  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: pagePath,
    send_to: gaId
  })
}

export function resetGoogleAnalyticsForTest () {
  isInitialized = false
}
