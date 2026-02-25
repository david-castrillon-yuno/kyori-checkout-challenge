import { useMemo } from 'react'
import type { PaymentMethod, FilterState, Market, FilteredMethod } from '@/types'

const SPEED_TO_MINUTES: Record<string, number> = {
  instant: 0,
  'under-2hr': 120,
  'under-24hr': 1440,
}

function getSpeedReason(minutes: number): string {
  if (minutes >= 4320) return 'Takes up to 3 days to confirm'
  if (minutes >= 1440) return 'Takes up to 24 hours to confirm'
  if (minutes >= 120) return 'Takes up to 2 hours to confirm'
  return ''
}

export function usePaymentFilter(
  methods: PaymentMethod[],
  filterState: FilterState,
  market: Market
): { results: FilteredMethod[]; total: number } {
  const results = useMemo(() => {
    // Hard filter: only show methods available in selected market
    const marketMethods = methods.filter(m => m.markets.includes(market))

    const scored: FilteredMethod[] = marketMethods.map(m => {
      // Speed check
      if (filterState.speed !== 'all') {
        const max = SPEED_TO_MINUTES[filterState.speed]
        if (m.confirmationMinutes > max) {
          return { method: m, fitStatus: 'incompatible', fitReason: getSpeedReason(m.confirmationMinutes) }
        }
      }

      // Convenience check
      if (filterState.convenience === 'no-bank-account' && m.requiresBankAccount) {
        return { method: m, fitStatus: 'incompatible', fitReason: 'Requires a bank account' }
      }
      if (filterState.convenience === 'phone-only' && (!m.requiresSmartphone || m.requiresPhysicalVisit)) {
        return { method: m, fitStatus: 'incompatible', fitReason: 'Requires physical store visit or no app available' }
      }
      if (filterState.convenience === 'cash-preferred' && m.category !== 'cash-otc') {
        return { method: m, fitStatus: 'incompatible', fitReason: 'Not a cash payment option' }
      }

      // Category check
      if (filterState.categories.length > 0 && !filterState.categories.includes(m.category)) {
        return { method: m, fitStatus: 'incompatible', fitReason: 'Not in selected categories' }
      }

      return { method: m, fitStatus: 'compatible' }
    })

    // Hard filter: search removes entirely (not dimmed)
    const filtered = filterState.searchQuery.trim()
      ? scored.filter(({ method: m }) => {
          const q = filterState.searchQuery.toLowerCase()
          return (
            m.name.toLowerCase().includes(q) ||
            m.tagline.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
          )
        })
      : scored

    // Sort: compatible first (by popularityRank), then incompatible
    return filtered.sort((a, b) => {
      if (a.fitStatus === b.fitStatus) return a.method.popularityRank - b.method.popularityRank
      return a.fitStatus === 'compatible' ? -1 : 1
    })
  }, [methods, filterState, market])

  return {
    results,
    total: methods.filter(m => m.markets.includes(market)).length,
  }
}
