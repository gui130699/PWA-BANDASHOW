import {
  BadgeCheck,
  CalendarDays,
  Hourglass,
  Info,
  OctagonX,
  WalletCards,
} from 'lucide-react'
import type { QuoteStatus, Settings } from '../types'

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

export const defaultSettings: Settings = {
  bandName: 'Grupo Dvanera',
  instagram: '',
  city: '',
  state: '',
  shortDescription: 'Música ao vivo para momentos que ficam.',
  aboutText:
    'Energia de palco, repertório marcante e uma produção preparada para eventos especiais.',
  pixReceiverName: '',
  pixKey: '',
  pixKeyType: 'cpf',
  bankName: '',
  defaultDepositPercent: 50,
  paymentInstructions:
    'Após realizar o Pix, clique em "Já realizei o pagamento" para que nossa equipe confirme manualmente.',
  paymentWarningMessage: 'Confira a chave e o valor antes de concluir o pagamento.',
  whatsapp: '',
  email: '',
  quoteValidityDays: 7,
  allowManualDiscount: true,
  allowTravelFee: true,
  showEstimatedValueBeforeApproval: true,
  allowClientNotes: true,
  quoteSubmittedMessage: 'Seu orçamento foi enviado para análise.',
  quoteApprovedMessage: 'Seu orçamento foi aprovado.',
  quoteRejectedMessage: 'Seu orçamento não foi aprovado.',
  quoteCanceledMessage: 'Seu orçamento foi cancelado.',
  messages: {
    quoteSubmitted: 'Seu orçamento foi enviado para análise.',
    quoteInReview: 'Nossa equipe está analisando sua solicitação.',
    quoteApproved: 'Seu orçamento foi aprovado.',
    paymentReported: 'O pagamento foi informado e aguarda conferência.',
    depositConfirmed: 'A entrada foi confirmada.',
    eventScheduled: 'Seu evento está agendado.',
    eventCompleted: 'Evento realizado com sucesso.',
    quoteRejected: 'Seu orçamento não foi aprovado.',
    quoteCanceled: 'Seu orçamento foi cancelado.',
  },
  homeTitle: 'Transforme seu evento em uma experiência inesquecível',
  homeSubtitle:
    'Solicite seu orçamento online, escolha os serviços desejados e acompanhe tudo de forma simples e segura.',
  homePrimaryButtonText: 'Solicitar orçamento',
  homeSecondaryButtonText: 'Entrar no sistema',
  useHeroImage: true,
  heroImagePath: '',
  logoPath: '',
  brandAccentColor: '#D6B25E',
}
