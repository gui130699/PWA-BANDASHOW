import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'primary' | 'success'
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'primary',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal onClose={onCancel} open={open} title={title}>
      <div className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />
        <p className="text-sm leading-6 text-slate-300">{description}</p>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} variant="secondary">
          Cancelar
        </Button>
        <Button onClick={onConfirm} variant={variant}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
