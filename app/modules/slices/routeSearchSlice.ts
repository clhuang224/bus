import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AreaType } from '../enums/AreaType'

interface RouteSearchState {
  keyword: string
  selectedArea: AreaType | null
}

const initialState: RouteSearchState = {
  keyword: '',
  selectedArea: null
}

const routeSearchSlice = createSlice({
  name: 'routeSearch',
  initialState,
  reducers: {
    setKeyword: (state, action: PayloadAction<string>) => {
      state.keyword = action.payload
    },
    setSelectedArea: (state, action: PayloadAction<AreaType>) => {
      state.selectedArea = action.payload
    }
  }
})

export const { setKeyword, setSelectedArea } = routeSearchSlice.actions

export default routeSearchSlice
