import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { requireDb } from '../lib/firebase'
import type { PublicSettings, Service, Settings } from '../types'
import { defaultSettings } from '../utils/constants'

export async function getSettings(): Promise<Settings> {
  const database = requireDb()
  const snapshot = await getDoc(doc(database, 'settings', 'main'))

  if (!snapshot.exists()) {
    return defaultSettings
  }

  return { ...defaultSettings, ...snapshot.data() } as Settings
}

export async function saveSettings(settings: Settings) {
  const database = requireDb()
  const updatedAt = serverTimestamp()
  const publicSettings = toPublicSettings(settings)

  await Promise.all([
    setDoc(
      doc(database, 'settings', 'main'),
      {
        ...settings,
        updatedAt,
      },
      { merge: true },
    ),
    setDoc(
      doc(database, 'publicSettings', 'main'),
      {
        ...publicSettings,
        updatedAt,
      },
      { merge: true },
    ),
  ])
}

export async function saveCatalogTypes(serviceTypes: string[], eventTypes: string[]) {
  const database = requireDb()
  const updatedAt = serverTimestamp()
  const catalog = { serviceTypes, eventTypes, updatedAt }

  await Promise.all([
    setDoc(doc(database, 'settings', 'main'), catalog, { merge: true }),
    setDoc(doc(database, 'publicSettings', 'main'), catalog, { merge: true }),
  ])
}

export async function renameServiceType(
  serviceTypes: string[],
  eventTypes: string[],
  previousName: string,
  nextName: string,
) {
  const database = requireDb()
  const snapshot = await getDocs(
    query(collection(database, 'services'), where('category', '==', previousName)),
  )
  const serviceDocuments = snapshot.docs
  const chunkSize = 200
  const chunks = serviceDocuments.length
    ? Array.from(
        { length: Math.ceil(serviceDocuments.length / chunkSize) },
        (_, index) => serviceDocuments.slice(index * chunkSize, (index + 1) * chunkSize),
      )
    : [[]]

  for (const [index, chunk] of chunks.entries()) {
    const batch = writeBatch(database)
    const updatedAt = serverTimestamp()

    if (index === 0) {
      const catalog = { serviceTypes, eventTypes, updatedAt }
      batch.set(doc(database, 'settings', 'main'), catalog, { merge: true })
      batch.set(doc(database, 'publicSettings', 'main'), catalog, { merge: true })
    }

    chunk.forEach((serviceDocument) => {
      const service = serviceDocument.data() as Service
      batch.update(serviceDocument.ref, { category: nextName, updatedAt })
      batch.set(
        doc(database, 'publicServices', serviceDocument.id),
        {
          serviceId: serviceDocument.id,
          name: service.name,
          description: service.description,
          category: nextName,
          basePrice: service.basePrice,
          active: service.active,
          allowPriceEdit: service.allowPriceEdit,
          createdAt: service.createdAt || updatedAt,
          updatedAt,
        },
        { merge: true },
      )
    })

    await batch.commit()
  }
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const database = requireDb()
  const snapshot = await getDoc(doc(database, 'publicSettings', 'main'))

  if (!snapshot.exists()) {
    return toPublicSettings(defaultSettings)
  }

  return { ...toPublicSettings(defaultSettings), ...snapshot.data() } as PublicSettings
}

export function toPublicSettings(settings: Settings): PublicSettings {
  return {
    bandName: settings.bandName,
    pixReceiverName: settings.pixReceiverName,
    pixKey: settings.pixKey,
    pixKeyType: settings.pixKeyType,
    bankName: settings.bankName,
    paymentInstructions: settings.paymentInstructions,
    whatsapp: settings.whatsapp,
    email: settings.email,
    serviceTypes: settings.serviceTypes,
    eventTypes: settings.eventTypes,
    updatedAt: settings.updatedAt,
  }
}
