import { vi } from 'vitest'

interface MockMatchMediaOptions {
  matches?: boolean | ((query: string) => boolean)
}

export function mockMatchMedia({ matches = false }: MockMatchMediaOptions = {}) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: typeof matches === 'function' ? matches(query) : matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
}
