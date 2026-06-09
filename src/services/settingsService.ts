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
        ...toPublicSettings(settings),
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
    instagram: settings.instagram,
    city: settings.city,
    state: settings.state,
    shortDescription: settings.shortDescription,
    aboutText: settings.aboutText,
    pixReceiverName: settings.pixReceiverName,
    pixKey: settings.pixKey,
    pixKeyType: settings.pixKeyType,
    bankName: settings.bankName,
    paymentInstructions: settings.paymentInstructions,
    paymentWarningMessage: settings.paymentWarningMessage,
    whatsapp: settings.whatsapp,
    email: settings.email,
    showEstimatedValueBeforeApproval: settings.showEstimatedValueBeforeApproval,
    allowClientNotes: settings.allowClientNotes,
    quoteSubmittedMessage: settings.quoteSubmittedMessage,
    homeTitle: settings.homeTitle,
    homeSubtitle: settings.homeSubtitle,
    homePrimaryButtonText: settings.homePrimaryButtonText,
    homeSecondaryButtonText: settings.homeSecondaryButtonText,
    useHeroImage: settings.useHeroImage,
    heroImagePath: settings.heroImagePath,
    logoPath: settings.logoPath,
    brandAccentColor: settings.brandAccentColor,
    updatedAt: settings.updatedAt,
  }
}
