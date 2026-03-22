import { useEffect, type PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import { setLocaleInStorage } from '~/modules/i18n/locale'
import { selectLocale } from '~/modules/slices/localeSlice'
import i18n from '~/modules/i18n'

export const AppI18nProvider = ({ children }: PropsWithChildren) => {
  const locale = useSelector(selectLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    try {
      setLocaleInStorage(window.localStorage, locale)
    } catch {
      // Ignore storage write failures and keep the in-memory locale.
    }
    void i18n.changeLanguage(locale)
  }, [locale])

  return children
}
