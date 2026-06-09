import { Check } from 'lucide-react'
import type { QuoteStatus } from '../../types'

const steps: { status: QuoteStatus; label: string }[] = [
  { status: 'em_analise', label: 'Solicitado' },
  { status: 'aprovado_aguardando_entrada', label: 'Aprovado' },
  { status: 'entrada_informada_pelo_cliente', label: 'Entrada informada' },
  { status: 'agendado', label: 'Agendado' },
  { status: 'realizado', label: 'Realizado' },
]

export function QuoteTimeline({ status }: { status: QuoteStatus }) {
  const currentIndex = steps.findIndex((step) => step.status === status)
  const interrupted = status === 'recusado' || status === 'cancelado'

  return (
    <ol className="grid gap-3 sm:grid-cols-5">
      {steps.map((step, index) => {
        const completed = !interrupted && index <= currentIndex
        return (
          <li className="relative flex min-w-0 items-center gap-3 sm:block" key={step.status}>
            <span
              className={[
                'grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold',
                completed
                  ? 'border-gold-300 bg-gold-400 text-night-950'
                  : 'border-white/15 bg-night-800 text-slate-500',
              ].join(' ')}
            >
              {completed ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <p className={completed ? 'text-sm font-medium text-ivory-50 sm:mt-2' : 'text-sm text-slate-500 sm:mt-2'}>
              {step.label}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
