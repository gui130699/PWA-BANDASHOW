import { useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { MobileMenu } from './MobileMenu'
import { Sidebar, type NavigationItem } from './Sidebar'

type DashboardLayoutProps = {
  title: string
  subtitle: string
  items: NavigationItem[]
  children?: ReactNode
}

export function DashboardLayout({ title, subtitle, items, children }: DashboardLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-night-950 text-white">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,#05060a,#0d111c_55%,#05060a)]" />
      <div className="grid min-h-screen lg:grid-cols-[18rem_1fr]">
        <div className="hidden lg:block">
          <Sidebar items={items} title={title} />
        </div>
        <MobileMenu items={items} onClose={() => setMenuOpen(false)} open={menuOpen} title={title} />
        <main className="min-w-0">
          <Header onMenuClick={() => setMenuOpen(true)} subtitle={subtitle} title={title} />
          <div className="mx-auto max-w-7xl px-4 py-6 xl:px-8">{children || <Outlet />}</div>
        </main>
      </div>
    </div>
  )
}
