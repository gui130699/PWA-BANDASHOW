import { X } from 'lucide-react'
import { Button } from '../ui'
import { Sidebar, type NavigationItem } from './Sidebar'

type MobileMenuProps = {
  open: boolean
  title: string
  items: NavigationItem[]
  onClose: () => void
}

export function MobileMenu({ open, title, items, onClose }: MobileMenuProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        aria-label="Fechar menu"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        type="button"
      />
      <div className="relative h-full w-[min(84vw,22rem)]">
        <div className="absolute right-3 top-3 z-10">
          <Button aria-label="Fechar menu" className="h-10 w-10 px-0" onClick={onClose} variant="secondary">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Sidebar items={items} onNavigate={onClose} title={title} />
      </div>
    </div>
  )
}
