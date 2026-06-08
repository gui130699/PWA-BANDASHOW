import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { requireDb } from '../lib/firebase'
import type { Service } from '../types'
import { addEntity } from './firestoreService'

function publicServicePayload(serviceId: string, service: Omit<Service, 'id'> | Service) {
  return {
    serviceId,
    name: service.name,
    description: service.description,
    category: service.category,
    basePrice: service.basePrice,
    active: service.active,
    allowPriceEdit: service.allowPriceEdit,
    updatedAt: serverTimestamp(),
  }
}

export async function syncPublicService(serviceId: string) {
  const database = requireDb()
  const serviceSnapshot = await getDoc(doc(database, 'services', serviceId))

  if (!serviceSnapshot.exists()) {
    await deleteDoc(doc(database, 'publicServices', serviceId))
    return
  }

  const service = serviceSnapshot.data() as Service
  await setDoc(
    doc(database, 'publicServices', serviceId),
    {
      ...publicServicePayload(serviceId, service),
      createdAt: service.createdAt || serverTimestamp(),
    },
    { merge: true },
  )
}

export async function createService(service: Omit<Service, 'id'>) {
  const reference = await addEntity('services', service)
  await syncPublicService(reference.id)
  return reference
}

export async function updateService(serviceId: string, patch: Partial<Omit<Service, 'id'>>) {
  const database = requireDb()
  await updateDoc(doc(database, 'services', serviceId), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
  await syncPublicService(serviceId)
}

export async function removeService(serviceId: string) {
  const database = requireDb()
  await deleteDoc(doc(database, 'services', serviceId))
  await deleteDoc(doc(database, 'publicServices', serviceId))
}
