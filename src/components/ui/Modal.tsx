import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

type ModalProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl animate-fade-up rounded-lg border border-gold-300/15 bg-night-900 p-5 shadow-soft">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg text-ivory-50">{title}</h2>
          <Button aria-label="Fechar" className="h-10 w-10 px-0" onClick={onClose} variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
