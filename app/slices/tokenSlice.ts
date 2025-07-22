import { createSlice } from '@reduxjs/toolkit'

export const tokenSlice = createSlice({
  name: 'token',
  initialState: {
    token: '',
    expiresIn: 0,
    loading: false,
    error: null as Error | null
  },
  reducers: {
    getToken: (state) => {
        if (state.loading || !import.meta.env.VITE_TDX_ID) return
        state.loading = true
        fetch(
          'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token', 
            {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: JSON.stringify({
                    'grant_type': 'client_credentials',
                    'client_id': import.meta.env.VITE_TDX_ID,
                    'client_secret': import.meta.env.VITE_TDX_SECRET
                })
            }
        )
        .then((res) => {
          // TODO 處理 token
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
export const { getToken } = tokenSlice.actions

export default tokenSlice.reducer