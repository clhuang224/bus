import { useEffect, type PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import { setLocaleInStorage } from '~/modules/i18n/locale'
import { selectLocale } from '~/modules/slices/localeSlice'
import i18n from '~/modules/i18n'

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

  useEffect(() => {
    let cancelled = false

    const applyLocale = async () => {
      try {
        await i18n.changeLanguage(locale)
      } finally {
        if (cancelled) return
        document.documentElement.lang = locale
        syncDocumentMetadata(locale)

        try {
          setLocaleInStorage(window.localStorage, locale)
        } catch (error) {
          console.warn('Failed to persist app locale to localStorage.', error)
        }
      }
    }

    void applyLocale()

    return () => {
      cancelled = true
    }
  }, [locale])

  return children
}
