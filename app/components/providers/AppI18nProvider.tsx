import { useEffect, type PropsWithChildren } from 'react'
import { useSelector } from 'react-redux'
import { selectLocale } from '~/modules/slices/localeSlice'
import i18n from '~/modules/i18n'

export const AppI18nProvider = ({ children }: PropsWithChildren) => {
  const locale = useSelector(selectLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    void i18n.changeLanguage(locale)
  }, [locale])

  return children
}
