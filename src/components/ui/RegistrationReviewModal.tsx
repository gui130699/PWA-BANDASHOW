import { CheckCircle2 } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

type ReviewItem = {
  label: string
  value: string
}

type RegistrationReviewModalProps = {
  open: boolean
  title: string
  description: string
  items: ReviewItem[]
  confirmLabel: string
  isLoading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function RegistrationReviewModal({
  open,
  title,
  description,
  items,
  confirmLabel,
  isLoading,
  onCancel,
  onConfirm,
}: RegistrationReviewModalProps) {
  return (
    <Modal onClose={onCancel} open={open} title={title}>
      <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
          <p className="text-sm leading-6 text-emerald-50">{description}</p>
        </div>
      </div>

      <dl className="mt-5 divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10">
        {items.map((item) => (
          <div className="grid gap-1 bg-white/[0.025] px-4 py-3 sm:grid-cols-[11rem_1fr]" key={item.label}>
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {item.label}
            </dt>
            <dd className="whitespace-pre-line text-sm text-ivory-50">{item.value || '-'}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button disabled={isLoading} onClick={onCancel} variant="secondary">
          Voltar e corrigir
        </Button>
        <Button isLoading={isLoading} onClick={onConfirm} variant="success">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
