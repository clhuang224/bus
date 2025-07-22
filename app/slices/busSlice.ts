import { createSlice } from '@reduxjs/toolkit'
import { allCityNames } from '~/modules/consts/allCityNames'
import type { BusRoute } from '~/modules/interfaces/Bus'
import type { CityNameType } from '~/modules/types/CityNameType'

export const busSlice = createSlice({
  name: 'bus',
  initialState: {
    cities: [...allCityNames] as CityNameType[],
    busRoutes: [] as BusRoute[],
    loading: false,
    error: null as Error | null
  },
  reducers: {
    getBusRoutes: (state) => {
        if (state.loading || !state.cities.length) return
        state.loading = true
        Promise.all(state.cities.map((city) => fetch(`${import.meta.env.VITE_API_BASE}/City/${city}`)))
        .then((res) => {
          // TODO 處理公車資料
          console.log(res)
          state.loading = false
        })
        .catch((error) => {
          // TODO 處理錯誤
          console.log(error)
          state.error = error
          state.loading = false
        })
        
    }
  }
})

// Action creators are generated for each case reducer function
export const { getBusRoutes } = busSlice.actions

export default busSlice.reducer