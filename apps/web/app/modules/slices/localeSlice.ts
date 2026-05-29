import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { getInitialAppLocale } from '../i18n/locale'
import type { AppLocaleType } from '../enums/AppLocaleType'
import type { RootState } from '../store'

interface LocaleState {
  value: AppLocaleType
}

const initialState: LocaleState = {
  value: getInitialAppLocale()
}

const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setLocale: (state, action: PayloadAction<AppLocaleType>) => {
      state.value = action.payload
    }
  }
})

export const { setLocale } = localeSlice.actions
export const selectLocale = (state: RootState) => state.locale.value

export default localeSlice
