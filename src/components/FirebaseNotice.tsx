import { AlertCircle } from 'lucide-react'
import { Card } from './ui'

export function FirebaseNotice() {
  return (
    <Card className="border-amber-300/25 bg-amber-300/8">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />
        <div>
          <h2 className="text-sm font-semibold text-white">Firebase pendente de configuracao</h2>
          <p className="mt-1 text-sm leading-6 text-amber-100/80">
            Copie `.env.example` para `.env` e preencha as chaves do projeto `pwa-bandashow`
            para habilitar login, Firestore e operacoes reais.
          </p>
        </div>
      </div>
    </Card>
  )
}
