import {
  createUserWithEmailAndPassword,
  deleteUser,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { AppUser } from '../types'

const SYSTEM_COLLECTION = 'system'
const ADMIN_SETUP_DOC = 'adminSetup'
const ADMIN_OWNER_DOC = 'adminOwner'

export type RegisterAdminInput = {
  name: string
  email: string
  phone?: string
  password: string
}

export async function getAdminSetupStatus() {
  if (!db) return { configured: false }

  const snapshot = await getDoc(doc(db, SYSTEM_COLLECTION, ADMIN_SETUP_DOC))

  return {
    configured: snapshot.exists() && snapshot.data().configured === true,
  }
}

export async function createPrimaryAdminAccount(data: RegisterAdminInput): Promise<AppUser> {
  if (!auth || !db) throw new Error('Firebase nao configurado.')

  const currentStatus = await getAdminSetupStatus()
  if (currentStatus.configured) {
    throw new Error('O cadastro admin ja foi criado.')
  }

  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password)
  const profile: AppUser = {
    uid: credential.user.uid,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    role: 'admin',
  }

  const batch = writeBatch(db)
  const now = serverTimestamp()

  batch.set(doc(db, 'users', credential.user.uid), {
    ...profile,
    createdAt: now,
    updatedAt: now,
  })
  batch.set(doc(db, SYSTEM_COLLECTION, ADMIN_SETUP_DOC), {
    configured: true,
    createdAt: now,
    updatedAt: now,
  })
  batch.set(doc(db, SYSTEM_COLLECTION, ADMIN_OWNER_DOC), {
    uid: credential.user.uid,
    createdAt: now,
    updatedAt: now,
  })

  try {
    await batch.commit()
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined)
    throw error
  }

  return profile
}
