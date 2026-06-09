import { Menu } from 'lucide-react'
import { Button } from '../ui'
import { useAuth } from '../../contexts/AuthContext'

type HeaderProps = {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { profile } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-night-950/90 px-4 py-4 backdrop-blur-xl xl:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {onMenuClick && (
            <Button
              aria-label="Abrir menu"
              className="h-10 w-10 px-0 lg:hidden"
              onClick={onMenuClick}
              variant="secondary"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl text-ivory-50">{title}</h1>
            {subtitle && <p className="truncate text-sm text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <div className="hidden rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-right sm:block">
          <p className="text-sm font-medium text-ivory-50">{profile?.name}</p>
          <p className="text-xs text-gold-300">{profile?.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
        </div>
      </div>
    </header>
  )
}
