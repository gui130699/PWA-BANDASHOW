import { LogOut, Music2 } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '../ui'
import { useAuth } from '../../contexts/AuthContext'

export type NavigationItem = {
  label: string
  to: string
  icon: ComponentType<{ className?: string }>
}

type SidebarProps = {
  items: NavigationItem[]
  title: string
  onNavigate?: () => void
}

export function Sidebar({ items, title, onNavigate }: SidebarProps) {
  const { profile, logout } = useAuth()

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-white/10 bg-night-950/95">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-gold-400 text-night-950">
          <Music2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Grupo Dvanera</p>
          <p className="text-xs text-slate-400">{title}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              className={({ isActive }) =>
                [
                  'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-gold-400 text-night-950'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white',
                ].join(' ')
              }
              key={item.to}
              onClick={onNavigate}
              to={item.to}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3">
          <p className="truncate text-sm font-semibold text-white">{profile?.name || 'Usuario'}</p>
          <p className="truncate text-xs text-slate-400">{profile?.email}</p>
        </div>
        <Button className="w-full" icon={<LogOut className="h-4 w-4" />} onClick={logout} variant="secondary">
          Sair
        </Button>
      </div>
    </aside>
  )
}
