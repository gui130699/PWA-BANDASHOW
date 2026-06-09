import { Loader2 } from 'lucide-react'

export function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-slate-300">
      <div className="grid h-10 w-10 place-items-center rounded-full border border-gold-300/20 bg-gold-300/[0.06]">
        <Loader2 className="h-5 w-5 animate-spin text-gold-300" />
      </div>
      <span>{label}</span>
    </div>
  )
}
