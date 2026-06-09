import { ChevronDown } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { clsx } from 'clsx'

type AccordionSectionProps = {
  id: string
  title: string
  description?: string
  icon?: ReactNode
  badge?: ReactNode
  defaultOpen?: boolean
  forceOpen?: boolean
  children: ReactNode
}

export function AccordionSection({
  id,
  title,
  description,
  icon,
  badge,
  defaultOpen = false,
  forceOpen = false,
  children,
}: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const expanded = forceOpen || open

  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])

  return (
    <section
      className={clsx(
        'overflow-hidden rounded-lg border bg-night-850/92 shadow-soft transition-colors motion-reduce:transition-none',
        expanded ? 'border-gold-300/45' : 'border-white/10',
      )}
    >
      <button
        aria-controls={`${id}-content`}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 px-5 py-4 text-left outline-none transition hover:bg-white/[0.035] motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300"
        id={`${id}-trigger`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gold-300/10 text-gold-200">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg text-ivory-50">{title}</span>
            {badge}
          </span>
          {description && <span className="mt-1 block text-sm leading-6 text-slate-400">{description}</span>}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={clsx(
            'h-5 w-5 shrink-0 text-slate-400 transition-transform motion-reduce:transition-none',
            expanded && 'rotate-180 text-gold-200',
          )}
        />
      </button>
      <div
        aria-labelledby={`${id}-trigger`}
        className={clsx(
          'grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        id={`${id}-content`}
        role="region"
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/10 p-5">{children}</div>
        </div>
      </div>
    </section>
  )
}
