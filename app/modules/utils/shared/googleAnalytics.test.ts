// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  initializeGoogleAnalytics,
  resetGoogleAnalyticsForTest,
  setGoogleAnalyticsEnabled,
  trackGoogleAnalytics,
  trackGoogleAnalyticsEvent
} from './googleAnalytics'

const GA_ID = 'G-TEST123456'

describe('googleAnalytics', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GA_ID', GA_ID)
    resetGoogleAnalyticsForTest()
    document.getElementById('google-analytics-gtag-script')?.remove()
    delete window.gtag
    delete window.dataLayer
    document.title = 'Test Page'
    window.history.replaceState({}, '', '/routes?city=Taipei#detail')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    resetGoogleAnalyticsForTest()

    const script = document.getElementById('google-analytics-gtag-script')
    script?.remove()

    delete window.gtag
    delete window.dataLayer
  })

  it('initializes GA when measurement id is provided', () => {
    const initialized = initializeGoogleAnalytics()

    expect(initialized).toBe(true)

    const script = document.getElementById('google-analytics-gtag-script')
    expect(script).not.toBeNull()

    expect(window.gtag).toBeDefined()
    expect(window.dataLayer?.length).toBe(3)
  })

  it('tracks page view with path and title', () => {
    trackGoogleAnalytics('/routes?city=Taipei#detail')

    expect(document.getElementById('google-analytics-gtag-script')).not.toBeNull()
    expect(window.dataLayer?.length).toBe(4)

    const pageViewEvent = window.dataLayer?.[3] as [string, string, Record<string, unknown>]

    expect(pageViewEvent[0]).toBe('event')
    expect(pageViewEvent[1]).toBe('page_view')
    expect(pageViewEvent[2]).toMatchObject({
      page_title: 'Test Page',
      page_path: '/routes?city=Taipei#detail',
      send_to: GA_ID
    })
  })

  it('tracks custom events with parameters', () => {
    trackGoogleAnalyticsEvent('select_route', {
      route_uid: 'route-1',
      route_name: '藍1'
    })

    expect(document.getElementById('google-analytics-gtag-script')).not.toBeNull()
    expect(window.dataLayer?.length).toBe(4)

    const customEvent = window.dataLayer?.[3] as [string, string, Record<string, unknown>]

    expect(customEvent[0]).toBe('event')
    expect(customEvent[1]).toBe('select_route')
    expect(customEvent[2]).toMatchObject({
      route_uid: 'route-1',
      route_name: '藍1',
      send_to: GA_ID
    })
  })

  it('does nothing when measurement id is missing', () => {
    vi.stubEnv('VITE_GA_ID', '')

    const initialized = initializeGoogleAnalytics()

    expect(initialized).toBe(false)

    trackGoogleAnalytics('/routes')
    trackGoogleAnalyticsEvent('select_route', {
      route_uid: 'route-1'
    })

    expect(document.getElementById('google-analytics-gtag-script')).toBeNull()
    expect(window.dataLayer).toBeUndefined()
  })

  it('does not initialize or track events when analytics is disabled', () => {
    setGoogleAnalyticsEnabled(false)

    const initialized = initializeGoogleAnalytics()

    expect(initialized).toBe(false)

    trackGoogleAnalytics('/routes')
    trackGoogleAnalyticsEvent('select_route', {
      route_uid: 'route-1'
    })

    expect(document.getElementById('google-analytics-gtag-script')).toBeNull()
    expect(window.dataLayer).toBeUndefined()
  })

  it('updates GA consent when analytics is disabled after initialization', () => {
    initializeGoogleAnalytics()

    setGoogleAnalyticsEnabled(false)

    const consentEvent = Array.from(window.dataLayer?.[3] as IArguments)

    expect(consentEvent).toEqual([
      'consent',
      'update',
      {
        analytics_storage: 'denied'
      }
    ])
  })

  it('does not update GA consent when the enabled state is unchanged', () => {
    initializeGoogleAnalytics()

    setGoogleAnalyticsEnabled(true)

    expect(window.dataLayer?.length).toBe(3)

    setGoogleAnalyticsEnabled(false)
    setGoogleAnalyticsEnabled(false)

    expect(window.dataLayer?.length).toBe(4)
  })
})
