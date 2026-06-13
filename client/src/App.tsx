import { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "./app/hooks"
import { setAuthorizationToken } from "./services/api"
import { setCredentials, clearCredentials } from "./features/auth/authSlice"
import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import Register from "./pages/Register"
import RequireAuth from "./pages/RequireAuth"

export default function App() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((state) => state.auth.accessToken)

  useEffect(() => {
    const token = localStorage.getItem("aura_access_token")
    if (token) {
      dispatch(setCredentials({ accessToken: token }))
      setAuthorizationToken(token)
    }
  }, [dispatch])

  useEffect(() => {
    setAuthorizationToken(accessToken)
    if (accessToken) {
      localStorage.setItem("aura_access_token", accessToken)
    } else {
      localStorage.removeItem("aura_access_token")
    }
  }, [accessToken])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
