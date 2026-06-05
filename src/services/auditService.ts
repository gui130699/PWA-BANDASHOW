import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { requireDb } from '../lib/firebase'

export async function createAuditLog(input: {
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  description: string
}) {
  const database = requireDb()
  await addDoc(collection(database, 'auditLogs'), {
    ...input,
    createdAt: serverTimestamp(),
  })
}
