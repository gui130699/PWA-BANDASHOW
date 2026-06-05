import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from './firebaseAdmin.js'

const now = () => FieldValue.serverTimestamp()

const services = [
  { name: 'Show completo', description: 'Apresentacao principal do Grupo Dvanera.', category: 'Show', basePrice: 5000 },
  { name: 'Som', description: 'Sistema de som para evento.', category: 'Som', basePrice: 1200 },
  { name: 'Iluminacao', description: 'Iluminacao cenica para palco.', category: 'Iluminacao', basePrice: 900 },
  { name: 'Transporte', description: 'Deslocamento da equipe e equipamentos.', category: 'Transporte', basePrice: 700 },
  { name: 'Hora extra', description: 'Periodo adicional de apresentacao.', category: 'Hora extra', basePrice: 600 },
]

const suppliers = [
  { name: 'Fornecedor de Som', type: 'Som', defaultCost: 800 },
  { name: 'Fornecedor de Iluminacao', type: 'Iluminacao', defaultCost: 600 },
  { name: 'Transporte Parceiro', type: 'Transporte', defaultCost: 400 },
]

const members = [
  { name: 'Vocal', role: 'Vocal', defaultPayment: 500 },
  { name: 'Sanfona', role: 'Sanfona', defaultPayment: 500 },
  { name: 'Guitarra', role: 'Guitarra', defaultPayment: 450 },
  { name: 'Baixo', role: 'Baixo', defaultPayment: 450 },
  { name: 'Bateria', role: 'Bateria', defaultPayment: 450 },
]

async function upsertByName(collectionName: string, item: Record<string, unknown>) {
  const existing = await adminDb.collection(collectionName).where('name', '==', item.name).limit(1).get()
  const payload = {
    ...item,
    active: true,
    allowPriceEdit: item.allowPriceEdit ?? true,
    supplierLinks: item.supplierLinks ?? [],
    memberCostLinks: item.memberCostLinks ?? [],
    notes: item.notes ?? '',
    internalNotes: item.internalNotes ?? '',
    updatedAt: now(),
  }

  if (existing.empty) {
    await adminDb.collection(collectionName).add({ ...payload, createdAt: now() })
    return
  }

  await existing.docs[0].ref.set(payload, { merge: true })
}

async function main() {
  await Promise.all(services.map((item) => upsertByName('services', item)))
  await Promise.all(suppliers.map((item) => upsertByName('suppliers', item)))
  await Promise.all(members.map((item) => upsertByName('bandMembers', item)))

  await adminDb.collection('settings').doc('main').set(
    {
      bandName: 'Grupo Dvanera',
      pixReceiverName: '',
      pixKey: '',
      pixKeyType: 'cpf',
      bankName: '',
      defaultDepositPercent: 50,
      paymentInstructions:
        'Apos realizar o Pix, clique em "Ja realizei o pagamento" para que nossa equipe confirme manualmente.',
      updatedAt: now(),
    },
    { merge: true },
  )

  console.log('Seed concluido.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
