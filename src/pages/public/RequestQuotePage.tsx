import { ArrowRight, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, Button } from '../../components/ui'

export function RequestQuotePage() {
  return (
    <div className="min-h-screen bg-night-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Card>
          <ClipboardList className="mb-5 h-10 w-10 text-gold-300" />
          <h1 className="text-3xl font-semibold">Solicitar orcamento</h1>
          <p className="mt-4 leading-7 text-slate-300">
            Para acompanhar status, aprovacao e pagamento Pix com seguranca, crie seu cadastro ou
            entre no painel do cliente. O formulario completo fica em "Novo orcamento" depois do login.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/cadastro">
              <Button className="w-full sm:w-auto" icon={<ArrowRight className="h-4 w-4" />}>
                Criar cadastro
              </Button>
            </Link>
            <Link to="/login">
              <Button className="w-full sm:w-auto" variant="secondary">
                Ja tenho acesso
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
