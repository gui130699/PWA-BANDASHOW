import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DateLike } from '../types'

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value = 0) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

export function parseCurrency(value: string) {
  const numeric = value.replace(/\D/g, '')
  return Number(numeric || 0) / 100
}

export function formatDate(date?: DateLike) {
  if (!date) return '-'

  if (typeof date === 'string') {
    const parsed = new Date(`${date}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? date : format(parsed, 'dd/MM/yyyy', { locale: ptBR })
  }

  if (date instanceof Date) {
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  }

  if ('toDate' in date) {
    return format(date.toDate(), 'dd/MM/yyyy', { locale: ptBR })
  }

  return '-'
}

export function formatDateTime(date?: DateLike) {
  if (!date) return '-'

  const normalized =
    typeof date === 'string' ? new Date(date) : date instanceof Date ? date : date.toDate()

  if (Number.isNaN(normalized.getTime())) return '-'

  return format(normalized, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatPercent(value = 0) {
  return `${value.toFixed(1).replace('.', ',')}%`
}
