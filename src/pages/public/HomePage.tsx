import { ArrowRight, CalendarCheck, ShieldCheck, Sparkles, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImage from '../../assets/dvanera-hero.png'
import { FirebaseNotice } from '../../components/FirebaseNotice'
import { Button, Card } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'

const highlights = [
  {
    title: 'Orcamentos guiados',
    description: 'Cliente informa dados do evento, escolhe servicos e acompanha cada status.',
    icon: Sparkles,
  },
  {
    title: 'Agenda operacional',
    description: 'Eventos aprovados entram no calendario depois da confirmacao da entrada.',
    icon: CalendarCheck,
  },
  {
    title: 'Pix com conferencia manual',
    description: 'Entrada de 50%, chave Pix configuravel e confirmacao segura pelo admin.',
    icon: WalletCards,
  },
  {
    title: 'Custos protegidos',
    description: 'Admin enxerga fornecedores, integrantes, custos e lucro estimado.',
    icon: ShieldCheck,
  },
]

export function HomePage() {
  const { firebaseReady } = useAuth()

  return (
    <div className="min-h-screen bg-night-950 text-white">
      <Link
        aria-label="Acessar admin"
        className="fixed right-4 top-4 z-30 grid h-12 w-12 place-items-center rounded-md border border-white/15 bg-night-950/80 text-gold-200 shadow-soft backdrop-blur transition hover:border-gold-300/70 hover:bg-gold-400 hover:text-night-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
        title="Acessar admin"
        to="/admin/acesso"
      >
        <ShieldCheck className="h-5 w-5" />
      </Link>
      <section
        className="relative flex min-h-[92vh] items-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-night-950 via-night-950/72 to-night-950/25" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-night-950 to-transparent" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-gold-300">
              Gestao de Agenda e Orcamentos
            </p>
            <h1 className="text-5xl font-bold leading-tight text-white md:text-7xl">Grupo Dvanera</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Um PWA completo para administrar shows, servicos, custos internos, integrantes,
              fornecedores, pagamentos Pix e a agenda da banda com visual premium.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/cadastro">
                <Button className="w-full sm:w-auto" icon={<ArrowRight className="h-4 w-4" />}>
                  Solicitar orcamento
                </Button>
              </Link>
              <Link to="/login">
                <Button className="w-full sm:w-auto" variant="secondary">
                  Entrar no sistema
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto -mt-12 max-w-7xl px-4 pb-16 lg:px-8">
        {!firebaseReady && <div className="mb-6"><FirebaseNotice /></div>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon

            return (
              <Card className="bg-night-900/90" key={item.title}>
                <Icon className="mb-4 h-8 w-8 text-gold-300" />
                <h2 className="text-base font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
