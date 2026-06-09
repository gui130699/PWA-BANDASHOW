import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from './firebaseAdmin.js'

const now = () => FieldValue.serverTimestamp()

const services = [
  { name: 'Show completo', description: 'Apresentação principal do Grupo Dvanera.', category: 'Show', basePrice: 5000 },
  { name: 'Som', description: 'Sistema de som para evento.', category: 'Som', basePrice: 1200 },
  { name: 'Iluminação', description: 'Iluminação cênica para palco.', category: 'Iluminação', basePrice: 900 },
  { name: 'Transporte', description: 'Deslocamento da equipe e equipamentos.', category: 'Transporte', basePrice: 700 },
  { name: 'Hora extra', description: 'Período adicional de apresentação.', category: 'Hora extra', basePrice: 600 },
]

const serviceCategories = [
  'Show',
  'Som',
  'Iluminação',
  'Transporte',
  'Cerimonial',
  'Hora extra',
  'Estrutura adicional',
  'Outro',
]

const eventTypes = [
  'Casamento',
  'Aniversário',
  'Formatura',
  'Evento empresarial',
  'Festa particular',
  'Baile',
  'Festival',
  'Outro',
]

const suppliers = [
  { name: 'Fornecedor de Som', type: 'Som', defaultCost: 800 },
  { name: 'Fornecedor de Iluminação', type: 'Iluminação', defaultCost: 600 },
  { name: 'Transporte Parceiro', type: 'Transporte', defaultCost: 400 },
]

const supplierTypes = [
  'Som',
  'Iluminação',
  'Transporte',
  'Estrutura',
  'Alimentação',
  'Hospedagem',
  'Freelancer',
  'Técnico',
  'Outro',
]

const members = [
  { name: 'Vocal', role: 'Vocal', defaultPayment: 500 },
  { name: 'Sanfona', role: 'Sanfona', defaultPayment: 500 },
  { name: 'Guitarra', role: 'Guitarra', defaultPayment: 450 },
  { name: 'Baixo', role: 'Baixo', defaultPayment: 450 },
  { name: 'Bateria', role: 'Bateria', defaultPayment: 450 },
]

const memberRoles = ['Vocal', 'Sanfona', 'Guitarra', 'Baixo', 'Bateria', 'Percussão', 'Técnico']

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
    const reference = await adminDb.collection(collectionName).add({ ...payload, createdAt: now() })
    return reference.id
  }

  await existing.docs[0].ref.set(payload, { merge: true })
  return existing.docs[0].id
}

async function upsertAdminOptions(collectionName: string, names: string[]) {
  await Promise.all(
    names.map(async (name, index) => {
      const existing = await adminDb.collection(collectionName).where('name', '==', name).limit(1).get()
      const payload = {
        name,
        description: '',
        active: true,
        order: index + 1,
        updatedAt: now(),
      }

      if (existing.empty) {
        await adminDb.collection(collectionName).add({ ...payload, createdAt: now() })
        return
      }

      await existing.docs[0].ref.set(payload, { merge: true })
    }),
  )
}

async function syncSeedPublicService(serviceId: string) {
  const serviceSnapshot = await adminDb.collection('services').doc(serviceId).get()
  if (!serviceSnapshot.exists) return

  const service = serviceSnapshot.data() || {}
  await adminDb.collection('publicServices').doc(serviceId).set(
    {
      serviceId,
      name: service.name,
      description: service.description,
      category: service.category,
      basePrice: service.basePrice,
      active: service.active,
      allowPriceEdit: service.allowPriceEdit,
      createdAt: service.createdAt || now(),
      updatedAt: now(),
    },
    { merge: true },
  )
}

async function main() {
  const serviceIds = await Promise.all(services.map((item) => upsertByName('services', item)))
  await Promise.all(serviceIds.filter(Boolean).map((serviceId) => syncSeedPublicService(serviceId as string)))
  await Promise.all(suppliers.map((item) => upsertByName('suppliers', item)))
  await Promise.all(members.map((item) => upsertByName('bandMembers', item)))
  await Promise.all([
    upsertAdminOptions('serviceCategories', serviceCategories),
    upsertAdminOptions('supplierTypes', supplierTypes),
    upsertAdminOptions('memberRoles', memberRoles),
    upsertAdminOptions('eventTypes', eventTypes),
  ])

  const publicSettings = {
    bandName: 'Grupo Dvanera',
    pixReceiverName: '',
    pixKey: '',
    pixKeyType: 'cpf',
    bankName: '',
    paymentInstructions:
      'Após realizar o Pix, clique em "Já realizei o pagamento" para que nossa equipe confirme manualmente.',
    updatedAt: now(),
  }

  await adminDb.collection('settings').doc('main').set(
    {
      ...publicSettings,
      defaultDepositPercent: 50,
      updatedAt: now(),
    },
    { merge: true },
  )
  await adminDb.collection('publicSettings').doc('main').set(publicSettings, { merge: true })

  console.log('Seed concluído.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
