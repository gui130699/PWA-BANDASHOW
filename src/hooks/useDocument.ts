import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

export function useDocument<T extends { id?: string }>(collectionName: string, id?: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(Boolean(id && isFirebaseConfigured))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return undefined
    }

    if (!db) {
      setError('Firebase ainda nao esta configurado.')
      setLoading(false)
      return undefined
    }

    setLoading(true)
    const unsubscribe = onSnapshot(
      doc(db, collectionName, id),
      (snapshot) => {
        setData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null)
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        setError(snapshotError.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [collectionName, id])

  return { data, loading, error }
}
