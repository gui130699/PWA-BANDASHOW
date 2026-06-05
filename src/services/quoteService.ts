import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { requireDb } from '../lib/firebase'
import type { Client, CostSnapshot, Quote, QuoteEvent, QuoteItem, Settings } from '../types'
import { calculateQuoteTotals } from '../utils/calculations'
import { getSettings } from './settingsService'

type CreateQuoteInput = {
  client: Client
  event: QuoteEvent
  items: QuoteItem[]
  clientNotes?: string
}

export async function createClientQuote({ client, event, items, clientNotes }: CreateQuoteInput) {
  const database = requireDb()
  const totals = calculateQuoteTotals(items)

  return addDoc(collection(database, 'quotes'), {
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
    manualCosts: [],
    discount: 0,
    travelFee: 0,
    status: 'em_analise',
    clientNotes: clientNotes || '',
    adminNotes: '',
    ...totals,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
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
) {
  const database = requireDb()
  const items = patch.items || quote.items
  const manualCosts = patch.manualCosts || quote.manualCosts || []
  const discount = patch.discount ?? quote.discount ?? 0
  const travelFee = patch.travelFee ?? quote.travelFee ?? 0
  const totals = calculateQuoteTotals(items, discount, travelFee, manualCosts)

  await updateDoc(doc(database, 'quotes', quote.id), {
    items,
    manualCosts,
    discount,
    travelFee,
    adminNotes: patch.adminNotes ?? quote.adminNotes ?? '',
    ...totals,
    updatedAt: serverTimestamp(),
  })
}

export async function approveQuote(quote: Quote, settings?: Settings) {
  const database = requireDb()
  const paymentSettings = settings || (await getSettings())
  const totals = calculateQuoteTotals(quote.items, quote.discount, quote.travelFee, quote.manualCosts)

  await updateDoc(doc(database, 'quotes', quote.id), {
    ...totals,
    status: 'aprovado_aguardando_entrada',
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await addDoc(collection(database, 'payments'), {
    quoteId: quote.id,
    clientId: quote.clientId,
    type: 'entrada_50',
    amount: totals.depositAmount,
    status: 'pendente',
    pixKeyUsed: paymentSettings.pixKey || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function rejectQuote(quoteId: string, rejectionReason: string) {
  const database = requireDb()

  await updateDoc(doc(database, 'quotes', quoteId), {
    status: 'recusado',
    rejectionReason,
    updatedAt: serverTimestamp(),
  })
}

export async function cancelQuote(quoteId: string) {
  const database = requireDb()

  await updateDoc(doc(database, 'quotes', quoteId), {
    status: 'cancelado',
    updatedAt: serverTimestamp(),
  })
}

export async function markQuoteAsDone(quoteId: string) {
  const database = requireDb()

  await updateDoc(doc(database, 'quotes', quoteId), {
    status: 'realizado',
    updatedAt: serverTimestamp(),
  })
}

export async function informDepositPayment(quote: Quote, clientMessage?: string) {
  const database = requireDb()
  const paymentsSnapshot = await getDocs(
    query(
      collection(database, 'payments'),
      where('quoteId', '==', quote.id),
      where('type', '==', 'entrada_50'),
    ),
  )

  await updateDoc(doc(database, 'quotes', quote.id), {
    status: 'entrada_informada_pelo_cliente',
    updatedAt: serverTimestamp(),
  })

  await Promise.all(
    paymentsSnapshot.docs.map((paymentDoc) =>
      updateDoc(paymentDoc.ref, {
        status: 'informado_pelo_cliente',
        clientMessage: clientMessage || '',
        updatedAt: serverTimestamp(),
      }),
    ),
  )
}

export async function confirmDepositPayment(quote: Quote, adminUserId: string) {
  const database = requireDb()
  const paymentsSnapshot = await getDocs(
    query(
      collection(database, 'payments'),
      where('quoteId', '==', quote.id),
      where('type', '==', 'entrada_50'),
    ),
  )

  await updateDoc(doc(database, 'quotes', quote.id), {
    status: 'agendado',
    depositConfirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await Promise.all(
    paymentsSnapshot.docs.map((paymentDoc) =>
      updateDoc(paymentDoc.ref, {
        status: 'confirmado',
        confirmedBy: adminUserId,
        confirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    ),
  )
}

export async function confirmFinalPayment(paymentId: string, adminUserId: string) {
  const database = requireDb()

  await updateDoc(doc(database, 'payments', paymentId), {
    status: 'confirmado',
    confirmedBy: adminUserId,
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function createFinalPayment(quote: Quote, settings?: Settings) {
  const database = requireDb()
  const paymentSettings = settings || (await getSettings())

  return addDoc(collection(database, 'payments'), {
    quoteId: quote.id,
    clientId: quote.clientId,
    type: 'restante_50',
    amount: quote.remainingAmount,
    status: 'pendente',
    pixKeyUsed: paymentSettings.pixKey || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
