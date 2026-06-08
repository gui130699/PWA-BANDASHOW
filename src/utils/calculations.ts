import type { CostSnapshot, QuoteItem } from '../types'

export type QuoteTotals = {
  subtotal: number
  total: number
  depositPercent: number
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
  depositPercent = 50,
): QuoteTotals {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const total = Math.max(subtotal - discount + travelFee, 0)
  const itemCosts = items.reduce(
    (sum, item) =>
      sum +
      item.costSnapshot.reduce(
        (itemSum, cost) => itemSum + (cost.totalCost ?? cost.cost * (cost.quantity ?? 1)),
        0,
      ),
    0,
  )
  const totalCosts =
    itemCosts +
    manualCosts.reduce((sum, cost) => sum + (cost.totalCost ?? cost.cost * (cost.quantity ?? 1)), 0)
  const estimatedProfit = total - totalCosts
  const estimatedMargin = total > 0 ? (estimatedProfit / total) * 100 : 0
  const normalizedDepositPercent = Math.min(Math.max(depositPercent, 1), 100)
  const depositAmount = total * (normalizedDepositPercent / 100)

  return {
    subtotal,
    total,
    depositPercent: normalizedDepositPercent,
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
