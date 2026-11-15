import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth.ts'

export default function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <p className="px-[clamp(16px,2.5vw,48px)] py-10 text-mute">Loading…</p>
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
