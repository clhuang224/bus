import { useEffect, useState, type PropsWithChildren } from 'react'
import { useLocation } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import { getStoredAppLocale, persistLocaleInStorage } from '~/modules/i18n/locale'
import { selectLocale, setLocale } from '~/modules/slices/localeSlice'
import i18n from '~/modules/i18n'
import type { AppDispatch } from '~/modules/store'
import { isWindowUnavailableError } from '~/modules/utils/shared/getLocalStorage'

function syncDocumentMetadata(locale: string) {
  const t = i18n.getFixedT(locale)
  document.title = t('app.name')

  const existingMetaDescription = document.querySelector('meta[name="description"]')
  if (existingMetaDescription) {
    existingMetaDescription.setAttribute('content', t('app.description'))
    return
  }

  const metaDescription = document.createElement('meta')
  metaDescription.setAttribute('name', 'description')
  metaDescription.setAttribute('content', t('app.description'))
  document.head.appendChild(metaDescription)
}

export const AppI18nProvider = ({ children }: PropsWithChildren) => {
  const dispatch = useDispatch<AppDispatch>()
  const locale = useSelector(selectLocale)
  const location = useLocation()
  const [hasResolvedLocale, setHasResolvedLocale] = useState(false)

  useEffect(() => {
    let storedLocale: ReturnType<typeof getStoredAppLocale>

    try {
      storedLocale = getStoredAppLocale()
    } catch (error) {
      if (!isWindowUnavailableError(error)) {
        console.warn('Failed to load app locale from localStorage.', error)
      }

      setHasResolvedLocale(true)
      return
    }

    if (storedLocale && storedLocale !== locale) {
      dispatch(setLocale(storedLocale))
    }

    setHasResolvedLocale(true)
  }, [dispatch])

  useEffect(() => {
    let cancelled = false

    const applyLocale = async () => {
      try {
        await i18n.changeLanguage(locale)
      } finally {
        if (cancelled) return
        document.documentElement.lang = locale

        if (!hasResolvedLocale) {
          return
        }

        try {
          persistLocaleInStorage(locale)
        } catch (error) {
          if (isWindowUnavailableError(error)) {
            return
          }

          console.warn('Failed to persist app locale to localStorage.', error)
        }
      }
    }

    void applyLocale()

    return () => {
      cancelled = true
    }
  }, [hasResolvedLocale, locale])

  useEffect(() => {
    document.documentElement.lang = locale
    syncDocumentMetadata(locale)
  }, [locale, location.key])

  return children
}
