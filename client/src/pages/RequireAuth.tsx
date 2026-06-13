import { Navigate, useLocation } from "react-router-dom"
import { useAppSelector } from "../app/hooks"

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const location = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
