import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button, Card, Loading } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../types'

export function ProtectedRoute({ role }: { role?: UserRole }) {
  const { user, profile, loading, logout } = useAuth()
  const location = useLocation()

  if (loading) return <Loading label="Validando acesso..." />

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (!profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-night-950 px-4 text-white">
        <Card
          className="w-full max-w-md"
          description="Sua conta existe no Firebase Authentication, mas o perfil do aplicativo não foi encontrado. Saia e fale com a administração."
          title="Perfil não encontrado"
        >
          <Button className="w-full" onClick={() => void logout()} variant="secondary">
            Sair da conta
          </Button>
        </Card>
      </div>
    )
  }

  if (role && profile?.role !== role) {
    return <Navigate replace to={profile?.role === 'admin' ? '/admin/dashboard' : '/cliente'} />
  }

  return <Outlet />
}
