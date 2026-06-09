import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Headphones,
  MessageCircle,
  Music2,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../../assets/dvanera-hero.jpg'
import { BrandLogo } from '../../components/brand/BrandLogo'
import { FirebaseNotice } from '../../components/FirebaseNotice'
import { Button } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { getPublicSettings } from '../../services/settingsService'
import type { PublicSettings } from '../../types'

const services = [
  {
    title: 'Show completo',
    description: 'Repertório envolvente e estrutura pensada para transformar a pista.',
    icon: Music2,
  },
  {
    title: 'Experiência personalizada',
    description: 'Formato, duração e serviços alinhados ao estilo do seu evento.',
    icon: Sparkles,
  },
  {
    title: 'Produção integrada',
    description: 'Organização de agenda, equipe e fornecedores em uma única operação.',
    icon: Headphones,
  },
]

const steps = [
  'Informe os dados do evento',
  'Escolha os serviços',
  'Envie para análise',
  'Receba a aprovação',
  'Pague a entrada via Pix',
  'Tenha seu evento confirmado',
]

const reasons = [
  'Atendimento organizado do primeiro contato ao evento',
  'Orçamento transparente e acompanhamento online',
  'Pagamento Pix com conferência administrativa',
  'Agenda e status atualizados em tempo real',
]

function whatsappUrl(value?: string) {
  const digits = value?.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

export function HomePage() {
  const { firebaseReady } = useAuth()
  const [settings, setSettings] = useState<PublicSettings | null>(null)

  useEffect(() => {
    getPublicSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  const whatsapp = whatsappUrl(settings?.whatsapp)
  const logoPath = settings?.logoPath?.trim() || undefined
  const heroBackground =
    settings?.useHeroImage === false
      ? undefined
      : settings?.heroImagePath?.trim() || heroImage

  return (
    <div className="min-h-screen bg-night-950 text-white">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-night-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
          <Link aria-label="Grupo Dvanera - início" to="/">
            <BrandLogo className="h-16 w-40 sm:w-48" src={logoPath} />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a className="transition hover:text-gold-300" href="#sobre">Sobre</a>
            <a className="transition hover:text-gold-300" href="#servicos">Serviços</a>
            <a className="transition hover:text-gold-300" href="#como-funciona">Como funciona</a>
          </nav>
          <Link
            aria-label="Acessar painel administrativo"
            className="grid h-11 w-11 place-items-center rounded-md border border-white/15 bg-white/[0.045] text-gold-300 transition hover:border-gold-300/60 hover:bg-gold-300/10"
            title="Acessar painel administrativo"
            to="/admin/acesso"
          >
            <ShieldCheck className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <section
        className="relative flex min-h-[88vh] items-end overflow-hidden bg-cover bg-center pt-20"
        style={heroBackground ? { backgroundImage: `url(${heroBackground})` } : undefined}
      >
        <div className="absolute inset-0 bg-black/58" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-24 lg:px-8 lg:pb-20">
          <div className="max-w-3xl animate-fade-up">
            <BrandLogo className="mb-8 h-28 w-[min(80vw,34rem)]" src={logoPath} />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">
              {settings?.shortDescription || 'Música ao vivo para momentos que ficam'}
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.08] text-ivory-50 sm:text-5xl lg:text-6xl">
              {settings?.homeTitle || 'Transforme seu evento em uma experiência inesquecível'}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              {settings?.homeSubtitle ||
                'Solicite seu orçamento online, escolha os serviços desejados e acompanhe tudo de forma simples e segura.'}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/cadastro">
                <Button className="w-full sm:w-auto" icon={<ArrowRight className="h-4 w-4" />}>
                  {settings?.homePrimaryButtonText || 'Solicitar orçamento'}
                </Button>
              </Link>
              <Link to="/login">
                <Button className="w-full sm:w-auto" variant="secondary">
                  {settings?.homeSecondaryButtonText || 'Entrar no sistema'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main>
        {!firebaseReady && (
          <div className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
            <FirebaseNotice />
          </div>
        )}

        <section className="border-y border-white/10 bg-night-900" id="sobre">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Sobre</p>
              <h2 className="mt-3 font-display text-3xl text-ivory-50 sm:text-4xl">Grupo Dvanera</h2>
            </div>
            <div className="max-w-3xl">
              <p className="text-lg leading-8 text-slate-200">
                {settings?.aboutText ||
                  'Energia de palco, repertório marcante e uma produção preparada para casamentos, formaturas, eventos empresariais e celebrações especiais.'}
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Atendimento', value: 'Próximo', icon: Users },
                  { label: 'Gestão', value: 'Organizada', icon: ClipboardCheck },
                  { label: 'Experiência', value: 'Memorável', icon: CalendarCheck },
                ].map(({ label, value, icon: Icon }) => (
                  <div className="border-l-2 border-gold-400 pl-4" key={label}>
                    <Icon className="mb-3 h-5 w-5 text-gold-300" />
                    <p className="font-display text-lg text-ivory-50">{value}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8" id="servicos">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Serviços</p>
            <h2 className="mt-3 font-display text-3xl text-ivory-50 sm:text-4xl">
              Uma entrega completa para o seu evento
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {services.map(({ title, description, icon: Icon }) => (
              <article
                className="rounded-lg border border-white/10 bg-night-850 p-6 transition hover:-translate-y-1 hover:border-gold-300/35"
                key={title}
              >
                <div className="grid h-11 w-11 place-items-center rounded-md border border-gold-300/25 bg-gold-300/10 text-gold-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg text-ivory-50">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-night-900" id="como-funciona">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Como funciona</p>
              <h2 className="mt-3 font-display text-3xl text-ivory-50 sm:text-4xl">
                Do primeiro contato ao evento confirmado
              </h2>
            </div>
            <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step, index) => (
                <li className="min-h-36 bg-night-850 p-5" key={step}>
                  <span className="text-sm font-semibold text-gold-300">0{index + 1}</span>
                  <p className="mt-6 max-w-xs font-display text-lg text-ivory-50">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Por que contratar</p>
            <h2 className="mt-3 font-display text-3xl text-ivory-50 sm:text-4xl">
              Mais segurança para você curtir cada momento
            </h2>
          </div>
          <ul className="grid gap-4">
            {reasons.map((reason) => (
              <li className="flex gap-3 border-b border-white/10 pb-4 text-slate-200" key={reason}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-white/10 bg-gold-400 text-night-950">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Seu evento começa aqui</p>
              <h2 className="mt-2 max-w-2xl font-display text-3xl">
                Conte sua ideia. O Grupo Dvanera cuida do próximo passo.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/cadastro">
                <Button className="w-full border-night-950 bg-night-950 text-white hover:bg-night-800 sm:w-auto">
                  Pedir orçamento
                </Button>
              </Link>
              {whatsapp && (
                <a href={whatsapp} rel="noreferrer" target="_blank">
                  <Button
                    className="w-full border-night-950/25 bg-transparent text-night-950 hover:bg-black/10 sm:w-auto"
                    icon={<MessageCircle className="h-4 w-4" />}
                    variant="secondary"
                  >
                    WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-night-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <BrandLogo className="h-16 w-40" src={logoPath} />
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <span>Grupo Dvanera</span>
            <span>Agenda, orçamentos e pagamentos</span>
            <WalletCards className="h-4 w-4 text-gold-300" />
          </div>
        </div>
      </footer>
    </div>
  )
}
