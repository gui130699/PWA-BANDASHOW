import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { requireDb } from '../lib/firebase'
import type {
  Client,
  CostSnapshot,
  Payment,
  Quote,
  QuoteEvent,
  QuoteItem,
  Settings,
} from '../types'
import { calculateQuoteTotals } from '../utils/calculations'
import { defaultSettings } from '../utils/constants'
import { createAuditLog } from './auditService'
import { getSettings } from './settingsService'

type CreateQuoteInput = {
  client: Client
  event: QuoteEvent
  items: QuoteItem[]
  clientNotes?: string
}

type AuditActor = {
  userId?: string
  userName?: string
}

function normalizeManualCosts(costs: CostSnapshot[] = []) {
  return costs.map((cost) => ({
    ...cost,
    quantity: cost.quantity ?? 1,
    totalCost: cost.totalCost ?? cost.cost * (cost.quantity ?? 1),
  }))
}

function getDepositPercent(settings?: Settings, fallback: number = defaultSettings.defaultDepositPercent) {
  return settings?.defaultDepositPercent || fallback
}

function publicItems(items: QuoteItem[]) {
  return items.map((item) => ({
    serviceId: item.serviceId,
    serviceName: item.serviceName,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  }))
}

function paymentIsDeposit(payment: Payment) {
  return payment.type === 'entrada' || payment.type === 'entrada_50'
}

function paymentIsRemaining(payment: Payment) {
  return payment.type === 'restante' || payment.type === 'restante_50'
}

async function audit(actor: AuditActor | undefined, action: string, entity: string, entityId: string, description: string) {
  if (!actor?.userId) return

  await createAuditLog({
    userId: actor.userId,
    userName: actor.userName || 'Admin',
    action,
    entity,
    entityId,
    description,
  }).catch(() => undefined)
}

export async function buildQuoteCostSnapshot(items: QuoteItem[]) {
  const database = requireDb()

  return Promise.all(
    items.map(async (item) => {
      const serviceSnapshot = await getDoc(doc(database, 'services', item.serviceId))
      if (!serviceSnapshot.exists()) return item

      const service = serviceSnapshot.data()
      const supplierCosts: CostSnapshot[] = (service.supplierLinks || []).map(
        (link: { supplierId: string; supplierName: string; cost: number; description?: string }) => ({
          type: 'supplier',
          refId: link.supplierId,
          name: link.supplierName,
          cost: link.cost,
          quantity: item.quantity,
          totalCost: link.cost * item.quantity,
          notes: link.description || `Fornecedor vinculado ao serviço ${item.serviceName}`,
        }),
      )
      const memberCosts: CostSnapshot[] = (service.memberCostLinks || []).map(
        (link: { memberId: string; memberName: string; cost: number; description?: string }) => ({
          type: 'member',
          refId: link.memberId,
          name: link.memberName,
          cost: link.cost,
          quantity: item.quantity,
          totalCost: link.cost * item.quantity,
          notes: link.description || `Integrante vinculado ao serviço ${item.serviceName}`,
        }),
      )

      return {
        ...item,
        costSnapshot: [...supplierCosts, ...memberCosts],
      }
    }),
  )
}

export async function syncClientQuoteView(quoteId: string) {
  const database = requireDb()
  const quoteSnapshot = await getDoc(doc(database, 'quotes', quoteId))

  if (!quoteSnapshot.exists()) {
    await deleteDoc(doc(database, 'clientQuoteViews', quoteId))
    return
  }

  const quote = { id: quoteSnapshot.id, ...quoteSnapshot.data() } as Quote
  const paymentsSnapshot = await getDocs(
    query(collection(database, 'payments'), where('quoteId', '==', quoteId)),
  )
  const payments = paymentsSnapshot.docs.map((paymentDoc) => ({
    id: paymentDoc.id,
    ...paymentDoc.data(),
  }) as Payment)
  const depositPayment = payments.find(paymentIsDeposit)
  const remainingPayment = payments.find(paymentIsRemaining)
  const paymentSummary = {
    ...(depositPayment ? { depositStatus: depositPayment.status } : {}),
    ...(remainingPayment ? { remainingStatus: remainingPayment.status } : {}),
  }

  await setDoc(
    doc(database, 'clientQuoteViews', quoteId),
    {
      quoteId,
      clientId: quote.clientId,
      clientUserId: quote.clientUserId,
      clientSnapshot: quote.clientSnapshot,
      event: quote.event,
      items: publicItems(quote.items),
      subtotal: quote.subtotal,
      discount: quote.discount,
      travelFee: quote.travelFee,
      total: quote.total,
      depositPercent: quote.depositPercent || defaultSettings.defaultDepositPercent,
      depositAmount: quote.depositAmount,
      remainingAmount: quote.remainingAmount,
      status: quote.status,
      clientNotes: quote.clientNotes || '',
      rejectionReason: quote.rejectionReason || '',
      paymentSummary,
      approvedAt: quote.approvedAt || null,
      depositConfirmedAt: quote.depositConfirmedAt || null,
      createdAt: quote.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function createClientQuote({ client, event, items, clientNotes }: CreateQuoteInput) {
  const database = requireDb()
  const quoteRef = doc(collection(database, 'quotes'))
  const depositPercent = defaultSettings.defaultDepositPercent
  const manualCosts: CostSnapshot[] = []
  const totals = calculateQuoteTotals(items, 0, 0, manualCosts, depositPercent)
  const now = serverTimestamp()
  const quotePayload = {
    clientId: client.id,
    clientUserId: client.userId,
    clientSnapshot: {
      name: client.name,
      document: client.document,
      phone: client.phone,
      email: client.email,
      city: client.city,
      state: client.state,
    },
    event,
    items,
    manualCosts,
    discount: 0,
    travelFee: 0,
    status: 'em_analise',
    clientNotes: clientNotes || '',
    adminNotes: '',
    ...totals,
    createdAt: now,
    updatedAt: now,
  }

  const batch = writeBatch(database)
  batch.set(quoteRef, quotePayload)
  batch.set(doc(database, 'clientQuoteViews', quoteRef.id), {
    quoteId: quoteRef.id,
    clientId: client.id,
    clientUserId: client.userId,
    clientSnapshot: quotePayload.clientSnapshot,
    event,
    items: publicItems(items),
    subtotal: totals.subtotal,
    discount: 0,
    travelFee: 0,
    total: totals.total,
    depositPercent: totals.depositPercent,
    depositAmount: totals.depositAmount,
    remainingAmount: totals.remainingAmount,
    status: 'em_analise',
    clientNotes: clientNotes || '',
    createdAt: now,
    updatedAt: now,
  })
  await batch.commit()

  return quoteRef
}

export async function updateQuoteFinancials(
  quote: Quote,
  patch: {
    items?: QuoteItem[]
    manualCosts?: CostSnapshot[]
    discount?: number
    travelFee?: number
    adminNotes?: string
  },
  settings?: Settings,
  actor?: AuditActor,
) {
  const database = requireDb()
  const items = await buildQuoteCostSnapshot(patch.items || quote.items)
  const manualCosts = normalizeManualCosts(patch.manualCosts || quote.manualCosts || [])
  const discount = patch.discount ?? quote.discount ?? 0
  const travelFee = patch.travelFee ?? quote.travelFee ?? 0
  const depositPercent = getDepositPercent(settings, quote.depositPercent)
  const totals = calculateQuoteTotals(items, discount, travelFee, manualCosts, depositPercent)

  await updateDoc(doc(database, 'quotes', quote.id), {
    items,
    manualCosts,
    discount,
    travelFee,
    adminNotes: patch.adminNotes ?? quote.adminNotes ?? '',
    ...totals,
    updatedAt: serverTimestamp(),
  })
  await syncClientQuoteView(quote.id)
  await audit(actor, 'quote_financials_updated', 'quotes', quote.id, 'Orçamento recalculado.')
}

export async function recalculateQuote(quoteId: string, settings?: Settings, actor?: AuditActor) {
  const database = requireDb()
  const snapshot = await getDoc(doc(database, 'quotes', quoteId))
  if (!snapshot.exists()) throw new Error('Orçamento não encontrado.')

  const quote = { id: snapshot.id, ...snapshot.data() } as Quote
  await updateQuoteFinancials(quote, {}, settings, actor)
}

export async function approveQuote(quote: Quote, settings?: Settings, actor?: AuditActor) {
  const database = requireDb()
  const paymentSettings = settings || (await getSettings())
  const items = await buildQuoteCostSnapshot(quote.items)
  const manualCosts = normalizeManualCosts(quote.manualCosts || [])
  const totals = calculateQuoteTotals(
    items,
    quote.discount,
    quote.travelFee,
    manualCosts,
    getDepositPercent(paymentSettings, quote.depositPercent),
  )
  const existingPayments = await getDocs(
    query(collection(database, 'payments'), where('quoteId', '==', quote.id), where('type', 'in', ['entrada', 'entrada_50'])),
  )

  await updateDoc(doc(database, 'quotes', quote.id), {
    items,
    manualCosts,
    ...totals,
    status: 'aprovado_aguardando_entrada',
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  if (existingPayments.empty) {
    await addDoc(collection(database, 'payments'), {
      quoteId: quote.id,
      clientId: quote.clientId,
      clientUserId: quote.clientUserId,
      type: 'entrada',
      amount: totals.depositAmount,
      status: 'pendente',
      pixKeyUsed: paymentSettings.pixKey || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  await syncClientQuoteView(quote.id)
  await audit(actor, 'quote_approved', 'quotes', quote.id, 'Orçamento aprovado e entrada gerada.')
}

export async function rejectQuote(quoteId: string, rejectionReason: string, actor?: AuditActor) {
  const database = requireDb()

  await updateDoc(doc(database, 'quotes', quoteId), {
    status: 'recusado',
    rejectionReason,
    updatedAt: serverTimestamp(),
  })
  await syncClientQuoteView(quoteId)
  await audit(actor, 'quote_rejected', 'quotes', quoteId, 'Orçamento recusado.')
}

export async function cancelQuote(quoteId: string, actor?: AuditActor) {
  const database = requireDb()

  await updateDoc(doc(database, 'quotes', quoteId), {
    status: 'cancelado',
    updatedAt: serverTimestamp(),
  })
  await syncClientQuoteView(quoteId)
  await audit(actor, 'quote_cancelled', 'quotes', quoteId, 'Orçamento cancelado.')
}

export async function markQuoteAsDone(quoteId: string, actor?: AuditActor) {
  const database = requireDb()

  await updateDoc(doc(database, 'quotes', quoteId), {
    status: 'realizado',
    updatedAt: serverTimestamp(),
  })
  await syncClientQuoteView(quoteId)
  await audit(actor, 'quote_done', 'quotes', quoteId, 'Evento marcado como realizado.')
}

export async function createFinalPayment(quote: Quote, settings?: Settings) {
  const database = requireDb()
  const paymentSettings = settings || (await getSettings())
  const existingPayments = await getDocs(
    query(collection(database, 'payments'), where('quoteId', '==', quote.id), where('type', 'in', ['restante', 'restante_50'])),
  )

  if (!existingPayments.empty) return existingPayments.docs[0].ref

  const reference = await addDoc(collection(database, 'payments'), {
    quoteId: quote.id,
    clientId: quote.clientId,
    clientUserId: quote.clientUserId,
    type: 'restante',
    amount: quote.remainingAmount,
    status: 'pendente',
    pixKeyUsed: paymentSettings.pixKey || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await syncClientQuoteView(quote.id)

  return reference
}
