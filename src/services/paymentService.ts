import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { requireDb } from '../lib/firebase'
import type { Payment, Quote } from '../types'
import { createAuditLog } from './auditService'
import { syncClientQuoteView } from './quoteService'

type PaymentActor = {
  userId?: string
  userName?: string
}

function isDeposit(payment: Payment) {
  return payment.type === 'entrada' || payment.type === 'entrada_50'
}

export async function clientMarkPaymentAsPaid(payment: Payment, message = '') {
  const database = requireDb()
  const batch = writeBatch(database)
  const paymentRef = doc(database, 'payments', payment.id)
  const quoteRef = doc(database, 'quotes', payment.quoteId)
  const viewRef = doc(database, 'clientQuoteViews', payment.quoteId)

  batch.update(paymentRef, {
    status: 'informado_pelo_cliente',
    clientMessage: message,
    updatedAt: serverTimestamp(),
  })

  if (isDeposit(payment)) {
    batch.update(quoteRef, {
      status: 'entrada_informada_pelo_cliente',
      updatedAt: serverTimestamp(),
    })
    batch.update(viewRef, {
      status: 'entrada_informada_pelo_cliente',
      paymentSummary: {
        depositStatus: 'informado_pelo_cliente',
      },
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()
}

export async function confirmPayment(paymentId: string, actor: PaymentActor = {}) {
  const database = requireDb()
  const paymentSnapshot = await getDoc(doc(database, 'payments', paymentId))

  if (!paymentSnapshot.exists()) {
    throw new Error('Pagamento não encontrado.')
  }

  const payment = { id: paymentSnapshot.id, ...paymentSnapshot.data() } as Payment
  const quoteSnapshot = await getDoc(doc(database, 'quotes', payment.quoteId))
  const quote = quoteSnapshot.exists() ? ({ id: quoteSnapshot.id, ...quoteSnapshot.data() } as Quote) : null
  const batch = writeBatch(database)

  batch.update(doc(database, 'payments', paymentId), {
    status: 'confirmado',
    confirmedBy: actor.userId || 'admin',
    confirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  if (quote && isDeposit(payment)) {
    batch.update(doc(database, 'quotes', quote.id), {
      status: 'agendado',
      depositConfirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()

  if (quote) {
    await syncClientQuoteView(quote.id)
  }

  if (actor.userId) {
    await createAuditLog({
      userId: actor.userId,
      userName: actor.userName || 'Admin',
      action: 'payment_confirmed',
      entity: 'payments',
      entityId: paymentId,
      description: `Pagamento ${payment.type.replace('_', ' ')} confirmado.`,
      metadata: {
        quoteId: payment.quoteId,
        amount: payment.amount,
      },
    }).catch(() => undefined)
  }
}

export async function markInternalPaymentAsPaid(
  collectionName: 'memberPayments' | 'supplierPayments',
  paymentId: string,
) {
  const database = requireDb()
  await updateDoc(doc(database, collectionName, paymentId), {
    status: 'pago',
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
