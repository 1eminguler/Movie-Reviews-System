import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth.ts'

export default function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <p className="text-neutral-400">Yükleniyor...</p>
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
