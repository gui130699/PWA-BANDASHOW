import { clsx } from 'clsx'
import type { ComponentType } from 'react'

type MetricCardProps = {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }>
  tone?: 'gold' | 'green' | 'blue' | 'neutral'
}

const tones = {
  gold: 'border-gold-300/25 bg-gold-300/[0.055] text-gold-300',
  green: 'border-emerald-300/20 bg-emerald-400/[0.05] text-emerald-300',
  blue: 'border-sky-300/20 bg-sky-400/[0.05] text-sky-300',
  neutral: 'border-white/10 bg-white/[0.035] text-ivory-100',
}

export function MetricCard({ label, value, icon: Icon, tone = 'neutral' }: MetricCardProps) {
  return (
    <article className={clsx('min-w-0 rounded-lg border p-5 shadow-soft transition hover:-translate-y-0.5', tones[tone])}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words text-2xl font-semibold text-ivory-50">{value}</p>
          <p className="mt-1 text-sm leading-5 text-slate-400">{label}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-current/20 bg-black/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  )
}
