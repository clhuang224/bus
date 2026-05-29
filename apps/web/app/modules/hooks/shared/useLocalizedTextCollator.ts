import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectLocale } from '~/modules/slices/localeSlice'

export function useLocalizedTextCollator() {
  const locale = useSelector(selectLocale)

  return useMemo(() => new Intl.Collator(locale, { numeric: true }), [locale])
}
