import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type QueryConstraint,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

const defaultConstraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

export function useCollection<T extends { id: string }>(
  collectionName: string,
  constraints: QueryConstraint[] = defaultConstraints,
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!db) {
      setLoading(false)
      setError('Firebase ainda não está configurado.')
      return undefined
    }

    setLoading(true)
    const reference = query(collection(db, collectionName), ...constraints)
    const unsubscribe = onSnapshot(
      reference,
      (snapshot) => {
        setData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T))
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [collectionName, constraints])

  return { data, loading, error }
}
