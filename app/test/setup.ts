import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { DEFAULT_APP_LOCALE } from '~/modules/consts/i18n'
import i18n from '~/modules/i18n'

afterEach(async () => {
  cleanup()
  if (typeof document !== 'undefined') {
    document.documentElement.lang = DEFAULT_APP_LOCALE
  }
  await i18n.changeLanguage(DEFAULT_APP_LOCALE)
})

if (typeof window !== 'undefined') {
  // Mantine and responsive hooks rely on matchMedia in jsdom.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })
}

// ScrollArea depends on ResizeObserver in tests.
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

if (typeof HTMLElement !== 'undefined') {
  // Selection helpers call scrollIntoView when syncing focus.
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    writable: true,
    value: vi.fn()
  })

  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    writable: true,
    value: vi.fn()
  })
}
