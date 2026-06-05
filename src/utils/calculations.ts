import type { CostSnapshot, QuoteItem } from '../types'

export type QuoteTotals = {
  subtotal: number
  total: number
  depositAmount: number
  remainingAmount: number
  totalCosts: number
  estimatedProfit: number
  estimatedMargin: number
}

export function calculateQuoteTotals(
  items: QuoteItem[],
  discount = 0,
  travelFee = 0,
  manualCosts: CostSnapshot[] = [],
): QuoteTotals {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const total = Math.max(subtotal - discount + travelFee, 0)
  const itemCosts = items.reduce(
    (sum, item) => sum + item.costSnapshot.reduce((itemSum, cost) => itemSum + cost.cost, 0),
    0,
  )
  const totalCosts = itemCosts + manualCosts.reduce((sum, cost) => sum + cost.cost, 0)
  const estimatedProfit = total - totalCosts
  const estimatedMargin = total > 0 ? (estimatedProfit / total) * 100 : 0
  const depositAmount = total * 0.5

  return {
    subtotal,
    total,
    depositAmount,
    remainingAmount: total - depositAmount,
    totalCosts,
    estimatedProfit,
    estimatedMargin,
  }
}

export function serviceLinksToCosts(itemServiceName: string, costs: CostSnapshot[]) {
  return costs.map((cost) => ({
    ...cost,
    notes: cost.notes || `Custo vinculado ao servico ${itemServiceName}`,
  }))
}
