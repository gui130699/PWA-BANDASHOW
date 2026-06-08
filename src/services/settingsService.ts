import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { requireDb } from '../lib/firebase'
import type { PublicSettings, Settings } from '../types'
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
    updatedAt: settings.updatedAt,
  }
}
