import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hourglass,
  Info,
  OctagonX,
  WalletCards,
} from 'lucide-react'
import type { QuoteStatus } from '../types'

export const serviceCategories = [
  'Show',
  'Som',
  'Iluminacao',
  'Transporte',
  'Cerimonial',
  'Hora extra',
  'Estrutura adicional',
  'Outro',
]

export const eventTypes = [
  'Casamento',
  'Aniversario',
  'Formatura',
  'Evento empresarial',
  'Festa particular',
  'Baile',
  'Festival',
  'Outro',
]

export const supplierTypes = [
  'Som',
  'Iluminacao',
  'Transporte',
  'Estrutura',
  'Alimentacao',
  'Hospedagem',
  'Freelancer',
  'Tecnico',
  'Outro',
]

export const brazilianStates = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export const quoteStatusMeta: Record<
  QuoteStatus,
  {
    label: string
    className: string
    icon: typeof Hourglass
  }
> = {
  rascunho: {
    label: 'Rascunho',
    className: 'bg-slate-500/15 text-slate-200 ring-slate-400/20',
    icon: Clock3,
  },
  em_analise: {
    label: 'Em analise',
    className: 'bg-amber-400/15 text-amber-200 ring-amber-300/30',
    icon: Hourglass,
  },
  aprovado_aguardando_entrada: {
    label: 'Aguardando entrada',
    className: 'bg-sky-400/15 text-sky-200 ring-sky-300/30',
    icon: WalletCards,
  },
  entrada_informada_pelo_cliente: {
    label: 'Entrada informada',
    className: 'bg-violet-400/15 text-violet-200 ring-violet-300/30',
    icon: Info,
  },
  entrada_confirmada: {
    label: 'Entrada confirmada',
    className: 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30',
    icon: CheckCircle2,
  },
  agendado: {
    label: 'Agendado',
    className: 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30',
    icon: CalendarDays,
  },
  realizado: {
    label: 'Realizado',
    className: 'bg-green-500/20 text-green-100 ring-green-300/30',
    icon: BadgeCheck,
  },
  recusado: {
    label: 'Recusado',
    className: 'bg-red-500/15 text-red-200 ring-red-300/30',
    icon: OctagonX,
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-red-500/15 text-red-200 ring-red-300/30',
    icon: OctagonX,
  },
}

export const defaultSettings = {
  bandName: 'Grupo Dvanera',
  pixReceiverName: '',
  pixKey: '',
  pixKeyType: 'cpf',
  bankName: '',
  defaultDepositPercent: 50,
  paymentInstructions:
    'Apos realizar o Pix, clique em "Ja realizei o pagamento" para que nossa equipe confirme manualmente.',
  whatsapp: '',
  email: '',
} as const
