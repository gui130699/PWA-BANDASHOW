import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { requireDb } from '../lib/firebase'
import type { PublicSettings, Settings } from '../types'
import { defaultSettings } from '../utils/constants'
import { createAuditLog } from './auditService'

export type SettingsActor = {
  userId: string
  userName: string
}

const auditGroups: Array<{
  action: string
  description: string
  keys: Array<keyof Settings>
}> = [
  {
    action: 'band_settings_updated',
    description: 'Dados da banda atualizados.',
    keys: ['bandName', 'whatsapp', 'email', 'instagram', 'city', 'state', 'shortDescription', 'aboutText'],
  },
  {
    action: 'pix_settings_updated',
    description: 'Pix atualizado.',
    keys: [
      'pixReceiverName',
      'pixKey',
      'pixKeyType',
      'bankName',
      'defaultDepositPercent',
      'paymentInstructions',
      'paymentWarningMessage',
    ],
  },
  {
    action: 'quote_rules_updated',
    description: 'Regras de orçamento atualizadas.',
    keys: [
      'quoteValidityDays',
      'allowManualDiscount',
      'allowTravelFee',
      'showEstimatedValueBeforeApproval',
      'allowClientNotes',
      'quoteSubmittedMessage',
      'quoteApprovedMessage',
      'quoteRejectedMessage',
      'quoteCanceledMessage',
    ],
  },
  {
    action: 'automatic_messages_updated',
    description: 'Mensagens automáticas atualizadas.',
    keys: ['messages'],
  },
  {
    action: 'appearance_settings_updated',
    description: 'Aparência atualizada.',
    keys: [
      'homeTitle',
      'homeSubtitle',
      'homePrimaryButtonText',
      'homeSecondaryButtonText',
      'useHeroImage',
      'heroImagePath',
      'logoPath',
      'brandAccentColor',
    ],
  },
]

function valuesDiffer(
  previous: Settings,
  next: Settings,
  keys: Array<keyof Settings>,
) {
  return keys.some((key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]))
}

export async function getSettings(): Promise<Settings> {
  const database = requireDb()
  const snapshot = await getDoc(doc(database, 'settings', 'main'))

  if (!snapshot.exists()) {
    return defaultSettings
  }

  return { ...defaultSettings, ...snapshot.data() } as Settings
}

export async function syncPublicSettings(settings: Settings) {
  const database = requireDb()
  await setDoc(
    doc(database, 'publicSettings', 'main'),
    {
      ...toPublicSettings(settings),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function updateSettings(
  data: Partial<Settings>,
  actor?: SettingsActor,
  previousSettings?: Settings,
) {
  const database = requireDb()
  const previous = previousSettings || (await getSettings())
  const next = { ...previous, ...data }

  await setDoc(
    doc(database, 'settings', 'main'),
    {
      ...next,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  await syncPublicSettings(next)

  if (actor) {
    const logs = [
      {
        action: 'settings_updated',
        description: 'Configurações atualizadas.',
      },
      ...auditGroups
        .filter((group) => valuesDiffer(previous, next, group.keys))
        .map(({ action, description }) => ({ action, description })),
    ]

    await Promise.all(
      logs.map((log) =>
        createAuditLog({
          userId: actor.userId,
          userName: actor.userName,
          action: log.action,
          entity: 'settings',
          entityId: 'main',
          description: log.description,
        }),
      ),
    )
  }

  return next
}

export async function saveSettings(settings: Settings) {
  return updateSettings(settings)
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const database = requireDb()
  const snapshot = await getDoc(doc(database, 'publicSettings', 'main'))

  if (!snapshot.exists()) {
    return toPublicSettings(defaultSettings)
  }

  return { ...toPublicSettings(defaultSettings), ...snapshot.data() } as PublicSettings
}

export function publicSettingsAreSynchronized(
  settings: Settings,
  publicSettings: PublicSettings,
) {
  const expected = toPublicSettings(settings)
  const comparableKeys = Object.keys(expected).filter((key) => key !== 'updatedAt') as Array<
    keyof PublicSettings
  >

  return comparableKeys.every(
    (key) => JSON.stringify(expected[key]) === JSON.stringify(publicSettings[key]),
  )
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
