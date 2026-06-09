import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

type ModalProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ open, title, children, onClose }: ModalProps) {
  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  if (!open) return null

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="max-h-[90vh] w-full max-w-3xl animate-fade-up overflow-y-auto rounded-lg border border-gold-300/20 bg-night-900 p-5 shadow-soft">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg text-ivory-50">{title}</h2>
          <Button aria-label="Fechar" className="h-10 w-10 px-0" onClick={onClose} variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
