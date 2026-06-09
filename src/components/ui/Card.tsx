import type { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string
  description?: string
  action?: ReactNode
}

export function Card({ title, description, action, className, children, ...props }: CardProps) {
  return (
    <section
      className={clsx(
        'rounded-lg border border-white/10 bg-night-850/92 p-5 shadow-soft backdrop-blur transition-colors',
        className,
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="font-display text-lg text-ivory-50">{title}</h2>}
            {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
