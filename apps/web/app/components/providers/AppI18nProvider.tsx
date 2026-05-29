import { useEffect, type PropsWithChildren } from 'react'
import { useLocation } from 'react-router'
import { useSelector } from 'react-redux'
import { persistLocaleInStorage } from '~/modules/i18n/locale'
import { selectLocale } from '~/modules/slices/localeSlice'
import i18n from '~/modules/i18n'
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
  const locale = useSelector(selectLocale)
  const location = useLocation()

  useEffect(() => {
    let cancelled = false

    const applyLocale = async() => {
      try {
        await i18n.changeLanguage(locale)
      } finally {
        if (cancelled) return
        document.documentElement.lang = locale

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
  }, [locale])

  useEffect(() => {
    document.documentElement.lang = locale
    syncDocumentMetadata(locale)
  }, [locale, location.key])

  return children
}
