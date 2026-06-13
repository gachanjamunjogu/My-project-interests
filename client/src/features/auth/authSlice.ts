import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface AuthState {
  accessToken: string | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: AuthState = {
  accessToken: null,
  status: "idle",
  error: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string }>) {
      state.accessToken = action.payload.accessToken
      state.status = "succeeded"
      state.error = null
    },
    clearCredentials(state) {
      state.accessToken = null
      state.status = "idle"
      state.error = null
    },
    setLoading(state) {
      state.status = "loading"
      state.error = null
    },
    setError(state, action: PayloadAction<string>) {
      state.status = "failed"
      state.error = action.payload
    },
  },
})

export const { setCredentials, clearCredentials, setLoading, setError } = authSlice.actions
export default authSlice.reducer
