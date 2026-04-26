const GA_SCRIPT_ID = 'google-analytics-gtag-script'
const GA_DEBUG_QUERY_KEY = 'ga_debug'
const GA_DEBUG_ENABLED_VALUE = '1'

let isInitialized = false
let isEnabled = true

function canUseDom () {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function getGaId () {
  const gaId = import.meta.env.VITE_GA_ID
  return gaId || undefined
}

function isDebug () {
  if (!canUseDom()) return false
  const debugValue = new URLSearchParams(window.location.search).get(GA_DEBUG_QUERY_KEY)
  return debugValue === GA_DEBUG_ENABLED_VALUE
}

function debug (...args: unknown[]) {
  if (!isDebug()) return
  console.info('[ga-debug]', ...args)
}

function getGa () {
  const gaId = getGaId()
  if (!gaId || !isEnabled || !canUseDom()) {
    return null
  }

  if (!window.gtag && !initializeGoogleAnalytics()) {
    return null
  }

  if (!window.gtag) return null

  return {
    gaId,
    gtag: window.gtag
  }
}

declare global {
  interface Window {
    [key: `ga-disable-${string}`]: boolean | undefined
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function initializeGoogleAnalytics () {
  const gaId = getGaId()
  if (!gaId || !canUseDom() || !isEnabled) return false

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
  setGoogleAnalyticsEnabled(true)

  debug('initialize', {
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
  const ga = getGa()
  if (!ga) return
  const { gaId, gtag } = ga

  debug('page_view', {
    pageTitle: document.title,
    pageLocation: window.location.href,
    pagePath,
    measurementId: gaId
  })

  gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: pagePath,
    send_to: gaId
  })
}

export function trackGoogleAnalyticsEvent (
  eventName: string,
  parameters: Record<string, unknown> = {}
) {
  const ga = getGa()
  if (!ga) return
  const { gaId, gtag } = ga

  debug(eventName, {
    ...parameters,
    measurementId: gaId
  })

  gtag('event', eventName, {
    ...parameters,
    send_to: gaId
  })
}

export function setGoogleAnalyticsEnabled(nextIsEnabled: boolean) {
  isEnabled = nextIsEnabled

  const gaId = getGaId()
  if (!gaId || !canUseDom()) return

  const gaDisableKey = `ga-disable-${gaId}` as const
  const nextGaDisabled = !nextIsEnabled
  const shouldUpdateConsent = window[gaDisableKey] !== nextGaDisabled
  window[gaDisableKey] = nextGaDisabled

  if (!window.gtag || !shouldUpdateConsent) return

  window.gtag('consent', 'update', {
    analytics_storage: nextIsEnabled ? 'granted' : 'denied'
  })
}

export function resetGoogleAnalyticsForTest () {
  isInitialized = false
  isEnabled = true

  const gaId = getGaId()
  if (gaId && canUseDom()) {
    delete window[`ga-disable-${gaId}`]
  }
}
