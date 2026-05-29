import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_APP_LOCALE, SUPPORTED_APP_LOCALES } from '../consts/i18n'
import { AppLocaleType } from '../enums/AppLocaleType'
import { getInitialAppLocale } from './locale'
import { en } from './locales/en'
import { zhTW } from './locales/zh-TW'

const resources = {
  [AppLocaleType.ZH_TW]: zhTW,
  [AppLocaleType.EN]: en
} as const

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialAppLocale(),
    fallbackLng: DEFAULT_APP_LOCALE,
    supportedLngs: [...SUPPORTED_APP_LOCALES],
    interpolation: {
      escapeValue: false
    },
    returnNull: false
  })

export default i18n
