# Kyori Grocery Checkout Optimizer — Implementation Plan

**Tech Stack:** Vite 7, React 19, TypeScript 5.9+, Tailwind CSS v4, shadcn/ui, Motion 12, lucide-react

**Reference:** See `docs/plans/01-architecture.md` for types, data model, algorithms, and state design.

---

## Phase 0: Project Setup (≈ 15 min)

### Task 0.1 — Install Tailwind CSS v4

```bash
cd /Users/davidcastrillon/Documents/challenges/kyori-checkout-challenge
npm install -D tailwindcss @tailwindcss/vite
```

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
})
```

Replace `src/index.css` entirely:
```css
@import "tailwindcss";

@theme {
  --color-kyori-green: #16a34a;
  --color-kyori-light: #f0fdf4;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

---

### Task 0.2 — Install Motion

```bash
npm install motion
```

> Import with: `import { motion, AnimatePresence } from "motion/react"`

---

### Task 0.3 — Initialize shadcn/ui

```bash
npx shadcn@latest init
```

Prompts:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **yes**

Then add components:
```bash
npx shadcn@latest add badge button card drawer input separator slider tabs toggle toggle-group tooltip scroll-area
```

This creates:
- `src/lib/utils.ts` — `cn()` helper
- `src/components/ui/` — all shadcn components
- Updates `index.css` with CSS variables

---

### Task 0.4 — Clean Vite Boilerplate

- Delete `src/App.css`
- Delete `src/assets/react.svg`
- Clear `public/vite.svg` (replace with favicon or leave)
- Reset `src/App.tsx` to empty shell:

```tsx
export default function App() {
  return <div>Kyori Checkout</div>
}
```

- Reset `src/main.tsx` (keep as-is, React 19 createRoot already there)

**Commit:**
```bash
git add -A
git commit -m "chore: setup tailwind v4, shadcn/ui, motion"
```

---

## Phase 1: Types + Mock Data (≈ 15 min)

> **TypeScript note:** `tsconfig.app.json` has `verbatimModuleSyntax: true`. ALL type-only imports MUST use `import type { ... }` syntax. Example: `import type { PaymentMethod, FilterState } from '../types'`. Mixing value and type imports: `import { someValue, type SomeType } from './module'`.

### Task 1.1 — Types (`src/types/index.ts`)

Create file with all types from `01-architecture.md` Section 3.

Key types: `Market`, `PaymentCategory`, `DeliveryType`, `ConfirmationTime`, `SpeedFilter`, `ConvenienceFilter`, `Currency`, `PaymentMethod`, `OrderContext`, `FilterState`, `FitStatus`, `FilteredMethod`, `RecommendedMethod`, `RecommendationResult`, and all component prop interfaces.

Add `export type Currency = 'PHP' | 'THB' | 'IDR' | 'MULTI'` and change `currency: string` to `currency: Currency` in the `PaymentMethod` interface.

---

### Task 1.2 — Payment Methods (`src/data/paymentMethods.ts`)

Create `PAYMENT_METHODS: PaymentMethod[]` with all 11 methods. Full data in `01-architecture.md` Section 4.

Key points:
- GCash, TrueMoney, GoPay, Card → `confirmationMinutes: 0`
- PromptPay, QRIS → `confirmationMinutes: 0`, category `qr-code`
- InstaPay → `confirmationMinutes: 120`
- 7-Eleven (PH/TH), Alfamart → `confirmationMinutes: 1440`
- Card → `markets: ['PH', 'TH', 'ID']`, `currency: 'MULTI'`
- **11th method: BRI Transfer** — id: `bri-transfer`, market: ID, category: bank-transfer, `confirmationTime: '3day'`, `confirmationMinutes: 4320` (1-3 business days), successRate: 0.82, requiresBankAccount: true, requiresSmartphone: false, requiresPhysicalVisit: false, popularityRank: 4, currency: 'IDR', minAmount: 10000, maxAmount: 500000000, brandColor: '#003087', iconName: 'Building2', tagline: 'Standard bank transfer -- works with any Indonesian bank', expirationWindow: '72 hours', flowDescription: 'Transfer from any Indonesian bank to BRI account. Standard inter-bank transfer processed in batches. Confirmation within 1-3 business days.', prerequisites: ['Indonesian bank account', 'Internet or mobile banking'], limitations: ['1-3 business days confirmation', 'Not suitable for same-day or express delivery', 'Min 10,000 IDR']

---

### Task 1.3 — Order Contexts (`src/data/orderContexts.ts`)

```typescript
import type { OrderContext } from '../types'

export const DEFAULT_ORDER_CONTEXT: OrderContext = {
  market: 'PH',
  deliveryType: 'same-day',
  orderValue: 500,
}

export const ORDER_CONTEXT_PRESETS: OrderContext[] = [
  { market: 'PH', deliveryType: 'same-day',  orderValue: 500,     label: 'Manila · Same-day · Small' },
  { market: 'PH', deliveryType: 'standard',  orderValue: 5000,    label: 'Manila · Standard · Large' },
  { market: 'TH', deliveryType: 'same-day',  orderValue: 200,     label: 'Bangkok · Same-day · Small' },
  { market: 'TH', deliveryType: 'scheduled', orderValue: 2000,    label: 'Bangkok · Scheduled · Large' },
  { market: 'ID', deliveryType: 'express',   orderValue: 100000,  label: 'Jakarta · Express · Small' },
  { market: 'ID', deliveryType: 'standard',  orderValue: 1000000, label: 'Jakarta · Standard · Large' },
]
```

**Commit:**
```bash
git add -A
git commit -m "feat: add types, payment method mock data, order context presets"
```

---

## Phase 2: Business Logic Hooks (≈ 15 min)

### Task 2.1 — `src/hooks/usePaymentFilter.ts`

```typescript
import { useMemo } from 'react'
import type { PaymentMethod, FilterState, Market, FilteredMethod } from '../types'

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
        return { method: m, fitStatus: 'incompatible', fitReason: `Not in selected categories` }
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
```

---

### Task 2.2 — `src/hooks/useRecommendations.ts`

Implements scoring algorithm from `01-architecture.md` Section 7.

> **Important:** Called in App.tsx with `PAYMENT_METHODS` (all methods), NOT the filtered results. The hook internally filters by market via `methods.filter(m => m.markets.includes(ctx.market))`.

```typescript
import { useMemo } from 'react'
import type { PaymentMethod, OrderContext, RecommendationResult, RecommendedMethod } from '../types'

const MARKET_NAMES = { PH: 'the Philippines', TH: 'Thailand', ID: 'Indonesia' }
const DELIVERY_LABELS = {
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

  // Rule 2: Success rate
  score += (method.successRate - 0.80) * 75

  // Rule 3: Popularity
  score += Math.max(0, (6 - method.popularityRank) * 2)

  // Rule 4: Order value
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
  if (ctx.deliveryType === 'same-day' && method.confirmationMinutes === 0)
    parts.push('perfect for same-day delivery')
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
```

**Commit:**
```bash
git add -A
git commit -m "feat: implement usePaymentFilter and useRecommendations hooks"
```

---

## Phase 3: Components (≈ 30 min)

### Task 3.0 — `Header.tsx`

Props: `{ market: Market }`

Layout: sticky top bar, dark background (slate-900).
- **Left:** shopping cart icon + "Kyori Grocery" brand name.
- **Center:** "Payment Advisor" subtitle.
- **Right:** `<CountryFlag market={market} />` showing active market.
- Height: 56px. Full width.

---

### Task 3.1 — `BadgeConfirmation.tsx`

Uses shadcn `Badge`. Props: `{ confirmationTime: ConfirmationTime; size?: 'sm' | 'md' }`

Color map:
- `instant` → green + "⚡ Instant"
- `2hr` → yellow + "⏱ ~2 hours"
- `24hr` → orange + "🕐 ~24 hours"
- `48hr` → red + "⏳ 2 days"
- `3day` → red + "📅 3 days"

---

### Task 3.2 — `CountryFlag.tsx`

Simple: `{ PH: '🇵🇭', TH: '🇹🇭', ID: '🇮🇩' }[market]` with market name label.

---

### Task 3.3 — `OrderContextPanel.tsx`

Props: `OrderContextPanelProps` from types.

Layout:
- Top row: market flag buttons (PH / TH / ID) using shadcn `ToggleGroup`
- Second row: delivery type (`same-day` / `express` / `standard` / `scheduled`) as `ToggleGroup`
- Third row: preset selector as `Tabs` or quick-select buttons
- Fourth row: order value slider (shadcn `Slider`) with market-appropriate range:
  - PH: 100--10,000 PHP
  - TH: 50--5,000 THB
  - ID: 10,000--2,000,000 IDR
  Display formatted value with `formatCurrency(value, market)` next to the slider.

On any change → call `onOrderContextChange({ ...orderContext, [field]: value })`

---

### Task 3.4 — `FilterPanel.tsx`

Props: `FilterPanelProps` from types.

Sections:
1. **Speed** — `ToggleGroup` single: All / Instant / Under 2hr / Under 24hr
2. **Requirements** — `ToggleGroup` single: All / No bank account / Phone only / Cash only
3. **Category** — multi-select checkboxes: e-wallet / bank-transfer / cash-otc / qr-code / card
4. **Search** — plain text input
5. **Results count** — "Showing X of Y methods"
6. **Clear all** button (disabled when no filters active)

---

### Task 3.5 — `RecommendationBanner.tsx`

Props: `{ result: RecommendationResult }`

- Green gradient card at top of main content
- Shows `result.explanation` as headline
- Lists top 3 `RecommendedMethod` as horizontal chips with name + reason tooltip
- Animate in/out with `motion` when `result.recommendations.length > 0`
- Collapse gracefully if no recommendations

---

### Task 3.6 — `PaymentMethodCard.tsx`

Props: `PaymentMethodCardProps` from types.

Structure (shadcn `Card`):
```
┌─────────────────────────────────────────┐
│ [icon] Name          [BadgeConfirmation] │  ← CardHeader
│ tagline              [category pill]     │
├─────────────────────────────────────────┤
│ ⚠️ WARNING BANNER (if slow + same-day)  │  ← amber bg
│ ✅ RECOMMENDED banner (if isRecommended) │  ← green bg
├─────────────────────────────────────────┤
│ flowDescription text                     │  ← CardContent
│                                          │
│ Prerequisites: [chip] [chip] [chip]      │
│                                          │
│ Limitations: [chip] [chip]               │
│                                          │
│ ────────────────────────────────────     │  ← Separator
│ ✓ Success: ████████░░ 94%               │
│ ⏳ Pay within: 24 hours                  │
│                                          │
│ [+ Compare]    [▼ Show more / ▲ Less]   │
└─────────────────────────────────────────┘
```

Expand/collapse: show prerequisites + limitations only when expanded (local `isExpanded` state).

Warning logic (delivery mismatch): if `orderContext.deliveryType === 'same-day'` and `method.confirmationMinutes > 120` → show amber warning.

High-value warning logic:
```
if (orderContext.orderValue > method.maxAmount * 0.8 && orderContext.orderValue <= method.maxAmount):
  show yellow banner: "Your order is near the maximum limit (MAX_AMOUNT CURRENCY)"

if (orderContext.orderValue > method.maxAmount):
  show red banner: "Your order exceeds the maximum limit for this method"
  + set incompatibleReason = "Order exceeds max limit" (if not already set)
```

Dimmed state: if `incompatibleReason` is present, the entire card renders at `opacity-50` with a red badge showing the reason. Compare button is hidden for incompatible cards.

Compare button (for compatible cards only): disabled if 3 already selected AND this method is not one of them. Max 3.

Motion: `whileHover={{ scale: 1.01 }}` + shadow transition.

---

### Task 3.7 — `PaymentMethodGrid.tsx`

Props: `PaymentMethodGridProps` from types.

- Props now accept `results: FilteredMethod[]` instead of `methods: PaymentMethod[]`
- Wraps cards in `AnimatePresence` (from `"motion/react"`) with `layout` prop for smooth reorder
- Each card gets `motion.div` with `initial={{ opacity: 0, y: 20 }}` / `animate={{ opacity: 1, y: 0 }}` / `exit={{ opacity: 0, scale: 0.95 }}`
- Compatible methods render at full opacity with normal card styling
- Incompatible methods render after a `--- Other available methods ---` section divider, at `opacity-50` (dimmed)
- Each incompatible card shows a small amber label with `fitReason` at the top (e.g., "Takes 24 hours to confirm")
- Renders `EmptyState` when `results.length === 0`
- Grid: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`

---

### Task 3.8 — `ComparisonDrawer.tsx`

Props: `ComparisonDrawerProps` from types.

Uses shadcn `Drawer` (bottom sheet on mobile, side panel on desktop via CSS).

Comparison table rows:
- Confirmation time
- Success rate (with visual bar)
- Bank account required?
- Smartphone required?
- Store visit required?
- Max transaction amount
- Expiration window
- Payment flow (truncated)

Each row: label in left col, one col per selected method. Color-code green/red.

---

### Task 3.9 — `CompareBar.tsx`

Props: `{ selectedCount: number; onOpen: () => void; onClear: () => void }`

Renders: sticky bottom bar (fixed, bottom-0, full width, z-50). Only visible when `selectedCount > 0`.

Content: "Comparing {N} methods" label + "View comparison" button + "Clear" button.

Motion: slides up from bottom with `AnimatePresence`.

**Commit:**
```bash
git add -A
git commit -m "feat: implement all UI components"
```

---

## Phase 4: App.tsx + Layout (≈ 15 min)

### Task 4.1 — Wire Everything in `App.tsx`

```tsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { PAYMENT_METHODS } from './data/paymentMethods'
import { DEFAULT_ORDER_CONTEXT, ORDER_CONTEXT_PRESETS } from './data/orderContexts'
import { usePaymentFilter } from './hooks/usePaymentFilter'
import { useRecommendations } from './hooks/useRecommendations'
import type { FilterState, OrderContext } from './types'
// ... component imports

const DEFAULT_FILTER: FilterState = {
  speed: 'all', convenience: 'all', categories: [], searchQuery: '',
}

export default function App() {
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER)
  const [orderContext, setOrderContext] = useState<OrderContext>(DEFAULT_ORDER_CONTEXT)
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // NOTE: usePaymentFilter now returns { results: FilteredMethod[], total }
  const { results, total } = usePaymentFilter(PAYMENT_METHODS, filterState, orderContext.market)
  // NOTE: useRecommendations gets ALL methods, not filtered — it filters by market internally
  const recommendations = useRecommendations(PAYMENT_METHODS, orderContext)

  // Derived state — memoized
  const recommendedIds = useMemo(
    () => new Set(recommendations.recommendations.map(r => r.method.id)),
    [recommendations]
  )
  const recommendationReasons = useMemo(
    () => new Map(recommendations.recommendations.map(r => [r.method.id, r.reason])),
    [recommendations]
  )

  // Clear comparison when market changes
  useEffect(() => {
    setSelectedForComparison([])
    setIsDrawerOpen(false)
  }, [orderContext.market])

  // Open drawer automatically when first method is selected for comparison
  useEffect(() => {
    if (selectedForComparison.length > 0) setIsDrawerOpen(true)
  }, [selectedForComparison])

  const toggleComparison = useCallback((id: string) => {
    setSelectedForComparison(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }, [])

  const comparisonMethods = PAYMENT_METHODS.filter(m => selectedForComparison.includes(m.id))

  // Count compatible methods for display
  const compatibleCount = results.filter(r => r.fitStatus === 'compatible').length

  return (
    <div className="min-h-screen bg-slate-50">
      <Header market={orderContext.market} />
      <OrderContextPanel
        orderContext={orderContext}
        onOrderContextChange={setOrderContext}
        presets={ORDER_CONTEXT_PRESETS}
      />
      <div className="flex max-w-screen-2xl mx-auto px-4 py-6 gap-6">
        {/* Sidebar */}
        <aside className="w-72 shrink-0">
          <FilterPanel
            filterState={filterState}
            onFilterChange={setFilterState}
            totalCount={total}
            filteredCount={compatibleCount}
          />
        </aside>
        {/* Main */}
        <main className="flex-1 min-w-0">
          {recommendations.recommendations.length > 0 && (
            <RecommendationBanner result={recommendations} />
          )}
          <p className="text-sm text-slate-500 mb-4">
            Showing {compatibleCount} of {total} payment methods
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
    </div>
  )
}
```

**Commit:**
```bash
git add -A
git commit -m "feat: wire App.tsx with all state, hooks, and layout"
```

---

## Phase 5: Polish + Animations (≈ 15 min)

### Task 5.1 — Card Hover Animations
- `motion.div` wrapper on each card: `whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}`
- `transition={{ type: 'spring', stiffness: 300, damping: 20 }}`

### Task 5.2 — Filter Transition
- Wrap `PaymentMethodGrid` children in `AnimatePresence mode="popLayout"`
- Use `layout` prop on each card's motion wrapper for smooth reflow

### Task 5.3 — Recommendation Banner Animation
- `motion.div` with `initial={{ opacity: 0, y: -10 }}` / `animate={{ opacity: 1, y: 0 }}`
- Wrap in `AnimatePresence` so it exits smoothly when no recommendations

### Task 5.4 — Mobile Responsive Fixes
- Sidebar: hidden on mobile (`hidden lg:block`), show as collapsible sheet
- Add a mobile "Filters" floating button that opens filter drawer
- Cards: `grid-cols-1` on mobile, `grid-cols-2` on md+

### Task 5.5 — Visual Polish
- Recommendation badge: pulsing green dot animation
- Success rate bar: `motion` width transition from 0 to actual %
- Warning banner: shake animation on render if delivery mismatch
- Empty state: friendly illustration + suggestion to clear filters

**Commit:**
```bash
git add -A
git commit -m "feat: add animations, microinteractions, and mobile responsive layout"
```

---

## Phase 6: README + Final Check (≈ 10 min)

### Task 6.1 — README.md

Sections:
1. **Overview** — what Kyori Grocery is and what this solves
2. **Getting Started** — `npm install` + `npm run dev`
3. **Tech Stack** — table of technologies
4. **Architecture** — brief description of hooks, components, data flow
5. **Requirements Status** — checklist of base + stretch goals completed
6. **Assumptions** — market-specific data, currency handling, mock data choices
7. **Demo Guide** — step-by-step reviewer walkthrough:
   - Start on Philippines / same-day → see GCash recommended
   - Switch to "No bank account" filter → cash + e-wallet only
   - Switch to Thailand → methods change
   - Add 2 methods to compare → drawer opens
   - Switch to standard delivery → recommendations change

### Task 6.2 — Production Build Check

```bash
npm run build
npm run preview
```

Verify: no TypeScript errors, no console errors, build succeeds.

**Commit:**
```bash
git add -A
git commit -m "docs: add README with demo guide and architecture overview"
```

---

## Acceptance Criteria

| Requirement | Verification |
|---|---|
| Req 1: 8-10 payment methods with rich info | Open app, count cards, expand one card |
| Req 1: Trade-offs obvious in 30 seconds | Check speed badges, flow description, warnings |
| Req 2: Speed filter works | Select "Instant only" → only e-wallets + QR codes + card remain |
| Req 2: Convenience filter works | Select "No bank account" → InstaPay + Card disappear |
| Req 2: Comparison mode | Select 2 methods → drawer opens with comparison table |
| Req 3: Recommendations update | Switch from standard to same-day → banner changes |
| Req 3: Market-aware | Switch to Thailand → TrueMoney/PromptPay recommended |
| Req 4: Animations | Filter changes → smooth card transitions |
| Req 4: Mobile | View on 375px width → usable, no overflow |

---

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| shadcn init fails with Tailwind v4 | High | Use `npx shadcn@canary` if needed; fall back to manual Radix install |
| Motion `"motion/react"` import path wrong | Medium | Check package docs; fallback: `import { motion } from "motion"` |
| Drawer component needs `DialogTitle` for a11y | Low | Add `VisuallyHidden` title |
| Cards overflow on mobile | Medium | Test at 375px; use `overflow-hidden` on card |
| AnimatePresence causes layout shift | Medium | Use `mode="popLayout"` and `layout` prop |

---

## Git Commit Strategy

```
chore: scaffold vite + react 19 + typescript
chore: setup tailwind v4, shadcn/ui, motion
feat: add types and interfaces
feat: add payment method mock data (11 methods)
feat: add order context presets
feat: implement usePaymentFilter hook
feat: implement useRecommendations hook
feat: add BadgeConfirmation component
feat: add CountryFlag component
feat: add OrderContextPanel component
feat: add FilterPanel component
feat: add RecommendationBanner component
feat: add PaymentMethodCard component
feat: add PaymentMethodGrid with AnimatePresence
feat: add ComparisonDrawer component
feat: add EmptyState component
feat: wire App.tsx layout and state
feat: add card hover animations
feat: add filter transition animations
feat: add mobile responsive layout
docs: add README with demo guide
```
