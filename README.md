# Kyori Grocery -- Payment Method Advisor

An interactive checkout payment advisor for Kyori Grocery, helping customers across Indonesia, Thailand, and the Philippines choose the best payment option for their order.

**Challenge URL:** https://yuno-challenge.vercel.app/challenge/cmm2f4ert0004sptu87unheu6

## Getting Started

```bash
npm install
npm run dev       # http://localhost:5173
```

Other commands:

```bash
npm run build     # Production build
npm run lint      # ESLint
npm test          # Vitest (watch mode)
npm run coverage  # Test coverage report
```

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| Vite | 7.x | Build tool |
| React | 19.x | UI framework |
| TypeScript | 5.9+ | Type safety |
| Tailwind CSS | v4 | Styling (CSS-first configuration, no `tailwind.config` file) |
| shadcn/ui | latest | Component library (Radix UI primitives) |
| Motion | 12.x | Animations (`motion/react`) |
| lucide-react | latest | Icons |
| Vitest | 3.x | Unit testing |
| Sonner | 2.x | Toast notifications |

## Architecture

- All data is static/mock -- no backend. `src/data/paymentMethods.ts` contains 11 payment methods across 3 markets (Philippines, Thailand, Indonesia).
- **`usePaymentFilter` hook:** applies a market hard-filter, then scores each method for fit against the active filters (speed, convenience, category, search). Methods are classified as compatible or incompatible with a human-readable reason, and sorted so compatible methods appear first.
- **`useRecommendations` hook:** scores ALL market-eligible methods 0--100 using delivery type fit, success rate, market popularity, and order value compatibility. Returns the top 3 as dynamic recommendations.
- State lives in `App.tsx` and flows down via props. No external state management library.
- Filtering shows *why* methods don't fit (dimmed cards with a specific reason) rather than hiding them entirely, so the customer always sees the full picture.

## Requirements Status

### Base Requirements

- [x] **Req 1: Rich Payment Method Display** -- 11 payment methods shown with confirmation time badge, flow description, prerequisites, limitations, success rate bar, transaction limits, and expand/collapse details.
- [x] **Req 2: Interactive Filtering & Comparison** -- Speed filter, convenience filter, category filter, and search. Incompatible methods are shown dimmed with a reason. Side-by-side comparison drawer for up to 3 methods.

### Stretch Goals

- [x] **Req 3: Smart Recommendations** -- Scoring algorithm considers delivery type fit (same-day delivery penalizes slow methods heavily), success rate, market popularity, and order value vs. transaction limits. The recommendation banner updates dynamically when order context changes.
- [x] **Req 4: Visual Design & Microinteractions** -- Spring animations on card hover, AnimatePresence filter transitions, animated success rate bars, slide-up CompareBar, fade-in RecommendationBanner. Responsive on mobile (375px+).

## Assumptions

- Payment method data (limits, success rates, flow descriptions) is realistic but mocked, sourced from public documentation and approximations.
- "Popularity rank" is relative to each market, not global.
- BDO Direct Transfer was added as the "slow batch bank transfer" to demonstrate the full confirmation time spectrum (instant to 3 business days).
- Order value slider ranges are representative of typical grocery order sizes in each market.
- "Customer preferences" (returning customer history) was out of scope per the "if available" qualifier in Req 3.
- Currency amounts for Visa/Mastercard are not market-specific; they are shown in the local currency equivalent for the selected market.

## Demo Guide

A step-by-step walkthrough for reviewers:

1. **Start.** Open the app. The default context is Manila (PH) / Same-day delivery / ~500 PHP order. You will see five payment methods: GCash, InstaPay, 7-Eleven Cliqq, BDO Direct Transfer, and Visa/Mastercard. The recommendation banner at the top suggests GCash as the top pick for same-day delivery.

2. **Explore a card.** Click "Show more" on any payment method card to expand its details: prerequisites, limitations, and the animated success rate bar.

3. **Speed filter.** In the Filters sidebar, select "Instant" under Payment speed. Watch InstaPay, 7-Eleven Cliqq, and BDO Direct Transfer slide down to the "Other available methods" section, each with a reason like "Takes 2 hours to confirm" or "Takes up to 24 hours."

4. **Convenience filter.** Select "No bank account needed." InstaPay and BDO Direct Transfer (which require bank accounts) dim with a reason like "Requires a bank account." Visa/Mastercard also dims since it requires a card linked to a bank.

5. **Change delivery type.** In the Order Context bar, switch from "Same-day" to "Standard." Watch the RecommendationBanner update -- slower methods like BDO Direct Transfer now rank higher since confirmation time is less critical.

6. **Switch market.** Click "TH" (Thailand). The entire method list changes to TrueMoney Wallet, PromptPay, 7-Eleven (TrueMoney), and Visa/Mastercard. The recommendation banner updates accordingly, suggesting PromptPay or TrueMoney Wallet.

7. **Compare methods.** Select 2--3 methods by clicking "Compare" on each card. The CompareBar slides up from the bottom. Click "View comparison" to open the side-by-side comparison drawer showing all attributes.

8. **High-value order.** Switch market back to PH and move the order value slider toward the maximum (~10,000 PHP). Watch recommendation scores shift -- GCash (max 100,000 PHP) stays recommended while 7-Eleven Cliqq (max 30,000 PHP) still qualifies but methods with lower limits are deprioritized.

9. **Mobile.** Resize the browser to 375px wide. The sidebar collapses and is replaced by a floating "Filters" button at the bottom-right. The layout stacks into a single column.
