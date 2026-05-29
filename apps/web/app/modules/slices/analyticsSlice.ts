import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

interface AnalyticsState {
  isEnabled: boolean
}

const initialState: AnalyticsState = {
  isEnabled: true
}

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setAnalyticsEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload
    }
  }
})

export const { setAnalyticsEnabled } = analyticsSlice.actions
export const selectAnalyticsEnabled = (state: RootState) => state.analytics.isEnabled

export default analyticsSlice
