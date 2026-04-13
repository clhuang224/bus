// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppI18nProvider } from '~/components/providers/AppI18nProvider'
import { APP_LOCALE_STORAGE_KEY } from '~/modules/consts/i18n'
import { AppLocaleType } from '~/modules/enums/AppLocaleType'
import { loadLocaleFromStorage } from '~/modules/i18n/locale'
import i18n from '~/modules/i18n'
import { createTestStore } from '~/test/createTestStore'
import { renderWithProvidersAndRouter } from '~/test/render'
import Settings from './Settings'

const {
  mockNavigate,
  mockUseMediaQuery
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseMediaQuery: vi.fn()
}))

vi.mock('@mantine/hooks', async () => {
  const actual = await vi.importActual<typeof import('@mantine/hooks')>('@mantine/hooks')
  return {
    ...actual,
    useMediaQuery: mockUseMediaQuery
  }
})

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

function renderSettingsPage(initialLocale?: AppLocaleType) {
  const locale = initialLocale ?? loadLocaleFromStorage()
  const store = createTestStore({
    preloadedState: {
      locale: {
        value: locale
      }
    }
  })

  return {
    store,
    ...renderWithProvidersAndRouter(
      <AppI18nProvider>
        <Settings />
      </AppI18nProvider>,
      { store }
    )
  }
}

const getSettingsT = (locale: AppLocaleType) => i18n.getFixedT(locale)

const getLocaleRadio = (uiLocale: AppLocaleType, optionLocale: AppLocaleType) => {
  const t = getSettingsT(uiLocale)
  const key = optionLocale === AppLocaleType.ZH_TW
    ? 'pages.settings.localeOptions.zhTW.label'
    : 'pages.settings.localeOptions.en.label'

  return screen.getByRole('radio', { name: t(key) })
}

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockReset()
    mockUseMediaQuery.mockReset()
    mockUseMediaQuery.mockReturnValue(false)
  })

  it('shows the currently selected locale', () => {
    renderSettingsPage()

    expect(screen.getByRole('radio', { name: '繁體中文' })).toBeChecked()
  })

  it('updates the locale and persists it when the user changes language', async () => {
    const { store } = renderSettingsPage()

    fireEvent.click(getLocaleRadio(AppLocaleType.EN, AppLocaleType.EN))

    expect(store.getState().locale.value).toBe(AppLocaleType.EN)

    await waitFor(() => {
      expect(document.documentElement.lang).toBe(AppLocaleType.EN)
    })

    await waitFor(() => {
      expect(localStorage.getItem(APP_LOCALE_STORAGE_KEY)).toBe(AppLocaleType.EN)
    })
  })

  it('restores the saved locale from localStorage after mount', async () => {
    localStorage.setItem(APP_LOCALE_STORAGE_KEY, AppLocaleType.EN)

    renderSettingsPage()

    await waitFor(() => {
      expect(document.documentElement.lang).toBe(AppLocaleType.EN)
    })

    expect(getLocaleRadio(AppLocaleType.EN, AppLocaleType.EN)).toBeChecked()
  })

  it('does not overwrite the restored locale during startup reconciliation', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    try {
      localStorage.setItem(APP_LOCALE_STORAGE_KEY, AppLocaleType.EN)

      renderSettingsPage()

      await waitFor(() => {
        expect(getLocaleRadio(AppLocaleType.EN, AppLocaleType.EN)).toBeChecked()
      })

      expect(setItemSpy.mock.calls).not.toContainEqual([
        APP_LOCALE_STORAGE_KEY,
        AppLocaleType.ZH_TW
      ])
    } finally {
      setItemSpy.mockRestore()
    }
  })

  it('allows switching away from the restored locale', async () => {
    localStorage.setItem(APP_LOCALE_STORAGE_KEY, AppLocaleType.EN)

    const { store } = renderSettingsPage()

    await waitFor(() => {
      expect(getLocaleRadio(AppLocaleType.EN, AppLocaleType.EN)).toBeChecked()
    })

    fireEvent.click(getLocaleRadio(AppLocaleType.EN, AppLocaleType.ZH_TW))

    await waitFor(() => {
      expect(store.getState().locale.value).toBe(AppLocaleType.ZH_TW)
      expect(document.documentElement.lang).toBe(AppLocaleType.ZH_TW)
    })

    await waitFor(() => {
      expect(localStorage.getItem(APP_LOCALE_STORAGE_KEY)).toBe(AppLocaleType.ZH_TW)
    })
  })

  it('keeps the provided locale when localStorage has no saved value', async () => {
    renderSettingsPage(AppLocaleType.EN)

    await waitFor(() => {
      expect(document.documentElement.lang).toBe(AppLocaleType.EN)
    })

    expect(getLocaleRadio(AppLocaleType.EN, AppLocaleType.EN)).toBeChecked()
  })

  it('does not show the back button on desktop', () => {
    renderSettingsPage()

    expect(screen.queryByRole('button', { name: i18n.t('pages.settings.backAriaLabel') })).not.toBeInTheDocument()
  })

  it('returns to the previous page from the settings header on mobile', () => {
    mockUseMediaQuery.mockReturnValue(true)

    renderSettingsPage()

    fireEvent.click(screen.getByRole('button', { name: i18n.t('pages.settings.backAriaLabel') }))

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })
})
