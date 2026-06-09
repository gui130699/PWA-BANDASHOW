import type { Settings } from '../types'

type MessageKey = keyof NonNullable<Settings['messages']>

export function getConfiguredMessage(
  settings: Pick<Settings, 'messages'> | null | undefined,
  key: MessageKey,
  fallback: string,
) {
  const configured = settings?.messages?.[key]?.trim()
  return configured || fallback
}
