import { useState, useCallback, useMemo } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Toaster } from 'sonner'
import { PAYMENT_METHODS } from '@/data/paymentMethods'
import { DEFAULT_ORDER_CONTEXT, ORDER_CONTEXT_PRESETS } from '@/data/orderContexts'
import { usePaymentFilter } from '@/hooks/usePaymentFilter'
import { useRecommendations } from '@/hooks/useRecommendations'
import type { FilterState, OrderContext } from '@/types'
import { Header } from '@/components/Header'
import { OrderContextPanel } from '@/components/OrderContextPanel'
import { FilterPanel } from '@/components/FilterPanel'
import { RecommendationBanner } from '@/components/RecommendationBanner'
import { PaymentMethodGrid } from '@/components/PaymentMethodGrid'
import { ComparisonDrawer } from '@/components/ComparisonDrawer'
import { CompareBar } from '@/components/CompareBar'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

const DEFAULT_FILTER: FilterState = {
  speed: 'all',
  convenience: 'all',
  categories: [],
  searchQuery: '',
}

export default function App() {
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER)
  const [orderContext, setOrderContext] = useState<OrderContext>(DEFAULT_ORDER_CONTEXT)
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // usePaymentFilter returns { results: FilteredMethod[], total }
  const { results, total } = usePaymentFilter(PAYMENT_METHODS, filterState, orderContext.market)

  // useRecommendations gets ALL methods — filters by market internally
  const recommendations = useRecommendations(PAYMENT_METHODS, orderContext)

  // Memoize derived sets/maps to avoid unnecessary re-renders
  const recommendedIds = useMemo(
    () => new Set(recommendations.recommendations.map(r => r.method.id)),
    [recommendations]
  )
  const recommendationReasons = useMemo(
    () => new Map(recommendations.recommendations.map(r => [r.method.id, r.reason])),
    [recommendations]
  )

  // Wrap setOrderContext to clear comparison when market changes
  const handleOrderContextChange = useCallback((ctx: OrderContext) => {
    setOrderContext(prev => {
      if (prev.market !== ctx.market) {
        setSelectedForComparison([])
        setIsDrawerOpen(false)
      }
      return ctx
    })
  }, [])

  const toggleComparison = useCallback((id: string) => {
    setSelectedForComparison(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    )
  }, [])

  const comparisonMethods = useMemo(
    () => PAYMENT_METHODS.filter(m => selectedForComparison.includes(m.id)),
    [selectedForComparison]
  )

  const compatibleCount = results.filter(r => r.fitStatus === 'compatible').length

  const hasActiveFilters =
    filterState.speed !== 'all' ||
    filterState.convenience !== 'all' ||
    filterState.categories.length > 0 ||
    filterState.searchQuery !== ''

  const activeFilterCount =
    (filterState.speed !== 'all' ? 1 : 0) +
    (filterState.convenience !== 'all' ? 1 : 0) +
    (filterState.categories.length > 0 ? 1 : 0) +
    (filterState.searchQuery !== '' ? 1 : 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <Header market={orderContext.market} />

      <OrderContextPanel
        orderContext={orderContext}
        onOrderContextChange={handleOrderContextChange}
        presets={ORDER_CONTEXT_PRESETS}
      />

      <div className="mx-auto flex max-w-screen-2xl gap-6 px-4 py-6 md:px-6">
        {/* Sidebar — hidden on mobile */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <FilterPanel
            filterState={filterState}
            onFilterChange={setFilterState}
            totalCount={total}
            filteredCount={compatibleCount}
          />
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <RecommendationBanner result={recommendations} />

          <p className="mb-4 text-sm text-slate-500">
            Showing{' '}
            <span className="font-medium text-slate-700">{compatibleCount}</span> of{' '}
            <span className="font-medium text-slate-700">{total}</span> payment methods
          </p>

          <PaymentMethodGrid
            results={results}
            recommendedIds={recommendedIds}
            recommendationReasons={recommendationReasons}
            selectedForComparison={selectedForComparison}
            onToggleComparison={toggleComparison}
            orderContext={orderContext}
          />
        </main>
      </div>

      {/* Mobile filter button */}
      <button
        className="fixed bottom-20 right-4 z-40 lg:hidden flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
        onClick={() => setIsMobileFilterOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4" /> Filters
        {hasActiveFilters && (
          <span className="ml-1 rounded-full bg-green-500 px-1.5 text-xs">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Mobile filter drawer */}
      <Drawer open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto p-4">
            <FilterPanel
              filterState={filterState}
              onFilterChange={(newState) => {
                setFilterState(newState)
              }}
              totalCount={total}
              filteredCount={compatibleCount}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <CompareBar
        selectedCount={selectedForComparison.length}
        onOpen={() => setIsDrawerOpen(true)}
        onClear={() => setSelectedForComparison([])}
      />

      <ComparisonDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        methods={comparisonMethods}
        orderContext={orderContext}
      />

      <Toaster richColors position="top-right" />
    </div>
  )
}
