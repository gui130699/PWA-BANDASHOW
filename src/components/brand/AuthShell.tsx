import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../../assets/dvanera-hero.jpg'
import { BrandLogo } from './BrandLogo'

type AuthShellProps = {
  children: ReactNode
  eyebrow: string
}

export function AuthShell({ children, eyebrow }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-night-950 text-white">
      <div
        className="fixed inset-0 bg-cover bg-[70%_center] opacity-35"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="fixed inset-0 bg-night-950/78" />
      <Link
        aria-label="Voltar para a tela inicial"
        className="fixed right-6 top-6 z-20 hidden h-11 w-11 place-items-center rounded-md border border-white/15 bg-black/45 text-ivory-50 backdrop-blur transition hover:border-gold-300 hover:text-gold-300 lg:grid"
        title="Voltar para a tela inicial"
        to="/"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden min-h-screen flex-col justify-between border-r border-white/10 p-10 lg:flex">
          <Link aria-label="Voltar para o início" className="w-fit" to="/">
            <BrandLogo className="h-24 w-56" />
          </Link>
          <div className="max-w-md pb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">{eyebrow}</p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-ivory-50">
              Shows memoráveis. Gestão simples. Tudo no mesmo ritmo.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Acompanhe orçamentos, pagamentos e eventos com a experiência oficial do Grupo Dvanera.
            </p>
          </div>
        </aside>
        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-2xl animate-fade-up">
            <div className="mb-5 flex items-center justify-between gap-4 lg:hidden">
              <BrandLogo className="h-16 w-40" />
              <Link
                aria-label="Voltar para o início"
                className="grid h-11 w-11 place-items-center rounded-md border border-white/15 bg-black/35 text-ivory-50 transition hover:border-gold-300"
                title="Voltar para o início"
                to="/"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
