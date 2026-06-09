import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'admin' | 'client'

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'

export type QuoteStatus =
  | 'em_analise'
  | 'aprovado_aguardando_entrada'
  | 'entrada_informada_pelo_cliente'
  | 'agendado'
  | 'realizado'
  | 'recusado'
  | 'cancelado'

export type PaymentStatus = 'pendente' | 'informado_pelo_cliente' | 'confirmado' | 'cancelado'

export type DateLike = Timestamp | Date | string | null | undefined

export type FirestoreEntity = {
  id: string
  createdAt?: DateLike
  updatedAt?: DateLike
}

export type AdminOption = FirestoreEntity & {
  name: string
  description?: string
  active: boolean
  order?: number
}

export type AppUser = {
  uid: string
  name: string
  email: string
  phone?: string
  role: UserRole
  createdAt?: DateLike
  updatedAt?: DateLike
}

export type Client = FirestoreEntity & {
  userId: string
  name: string
  document: string
  phone: string
  email: string
  city: string
  state: string
  notes?: string
}

export type CostSnapshot = {
  type: 'supplier' | 'member' | 'manual'
  refId?: string
  name: string
  cost: number
  quantity?: number
  totalCost?: number
  notes?: string
}

export type SupplierLink = {
  supplierId: string
  supplierName: string
  cost: number
  description?: string
}

export type MemberCostLink = {
  memberId: string
  memberName: string
  cost: number
  description?: string
}

export type Service = FirestoreEntity & {
  name: string
  description: string
  category: string
  basePrice: number
  active: boolean
  allowPriceEdit: boolean
  supplierLinks: SupplierLink[]
  memberCostLinks: MemberCostLink[]
  internalNotes?: string
}

export type PublicService = FirestoreEntity & {
  serviceId: string
  name: string
  description: string
  category: string
  basePrice: number
  active: boolean
  allowPriceEdit: boolean
}

export type BandMember = FirestoreEntity & {
  name: string
  artisticName?: string
  role: string
  phone?: string
  email?: string
  pixKey?: string
  pixKeyType?: Exclude<PixKeyType, 'cnpj'>
  defaultPayment: number
  active: boolean
  notes?: string
}

export type Supplier = FirestoreEntity & {
  name: string
  type: string
  contactName?: string
  phone?: string
  email?: string
  pixKey?: string
  pixKeyType?: Exclude<PixKeyType, 'cnpj'>
  defaultCost: number
  active: boolean
  notes?: string
}

export type QuoteEvent = {
  date: string
  time: string
  type: string
  venueName: string
  address: string
  city: string
  state: string
  estimatedGuests: number
  notes?: string
}

export type QuoteItem = {
  serviceId: string
  serviceName: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  costSnapshot: CostSnapshot[]
}

export type Quote = FirestoreEntity & {
  clientId: string
  clientUserId: string
  clientSnapshot: {
    name: string
    document: string
    phone: string
    email: string
    city: string
    state: string
  }
  event: QuoteEvent
  items: QuoteItem[]
  manualCosts: CostSnapshot[]
  subtotal: number
  discount: number
  travelFee: number
  total: number
  totalCosts: number
  estimatedProfit: number
  estimatedMargin: number
  depositPercent: number
  depositAmount: number
  remainingAmount: number
  status: QuoteStatus
  adminNotes?: string
  clientNotes?: string
  rejectionReason?: string
  approvedAt?: DateLike
  depositConfirmedAt?: DateLike
}

export type ClientQuoteViewItem = Omit<QuoteItem, 'costSnapshot'>

export type ClientQuoteView = FirestoreEntity & {
  quoteId: string
  clientId: string
  clientUserId: string
  clientSnapshot: Quote['clientSnapshot']
  event: QuoteEvent
  items: ClientQuoteViewItem[]
  subtotal: number
  discount: number
  travelFee: number
  total: number
  depositPercent: number
  depositAmount: number
  remainingAmount: number
  status: QuoteStatus
  clientNotes?: string
  rejectionReason?: string
  paymentSummary?: {
    depositStatus?: PaymentStatus
    remainingStatus?: PaymentStatus
  }
  approvedAt?: DateLike
  depositConfirmedAt?: DateLike
}

export type Payment = FirestoreEntity & {
  quoteId: string
  clientId: string
  clientUserId?: string
  type: 'entrada' | 'restante' | 'entrada_50' | 'restante_50' | 'outro'
  amount: number
  status: PaymentStatus
  pixKeyUsed: string
  clientMessage?: string
  confirmedBy?: string
  confirmedAt?: DateLike
}

export type MemberPayment = FirestoreEntity & {
  memberId: string
  quoteId?: string
  memberName: string
  amount: number
  status: 'pendente' | 'pago'
  pixKey?: string
  notes?: string
  paidAt?: DateLike
}

export type SupplierPayment = FirestoreEntity & {
  supplierId: string
  quoteId?: string
  supplierName: string
  amount: number
  status: 'pendente' | 'pago'
  pixKey?: string
  notes?: string
  paidAt?: DateLike
}

export type Settings = {
  id?: string
  bandName: string
  instagram?: string
  city?: string
  state?: string
  shortDescription?: string
  aboutText?: string
  pixReceiverName: string
  pixKey: string
  pixKeyType: PixKeyType
  bankName?: string
  defaultDepositPercent: number
  paymentInstructions: string
  paymentWarningMessage?: string
  whatsapp?: string
  email?: string
  quoteValidityDays?: number
  allowManualDiscount?: boolean
  allowTravelFee?: boolean
  showEstimatedValueBeforeApproval?: boolean
  allowClientNotes?: boolean
  quoteSubmittedMessage?: string
  quoteApprovedMessage?: string
  quoteRejectedMessage?: string
  quoteCanceledMessage?: string
  messages?: {
    quoteSubmitted?: string
    quoteInReview?: string
    quoteApproved?: string
    paymentReported?: string
    depositConfirmed?: string
    eventScheduled?: string
    eventCompleted?: string
    quoteRejected?: string
    quoteCanceled?: string
  }
  homeTitle?: string
  homeSubtitle?: string
  homePrimaryButtonText?: string
  homeSecondaryButtonText?: string
  useHeroImage?: boolean
  heroImagePath?: string
  logoPath?: string
  brandAccentColor?: string
  serviceTypes?: string[]
  eventTypes?: string[]
  updatedAt?: DateLike
}

export type PublicSettings = {
  id?: string
  bandName: string
  instagram?: string
  city?: string
  state?: string
  shortDescription?: string
  aboutText?: string
  pixReceiverName: string
  pixKey: string
  pixKeyType: PixKeyType
  bankName?: string
  paymentInstructions?: string
  paymentWarningMessage?: string
  whatsapp?: string
  email?: string
  showEstimatedValueBeforeApproval?: boolean
  allowClientNotes?: boolean
  quoteSubmittedMessage?: string
  homeTitle?: string
  homeSubtitle?: string
  homePrimaryButtonText?: string
  homeSecondaryButtonText?: string
  useHeroImage?: boolean
  heroImagePath?: string
  logoPath?: string
  brandAccentColor?: string
  serviceTypes?: string[]
  eventTypes?: string[]
  updatedAt?: DateLike
}

export type AuditLog = FirestoreEntity & {
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  description: string
  metadata?: Record<string, unknown>
}
