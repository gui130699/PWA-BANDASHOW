import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-gold-300/20 bg-gold-300/[0.025] px-6 py-12 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-md border border-gold-300/25 bg-gold-300/10">
        <Inbox className="h-6 w-6 text-gold-300" />
      </div>
      <h3 className="font-display text-base text-ivory-50">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
