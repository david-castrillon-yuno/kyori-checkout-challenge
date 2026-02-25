/**
 * usePaymentFilter — filters payment methods against the current filter state.
 *
 * Design decision: instead of hiding non-matching methods, we mark them as
 * 'incompatible' with a human-readable reason. The UI renders them dimmed at
 * the bottom of the grid so customers understand why a method isn't ideal —
 * not just that it disappeared. Search is the only true hard filter (removes
 * entirely) because a customer typing a name expects exact matches.
 */
import { useMemo } from 'react'
import type { PaymentMethod, FilterState, Market, FilteredMethod, SpeedFilter } from '@/types'

// Maps SpeedFilter values to their maximum allowed confirmation time in minutes.
const SPEED_TO_MINUTES: Record<Exclude<SpeedFilter, 'all'>, number> = {
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
    // Step 1 — hard filter by market. Methods from other markets are never shown,
    // even dimmed, because they're genuinely unavailable at checkout.
    const marketMethods = methods.filter(m => m.markets.includes(market))

    // Step 2 — compute fitStatus per method. First failing check wins; the
    // rest are not evaluated (a method can only have one primary reason).
    const scored: FilteredMethod[] = marketMethods.map(m => {
      // Speed check — compare confirmationMinutes against the filter threshold
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

  const total = useMemo(
    () => methods.filter(m => m.markets.includes(market)).length,
    [methods, market]
  )

  return { results, total }
}
