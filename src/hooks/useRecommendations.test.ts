import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useRecommendations } from '@/hooks/useRecommendations'
import { PAYMENT_METHODS } from '@/data/paymentMethods'
import type { PaymentMethod, OrderContext } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_CTX: OrderContext = {
  market: 'PH',
  deliveryType: 'standard',
  orderValue: 500,
}

/** Minimal fixture factory for controlled scoring tests. */
function makeMethod(overrides: Partial<PaymentMethod> & Pick<PaymentMethod, 'id'>): PaymentMethod {
  return {
    name: overrides.id,
    category: 'e-wallet',
    markets: ['PH'],
    confirmationTime: 'instant',
    confirmationMinutes: 0,
    expirationWindow: 'N/A',
    flowDescription: '',
    prerequisites: [],
    requiresBankAccount: false,
    requiresSmartphone: false,
    requiresPhysicalVisit: false,
    minAmount: 1,
    maxAmount: 100000,
    currency: 'PHP',
    successRate: 0.8, // baseline
    popularityRank: 6, // no popularity bonus
    brandColor: '#000',
    iconName: 'wallet',
    tagline: '',
    limitations: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useRecommendations', () => {
  // ─── Market filtering ─────────────────────────────────────────────────

  describe('market filtering', () => {
    it('only recommends methods available in the context market', () => {
      const ctx: OrderContext = { ...DEFAULT_CTX, market: 'TH' }
      const { result } = renderHook(() =>
        useRecommendations(PAYMENT_METHODS, ctx),
      )

      result.current.recommendations.forEach(r => {
        expect(r.method.markets).toContain('TH')
      })
    })

    it('changing market changes the recommendations', () => {
      const phCtx: OrderContext = { ...DEFAULT_CTX, market: 'PH' }
      const thCtx: OrderContext = { ...DEFAULT_CTX, market: 'TH' }

      const phHook = renderHook(() => useRecommendations(PAYMENT_METHODS, phCtx))
      const thHook = renderHook(() => useRecommendations(PAYMENT_METHODS, thCtx))

      const phIds = phHook.result.current.recommendations.map(r => r.method.id)
      const thIds = thHook.result.current.recommendations.map(r => r.method.id)

      // PH-only methods should not appear in TH results
      expect(thIds).not.toContain('gcash')
      // TH-only methods should not appear in PH results
      expect(phIds).not.toContain('truemoney')
    })
  })

  // ─── Delivery type scoring ────────────────────────────────────────────

  describe('delivery type scoring', () => {
    it('same-day delivery -- instant methods score higher than slow methods', () => {
      const instant = makeMethod({ id: 'instant', confirmationMinutes: 0 })
      const slow = makeMethod({ id: 'slow', confirmationMinutes: 200 })
      const methods = [instant, slow]

      const ctx: OrderContext = { ...DEFAULT_CTX, deliveryType: 'same-day' }
      const { result } = renderHook(() => useRecommendations(methods, ctx))

      const instantRec = result.current.recommendations.find(r => r.method.id === 'instant')
      const slowRec = result.current.recommendations.find(r => r.method.id === 'slow')

      expect(instantRec!.score).toBeGreaterThan(slowRec!.score)
    })

    it('same-day delivery -- slow methods (>120 min) get penalized', () => {
      const slow = makeMethod({ id: 'slow', confirmationMinutes: 200 })
      const methods = [slow]

      const sameDayCtx: OrderContext = { ...DEFAULT_CTX, deliveryType: 'same-day' }
      const standardCtx: OrderContext = { ...DEFAULT_CTX, deliveryType: 'standard' }

      const sameDayHook = renderHook(() => useRecommendations(methods, sameDayCtx))
      const standardHook = renderHook(() => useRecommendations(methods, standardCtx))

      const sameDayScore = sameDayHook.result.current.recommendations[0].score
      const standardScore = standardHook.result.current.recommendations[0].score

      // same-day should penalize slow methods more than standard does
      expect(sameDayScore).toBeLessThan(standardScore)
    })

    it('standard delivery -- slow methods are not heavily penalized', () => {
      const slow = makeMethod({ id: 'slow', confirmationMinutes: 1000 })
      const methods = [slow]

      const ctx: OrderContext = { ...DEFAULT_CTX, deliveryType: 'standard' }
      const { result } = renderHook(() => useRecommendations(methods, ctx))

      // With standard delivery and confirmationMinutes <= 1440, score should be >= 50
      // base(50) + deliveryFit(+10) + successRate(0) + popularity(0) + orderValue(+5) = 65
      expect(result.current.recommendations[0].score).toBeGreaterThanOrEqual(50)
    })
  })

  // ─── Top 3 ─────────────────────────────────────────────────────────────

  describe('top 3', () => {
    it('returns at most 3 recommendations', () => {
      const { result } = renderHook(() =>
        useRecommendations(PAYMENT_METHODS, DEFAULT_CTX),
      )

      expect(result.current.recommendations.length).toBeLessThanOrEqual(3)
    })

    it('returns fewer than 3 when the market has fewer methods', () => {
      const methods = [
        makeMethod({ id: 'only-one', markets: ['PH'] }),
      ]
      const { result } = renderHook(() =>
        useRecommendations(methods, DEFAULT_CTX),
      )

      expect(result.current.recommendations).toHaveLength(1)
    })

    it('recommendations are ordered by score DESC', () => {
      const { result } = renderHook(() =>
        useRecommendations(PAYMENT_METHODS, DEFAULT_CTX),
      )

      const scores = result.current.recommendations.map(r => r.score)
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i])
      }
    })
  })

  // ─── isConfident ──────────────────────────────────────────────────────

  describe('isConfident', () => {
    it('isConfident is true when top score > 60', () => {
      // instant method with good success rate should score > 60
      const method = makeMethod({
        id: 'good',
        confirmationMinutes: 0,
        successRate: 0.95,
        popularityRank: 1,
      })
      const ctx: OrderContext = { ...DEFAULT_CTX, deliveryType: 'same-day' }
      const { result } = renderHook(() =>
        useRecommendations([method], ctx),
      )

      expect(result.current.recommendations[0].score).toBeGreaterThan(60)
      expect(result.current.isConfident).toBe(true)
    })

    it('isConfident is false when top score <= 60', () => {
      // Craft a method that scores poorly: slow, low success rate, bad popularity, out-of-range value
      const method = makeMethod({
        id: 'poor',
        confirmationMinutes: 5000,
        successRate: 0.5,
        popularityRank: 10,
        minAmount: 1000,
        maxAmount: 2000,
      })
      const ctx: OrderContext = {
        market: 'PH',
        deliveryType: 'same-day',
        orderValue: 50, // below minAmount
      }
      const { result } = renderHook(() =>
        useRecommendations([method], ctx),
      )

      // base(50) - 40(same-day+slow) - 22.5(successRate below 0.8) + 0(pop) - 20(outOfRange) = clamped to 0
      expect(result.current.recommendations[0].score).toBeLessThanOrEqual(60)
      expect(result.current.isConfident).toBe(false)
    })

    it('isConfident is false when there are no recommendations', () => {
      const methods: PaymentMethod[] = []
      const { result } = renderHook(() =>
        useRecommendations(methods, DEFAULT_CTX),
      )

      expect(result.current.isConfident).toBe(false)
    })
  })

  // ─── explanation string ───────────────────────────────────────────────

  describe('explanation', () => {
    it('contains the delivery type label', () => {
      const ctx: OrderContext = { ...DEFAULT_CTX, deliveryType: 'same-day' }
      const { result } = renderHook(() =>
        useRecommendations(PAYMENT_METHODS, ctx),
      )

      expect(result.current.explanation).toContain('same-day delivery')
    })

    it('contains the correct market name for PH', () => {
      const ctx: OrderContext = { ...DEFAULT_CTX, market: 'PH' }
      const { result } = renderHook(() =>
        useRecommendations(PAYMENT_METHODS, ctx),
      )

      expect(result.current.explanation).toContain('the Philippines')
    })

    it('contains the correct market name for TH', () => {
      const ctx: OrderContext = { ...DEFAULT_CTX, market: 'TH' }
      const { result } = renderHook(() =>
        useRecommendations(PAYMENT_METHODS, ctx),
      )

      expect(result.current.explanation).toContain('Thailand')
    })

    it('contains the correct market name for ID', () => {
      const ctx: OrderContext = { ...DEFAULT_CTX, market: 'ID' }
      const { result } = renderHook(() =>
        useRecommendations(PAYMENT_METHODS, ctx),
      )

      expect(result.current.explanation).toContain('Indonesia')
    })

    it('explanation follows the expected template', () => {
      const ctx: OrderContext = { market: 'PH', deliveryType: 'express', orderValue: 100 }
      const { result } = renderHook(() =>
        useRecommendations(PAYMENT_METHODS, ctx),
      )

      expect(result.current.explanation).toBe(
        'Based on your express delivery order in the Philippines, we recommend:',
      )
    })
  })

  // ─── generateReason ───────────────────────────────────────────────────

  describe('generateReason', () => {
    it('instant method reason contains "Instant confirmation"', () => {
      const method = makeMethod({ id: 'fast', confirmationMinutes: 0 })
      const { result } = renderHook(() =>
        useRecommendations([method], DEFAULT_CTX),
      )

      expect(result.current.recommendations[0].reason).toContain('Instant confirmation')
    })

    it('method with successRate >= 0.9 reason contains the percentage', () => {
      const method = makeMethod({ id: 'reliable', successRate: 0.94, confirmationMinutes: 200 })
      const { result } = renderHook(() =>
        useRecommendations([method], DEFAULT_CTX),
      )

      expect(result.current.recommendations[0].reason).toContain('94%')
      expect(result.current.recommendations[0].reason).toContain('success rate')
    })

    it('same-day delivery + instant method reason contains "same-day delivery"', () => {
      const method = makeMethod({ id: 'fast', confirmationMinutes: 0 })
      const ctx: OrderContext = { ...DEFAULT_CTX, deliveryType: 'same-day' }
      const { result } = renderHook(() =>
        useRecommendations([method], ctx),
      )

      expect(result.current.recommendations[0].reason).toContain('same-day delivery')
    })

    it('popular method (popularityRank <= 2) reason contains "Most popular"', () => {
      const method = makeMethod({ id: 'popular', popularityRank: 1, confirmationMinutes: 200 })
      const { result } = renderHook(() =>
        useRecommendations([method], DEFAULT_CTX),
      )

      expect(result.current.recommendations[0].reason).toContain('Most popular')
    })

    it('method with no special traits gets default reason', () => {
      const method = makeMethod({
        id: 'basic',
        confirmationMinutes: 200,
        successRate: 0.8,
        popularityRank: 10,
      })
      const ctx: OrderContext = { ...DEFAULT_CTX, deliveryType: 'standard' }
      const { result } = renderHook(() =>
        useRecommendations([method], ctx),
      )

      expect(result.current.recommendations[0].reason).toBe('Good fit for your order')
    })
  })

  // ─── Scoring details (unit-level with fixtures) ───────────────────────

  describe('scoring details', () => {
    it('order value out of range penalizes the score', () => {
      const method = makeMethod({
        id: 'limited',
        minAmount: 100,
        maxAmount: 500,
        confirmationMinutes: 0,
      })

      const inRangeCtx: OrderContext = { ...DEFAULT_CTX, orderValue: 300 }
      const outRangeCtx: OrderContext = { ...DEFAULT_CTX, orderValue: 600 }

      const inRange = renderHook(() => useRecommendations([method], inRangeCtx))
      const outRange = renderHook(() => useRecommendations([method], outRangeCtx))

      expect(inRange.result.current.recommendations[0].score).toBeGreaterThan(
        outRange.result.current.recommendations[0].score,
      )
    })

    it('higher success rate yields a higher score', () => {
      const high = makeMethod({ id: 'high-sr', successRate: 0.95 })
      const low = makeMethod({ id: 'low-sr', successRate: 0.7 })

      const highHook = renderHook(() => useRecommendations([high], DEFAULT_CTX))
      const lowHook = renderHook(() => useRecommendations([low], DEFAULT_CTX))

      expect(highHook.result.current.recommendations[0].score).toBeGreaterThan(
        lowHook.result.current.recommendations[0].score,
      )
    })

    it('better popularity rank yields a higher score', () => {
      const popular = makeMethod({ id: 'pop', popularityRank: 1 })
      const unpopular = makeMethod({ id: 'unpop', popularityRank: 10 })

      const popHook = renderHook(() => useRecommendations([popular], DEFAULT_CTX))
      const unpopHook = renderHook(() => useRecommendations([unpopular], DEFAULT_CTX))

      expect(popHook.result.current.recommendations[0].score).toBeGreaterThan(
        unpopHook.result.current.recommendations[0].score,
      )
    })

    it('score is clamped between 0 and 100', () => {
      // Super good method -- should not exceed 100
      const great = makeMethod({
        id: 'great',
        confirmationMinutes: 0,
        successRate: 0.99,
        popularityRank: 1,
      })
      const greatCtx: OrderContext = { ...DEFAULT_CTX, deliveryType: 'same-day' }
      const greatHook = renderHook(() => useRecommendations([great], greatCtx))
      expect(greatHook.result.current.recommendations[0].score).toBeLessThanOrEqual(100)

      // Terrible method -- should not go below 0
      const terrible = makeMethod({
        id: 'terrible',
        confirmationMinutes: 5000,
        successRate: 0.3,
        popularityRank: 20,
        minAmount: 10000,
        maxAmount: 20000,
      })
      const terribleCtx: OrderContext = { ...DEFAULT_CTX, deliveryType: 'same-day', orderValue: 1 }
      const terribleHook = renderHook(() => useRecommendations([terrible], terribleCtx))
      expect(terribleHook.result.current.recommendations[0].score).toBeGreaterThanOrEqual(0)
    })
  })

  // ─── Integration with real data ───────────────────────────────────────

  describe('integration with PAYMENT_METHODS', () => {
    it('GCash is the top recommendation for PH same-day delivery', () => {
      const ctx: OrderContext = { market: 'PH', deliveryType: 'same-day', orderValue: 500 }
      const { result } = renderHook(() => useRecommendations(PAYMENT_METHODS, ctx))

      expect(result.current.recommendations[0].method.id).toBe('gcash')
    })

    it('TrueMoney or PromptPay are among top recs for TH same-day', () => {
      const ctx: OrderContext = { market: 'TH', deliveryType: 'same-day', orderValue: 500 }
      const { result } = renderHook(() => useRecommendations(PAYMENT_METHODS, ctx))

      const topIds = result.current.recommendations.map(r => r.method.id)
      const hasInstantTH = topIds.includes('truemoney') || topIds.includes('promptpay')
      expect(hasInstantTH).toBe(true)
    })

    it('slow methods do not appear in top 3 for same-day delivery', () => {
      const ctx: OrderContext = { market: 'PH', deliveryType: 'same-day', orderValue: 500 }
      const { result } = renderHook(() => useRecommendations(PAYMENT_METHODS, ctx))

      result.current.recommendations.forEach(r => {
        // Methods with 1440+ minutes should not be recommended for same-day
        expect(r.method.confirmationMinutes).toBeLessThan(1440)
      })
    })
  })
})
