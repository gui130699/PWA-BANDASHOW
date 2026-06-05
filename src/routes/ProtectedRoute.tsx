import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loading } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../types'

export function ProtectedRoute({ role }: { role?: UserRole }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading label="Validando acesso..." />

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (role && profile?.role !== role) {
    return <Navigate replace to={profile?.role === 'admin' ? '/admin/dashboard' : '/cliente'} />
  }

  return <Outlet />
}
