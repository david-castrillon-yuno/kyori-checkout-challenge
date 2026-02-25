import { useMemo } from 'react'
import type { PaymentMethod, OrderContext, RecommendationResult, RecommendedMethod, Market, DeliveryType } from '@/types'

const MARKET_NAMES: Record<Market, string> = {
  PH: 'the Philippines',
  TH: 'Thailand',
  ID: 'Indonesia',
}

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  'same-day': 'same-day delivery',
  'express': 'express delivery',
  'standard': 'standard delivery',
  'scheduled': 'scheduled delivery',
}

function scoreMethod(method: PaymentMethod, ctx: OrderContext): number {
  let score = 50

  // Rule 1: Delivery type fit
  if (ctx.deliveryType === 'same-day') {
    if (method.confirmationMinutes === 0) score += 30
    else if (method.confirmationMinutes <= 120) score += 10
    else score -= 40
  } else if (ctx.deliveryType === 'express') {
    if (method.confirmationMinutes === 0) score += 25
    else if (method.confirmationMinutes <= 120) score += 15
    else score -= 20
  } else if (ctx.deliveryType === 'standard') {
    score += method.confirmationMinutes <= 1440 ? 10 : -10
  } else {
    score += 5 // scheduled: no penalty
  }

  // Rule 2: Success rate bonus
  score += (method.successRate - 0.80) * 75

  // Rule 3: Popularity bonus
  score += Math.max(0, (6 - method.popularityRank) * 2)

  // Rule 4: Order value compatibility
  if (ctx.orderValue > method.maxAmount || ctx.orderValue < method.minAmount) {
    score -= 20
  } else {
    score += 5
  }

  return Math.max(0, Math.min(100, score))
}

function generateReason(method: PaymentMethod, ctx: OrderContext): string {
  const parts: string[] = []
  if (method.confirmationMinutes === 0) parts.push('Instant confirmation')
  if (method.successRate >= 0.9) parts.push(`${Math.round(method.successRate * 100)}% success rate`)
  if (method.popularityRank <= 2) parts.push('Most popular in your market')
  if (ctx.deliveryType === 'same-day' && method.confirmationMinutes === 0) {
    parts.push('perfect for same-day delivery')
  }
  return parts.join(' · ') || 'Good fit for your order'
}

export function useRecommendations(
  methods: PaymentMethod[],
  ctx: OrderContext
): RecommendationResult {
  return useMemo(() => {
    const scored: RecommendedMethod[] = methods
      .filter(m => m.markets.includes(ctx.market))
      .map(m => ({
        method: m,
        score: scoreMethod(m, ctx),
        reason: generateReason(m, ctx),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    return {
      recommendations: scored,
      explanation: `Based on your ${DELIVERY_LABELS[ctx.deliveryType]} order in ${MARKET_NAMES[ctx.market]}, we recommend:`,
      isConfident: scored.length > 0 && scored[0].score > 60,
    }
  }, [methods, ctx])
}
