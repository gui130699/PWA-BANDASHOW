import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import type { QuoteStatus } from '../../types'
import { quoteStatusMeta } from '../../utils/constants'

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ring-1',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const meta = quoteStatusMeta[status]
  const Icon = meta.icon

  return (
    <Badge className={meta.className}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </Badge>
  )
}
