import { AppLocaleType } from '@bus/shared'

export const DEFAULT_API_ERROR_LOCALE = AppLocaleType.ZH_TW

interface LanguagePreference {
  locale: AppLocaleType.ZH_TW | AppLocaleType.EN
  quality: number
  order: number
}

export function getApiErrorLocale(
  acceptLanguage: string | string[] | undefined,
): AppLocaleType.ZH_TW | AppLocaleType.EN {
  if (!acceptLanguage) return DEFAULT_API_ERROR_LOCALE

  const headerValue = Array.isArray(acceptLanguage)
    ? acceptLanguage.join(',')
    : acceptLanguage
  const locale = headerValue
    .split(',')
    .flatMap((value, order) => toLanguagePreference(value, order))
    .sort(compareLanguagePreferences)
    .find((preference) => preference.quality > 0)?.locale

  return locale ?? DEFAULT_API_ERROR_LOCALE
}

function toLanguagePreference(
  value: string,
  order: number,
): LanguagePreference[] {
  const [languageRange, ...parameters] = value.trim().split(';')
  const locale = toApiErrorLocale(languageRange)

  if (!locale) return []

  return [
    {
      locale,
      quality: toQuality(parameters),
      order,
    },
  ]
}

function toApiErrorLocale(
  languageRange: string | undefined,
): AppLocaleType.ZH_TW | AppLocaleType.EN | null {
  const language = languageRange?.trim()

  if (language !== AppLocaleType.ZH_TW && language !== AppLocaleType.EN) {
    return null
  }

  return language
}

function toQuality(parameters: string[]): number {
  const qualityParameter = parameters.find((parameter) =>
    parameter.trim().toLowerCase().startsWith('q='),
  )

  if (!qualityParameter) return 1

  const quality = Number(qualityParameter.trim().slice(2))

  return Number.isFinite(quality) && quality >= 0 && quality <= 1 ? quality : 0
}

function compareLanguagePreferences(
  left: LanguagePreference,
  right: LanguagePreference,
): number {
  return right.quality - left.quality || left.order - right.order
}
