import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { usePaymentFilter } from '@/hooks/usePaymentFilter'
import { PAYMENT_METHODS } from '@/data/paymentMethods'
import type { PaymentMethod, FilterState, Market } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_FILTER: FilterState = {
  speed: 'all',
  convenience: 'all',
  categories: [],
  searchQuery: '',
}

/** Minimal fixture factory -- only the fields the hook inspects. */
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
    successRate: 0.9,
    popularityRank: 1,
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

describe('usePaymentFilter', () => {
  // ─── Market filtering (hard filter) ────────────────────────────────────

  describe('market filtering', () => {
    it('only returns methods that include the selected market', () => {
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, DEFAULT_FILTER, 'PH'),
      )

      const ids = result.current.results.map(r => r.method.id)
      // Every returned method must have PH in its markets
      result.current.results.forEach(r => {
        expect(r.method.markets).toContain('PH')
      })
      // Methods exclusive to other markets must NOT appear
      expect(ids).not.toContain('truemoney') // TH-only
      expect(ids).not.toContain('gopay') // ID-only
    })

    it('returns the correct total count per market', () => {
      const phHook = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, DEFAULT_FILTER, 'PH'),
      )
      const thHook = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, DEFAULT_FILTER, 'TH'),
      )
      const idHook = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, DEFAULT_FILTER, 'ID'),
      )

      // PH: gcash, instapay, 7eleven-cliqq, bdo-direct, card = 5
      expect(phHook.result.current.total).toBe(5)
      // TH: truemoney, promptpay, 7eleven-th, card = 4
      expect(thHook.result.current.total).toBe(4)
      // ID: gopay, qris, alfamart, card = 4
      expect(idHook.result.current.total).toBe(4)
    })
  })

  // ─── Speed filter ──────────────────────────────────────────────────────

  describe('speed filter', () => {
    it('speed: instant -- methods with confirmationMinutes > 0 are incompatible', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, speed: 'instant' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      result.current.results.forEach(r => {
        if (r.method.confirmationMinutes > 0) {
          expect(r.fitStatus).toBe('incompatible')
          expect(r.fitReason).toBeTruthy()
        } else {
          expect(r.fitStatus).toBe('compatible')
        }
      })
    })

    it('speed: under-2hr -- methods with confirmationMinutes > 120 are incompatible', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, speed: 'under-2hr' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      result.current.results.forEach(r => {
        if (r.method.confirmationMinutes > 120) {
          expect(r.fitStatus).toBe('incompatible')
        }
      })

      // InstaPay (120min) should still be compatible (not > 120)
      const instapay = result.current.results.find(r => r.method.id === 'instapay')
      expect(instapay?.fitStatus).toBe('compatible')
    })

    it('speed: under-24hr -- methods with confirmationMinutes > 1440 are incompatible', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, speed: 'under-24hr' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      // BDO Direct (4320 min) should be incompatible
      const bdo = result.current.results.find(r => r.method.id === 'bdo-direct')
      expect(bdo?.fitStatus).toBe('incompatible')
      expect(bdo?.fitReason).toContain('3 days')

      // 7-Eleven Cliqq (1440 min) should be compatible (not > 1440)
      const sevenEleven = result.current.results.find(r => r.method.id === '7eleven-cliqq')
      expect(sevenEleven?.fitStatus).toBe('compatible')
    })

    it('speed: all -- no methods become incompatible due to speed', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, speed: 'all' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      result.current.results.forEach(r => {
        expect(r.fitStatus).toBe('compatible')
      })
    })
  })

  // ─── Convenience filter ────────────────────────────────────────────────

  describe('convenience filter', () => {
    it('no-bank-account -- methods with requiresBankAccount are incompatible', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, convenience: 'no-bank-account' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      const instapay = result.current.results.find(r => r.method.id === 'instapay')
      expect(instapay?.fitStatus).toBe('incompatible')
      expect(instapay?.fitReason).toContain('bank account')

      const gcash = result.current.results.find(r => r.method.id === 'gcash')
      expect(gcash?.fitStatus).toBe('compatible')
    })

    it('cash-preferred -- only cash-otc methods are compatible', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, convenience: 'cash-preferred' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      result.current.results.forEach(r => {
        if (r.method.category === 'cash-otc') {
          expect(r.fitStatus).toBe('compatible')
        } else {
          expect(r.fitStatus).toBe('incompatible')
          expect(r.fitReason).toContain('cash')
        }
      })
    })

    it('phone-only -- methods with requiresPhysicalVisit are incompatible', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, convenience: 'phone-only' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      // 7-Eleven Cliqq requires physical visit
      const sevenEleven = result.current.results.find(r => r.method.id === '7eleven-cliqq')
      expect(sevenEleven?.fitStatus).toBe('incompatible')
      expect(sevenEleven?.fitReason).toContain('physical store visit')

      // GCash has smartphone and no physical visit => compatible
      const gcash = result.current.results.find(r => r.method.id === 'gcash')
      expect(gcash?.fitStatus).toBe('compatible')
    })

    it('phone-only -- methods without requiresSmartphone are also incompatible', () => {
      const methods = [
        makeMethod({ id: 'no-phone', requiresSmartphone: false, requiresPhysicalVisit: false, markets: ['PH'] }),
      ]
      const filter: FilterState = { ...DEFAULT_FILTER, convenience: 'phone-only' }
      const { result } = renderHook(() =>
        usePaymentFilter(methods, filter, 'PH'),
      )

      expect(result.current.results[0].fitStatus).toBe('incompatible')
    })
  })

  // ─── Category filter ───────────────────────────────────────────────────

  describe('category filter', () => {
    it('categories: [e-wallet] -- only e-wallet methods are compatible', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, categories: ['e-wallet'] }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      result.current.results.forEach(r => {
        if (r.method.category === 'e-wallet') {
          expect(r.fitStatus).toBe('compatible')
        } else {
          expect(r.fitStatus).toBe('incompatible')
          expect(r.fitReason).toContain('Not in selected categories')
        }
      })
    })

    it('categories: [] -- no category filter applied, all compatible', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, categories: [] }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      result.current.results.forEach(r => {
        expect(r.fitStatus).toBe('compatible')
      })
    })

    it('multiple categories filter works correctly', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, categories: ['e-wallet', 'bank-transfer'] }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      result.current.results.forEach(r => {
        if (r.method.category === 'e-wallet' || r.method.category === 'bank-transfer') {
          expect(r.fitStatus).toBe('compatible')
        } else {
          expect(r.fitStatus).toBe('incompatible')
        }
      })
    })
  })

  // ─── Search filter (hard filter) ──────────────────────────────────────

  describe('search filter', () => {
    it('removes methods that do not match the search query', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, searchQuery: 'gcash' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      // Only GCash should appear
      expect(result.current.results).toHaveLength(1)
      expect(result.current.results[0].method.id).toBe('gcash')
    })

    it('search is case-insensitive', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, searchQuery: 'gcash' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      expect(result.current.results).toHaveLength(1)
      expect(result.current.results[0].method.name).toBe('GCash')
    })

    it('search matches against tagline', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, searchQuery: 'popular' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      // GCash tagline: "The most popular e-wallet in the Philippines..."
      const ids = result.current.results.map(r => r.method.id)
      expect(ids).toContain('gcash')
    })

    it('search matches against category', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, searchQuery: 'bank-transfer' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      result.current.results.forEach(r => {
        expect(r.method.category).toBe('bank-transfer')
      })
    })

    it('empty search returns all market methods', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, searchQuery: '' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      expect(result.current.results.length).toBe(result.current.total)
    })

    it('non-matching search returns empty results', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, searchQuery: 'xyznonexistent' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      expect(result.current.results).toHaveLength(0)
    })
  })

  // ─── Sorting ──────────────────────────────────────────────────────────

  describe('sorting', () => {
    it('compatible methods appear before incompatible methods', () => {
      const filter: FilterState = { ...DEFAULT_FILTER, speed: 'instant' }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      const statuses = result.current.results.map(r => r.fitStatus)
      const firstIncompatible = statuses.indexOf('incompatible')
      const lastCompatible = statuses.lastIndexOf('compatible')

      // All compatible items should come before all incompatible items
      if (firstIncompatible !== -1 && lastCompatible !== -1) {
        expect(lastCompatible).toBeLessThan(firstIncompatible)
      }
    })

    it('within compatible group, methods are sorted by popularityRank ASC', () => {
      const methods = [
        makeMethod({ id: 'b', popularityRank: 3, markets: ['PH'] }),
        makeMethod({ id: 'a', popularityRank: 1, markets: ['PH'] }),
        makeMethod({ id: 'c', popularityRank: 2, markets: ['PH'] }),
      ]
      const { result } = renderHook(() =>
        usePaymentFilter(methods, DEFAULT_FILTER, 'PH'),
      )

      const ids = result.current.results.map(r => r.method.id)
      expect(ids).toEqual(['a', 'c', 'b'])
    })

    it('within incompatible group, methods are also sorted by popularityRank ASC', () => {
      const methods = [
        makeMethod({ id: 'slow-b', confirmationMinutes: 200, popularityRank: 5, markets: ['PH'] }),
        makeMethod({ id: 'slow-a', confirmationMinutes: 300, popularityRank: 1, markets: ['PH'] }),
        makeMethod({ id: 'fast', confirmationMinutes: 0, popularityRank: 10, markets: ['PH'] }),
      ]
      const filter: FilterState = { ...DEFAULT_FILTER, speed: 'instant' }
      const { result } = renderHook(() =>
        usePaymentFilter(methods, filter, 'PH'),
      )

      // fast should be first (compatible), then slow-a (rank 1), then slow-b (rank 5)
      const ids = result.current.results.map(r => r.method.id)
      expect(ids).toEqual(['fast', 'slow-a', 'slow-b'])
    })
  })

  // ─── Combined filters (integration) ───────────────────────────────────

  describe('combined filters (integration)', () => {
    it('speed + convenience filters combine correctly', () => {
      const filter: FilterState = {
        ...DEFAULT_FILTER,
        speed: 'instant',
        convenience: 'no-bank-account',
      }
      const { result } = renderHook(() =>
        usePaymentFilter(PAYMENT_METHODS, filter, 'PH'),
      )

      // GCash: instant + no bank = compatible
      const gcash = result.current.results.find(r => r.method.id === 'gcash')
      expect(gcash?.fitStatus).toBe('compatible')

      // InstaPay: 120 min > 0 threshold = incompatible (speed check fails first)
      const instapay = result.current.results.find(r => r.method.id === 'instapay')
      expect(instapay?.fitStatus).toBe('incompatible')

      // Card: instant but requiresBankAccount = incompatible (convenience check)
      const card = result.current.results.find(r => r.method.id === 'card')
      expect(card?.fitStatus).toBe('incompatible')
    })

    it('first failing check determines the fitReason', () => {
      // A method that fails both speed AND convenience should get the speed reason
      // because speed is checked first in the hook
      const methods = [
        makeMethod({
          id: 'slow-bank',
          confirmationMinutes: 200,
          requiresBankAccount: true,
          markets: ['PH'],
        }),
      ]
      const filter: FilterState = {
        ...DEFAULT_FILTER,
        speed: 'instant',
        convenience: 'no-bank-account',
      }
      const { result } = renderHook(() =>
        usePaymentFilter(methods, filter, 'PH'),
      )

      // Speed is checked first, so reason should be about confirmation time
      expect(result.current.results[0].fitStatus).toBe('incompatible')
      expect(result.current.results[0].fitReason).toContain('confirm')
    })
  })
})
