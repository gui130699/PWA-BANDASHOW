import { LogOut } from 'lucide-react'
import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import { BrandLogo } from '../brand/BrandLogo'
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
    <aside className="flex h-full min-h-0 flex-col border-r border-white/10 bg-night-950/98">
      <div className="border-b border-white/10 px-5 py-5">
        <BrandLogo className="h-16 w-40" />
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{title}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              className={({ isActive }) =>
                [
                  'flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm font-medium transition',
                  isActive
                    ? 'border-gold-300/40 bg-gold-300/12 text-gold-100'
                    : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.045] hover:text-white',
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
        <div className="mb-3 rounded-md border border-white/10 bg-white/[0.035] p-3">
          <p className="truncate text-sm font-semibold text-ivory-50">{profile?.name || 'Usuário'}</p>
          <p className="truncate text-xs text-slate-500">{profile?.email}</p>
        </div>
        <Button className="w-full" icon={<LogOut className="h-4 w-4" />} onClick={logout} variant="secondary">
          Sair
        </Button>
      </div>
    </aside>
  )
}
