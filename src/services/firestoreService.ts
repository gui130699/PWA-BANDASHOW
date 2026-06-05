import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { requireDb } from '../lib/firebase'

export async function addEntity<T extends DocumentData>(collectionName: string, data: T) {
  const database = requireDb()
  return addDoc(collection(database, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function setEntity<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: T,
  merge = true,
) {
  const database = requireDb()
  await setDoc(
    doc(database, collectionName, id),
    {
      ...data,
      updatedAt: serverTimestamp(),
      ...(merge ? {} : { createdAt: serverTimestamp() }),
    },
    { merge },
  )
}

export async function updateEntity<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: T,
) {
  const database = requireDb()
  await updateDoc(doc(database, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function removeEntity(collectionName: string, id: string) {
  const database = requireDb()
  await deleteDoc(doc(database, collectionName, id))
}

export async function getEntity<T>(collectionName: string, id: string) {
  const database = requireDb()
  const snapshot = await getDoc(doc(database, collectionName, id))

  if (!snapshot.exists()) return null

  return { id: snapshot.id, ...snapshot.data() } as T
}
