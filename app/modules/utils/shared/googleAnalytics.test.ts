// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  initializeGoogleAnalytics,
  resetGoogleAnalyticsForTest,
  trackGoogleAnalytics
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
    expect(window.dataLayer?.length).toBe(2)
  })

  it('tracks page view with path and title', () => {
    initializeGoogleAnalytics()

    trackGoogleAnalytics('/routes?city=Taipei#detail')

    expect(window.dataLayer?.length).toBe(3)

    const pageViewEvent = window.dataLayer?.[2] as [string, string, Record<string, unknown>]

    expect(pageViewEvent[0]).toBe('event')
    expect(pageViewEvent[1]).toBe('page_view')
    expect(pageViewEvent[2]).toMatchObject({
      page_title: 'Test Page',
      page_path: '/routes?city=Taipei#detail',
      send_to: GA_ID
    })
  })

  it('does nothing when measurement id is missing', () => {
    vi.stubEnv('VITE_GA_ID', '')

    const initialized = initializeGoogleAnalytics()

    expect(initialized).toBe(false)

    trackGoogleAnalytics('/routes')

    expect(document.getElementById('google-analytics-gtag-script')).toBeNull()
    expect(window.dataLayer).toBeUndefined()
  })
})
