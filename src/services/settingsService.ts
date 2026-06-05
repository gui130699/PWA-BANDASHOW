import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { requireDb } from '../lib/firebase'
import type { Settings } from '../types'
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
  await setDoc(
    doc(database, 'settings', 'main'),
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
