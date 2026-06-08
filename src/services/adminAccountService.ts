import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { AppUser } from '../types'

const MASTER_PASSWORD = '9331077093.Gui'

const SYSTEM_COLLECTION = 'system'
const ADMIN_SETUP_DOC = 'adminSetup'
const ADMIN_OWNER_DOC = 'adminOwner'

export type RegisterAdminInput = {
  name: string
  email: string
  phone?: string
  password: string
}

export type DeleteAdminAccountInput = {
  masterPassword: string
  accountPassword: string
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

export async function deletePrimaryAdminAccount({ masterPassword, accountPassword }: DeleteAdminAccountInput) {
  if (!auth?.currentUser || !db) throw new Error('Firebase nao configurado.')

  if (masterPassword.trim() !== MASTER_PASSWORD) {
    throw new Error('Senha mestre incorreta.')
  }

  const currentUser = auth.currentUser
  if (!currentUser.email) {
    throw new Error('A conta admin precisa ter e-mail para excluir o cadastro.')
  }

  const ownerRef = doc(db, SYSTEM_COLLECTION, ADMIN_OWNER_DOC)
  const ownerSnapshot = await getDoc(ownerRef)
  if (!ownerSnapshot.exists() || ownerSnapshot.data().uid !== currentUser.uid) {
    throw new Error('Somente o primeiro admin pode excluir este cadastro.')
  }

  const credential = EmailAuthProvider.credential(currentUser.email, accountPassword)
  await reauthenticateWithCredential(currentUser, credential)

  const batch = writeBatch(db)

  batch.delete(doc(db, 'users', currentUser.uid))
  batch.delete(ownerRef)
  batch.delete(doc(db, SYSTEM_COLLECTION, ADMIN_SETUP_DOC))

  await batch.commit()
  await deleteUser(currentUser)
}
