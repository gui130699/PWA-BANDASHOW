import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type QueryConstraint,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

export function useCollection<T extends { id: string }>(
  collectionName: string,
  constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')],
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const stableConstraints = useMemo(() => constraints, [constraints])

  useEffect(() => {
    if (!db) {
      setLoading(false)
      setError('Firebase ainda nao esta configurado.')
      return undefined
    }

    setLoading(true)
    const reference = query(collection(db, collectionName), ...stableConstraints)
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
  }, [collectionName, stableConstraints])

  return { data, loading, error }
}
