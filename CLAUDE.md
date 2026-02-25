# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kyori Grocery – Payment Method Maze**: A frontend-only interactive checkout payment advisor for an online supermarket operating in Indonesia (Jakarta), Thailand (Bangkok), and the Philippines (Manila). No backend required—all data is mocked/static.

The goal is a decision-support tool that helps grocery shoppers choose the right payment method based on order context (delivery speed, order value, market), with filtering, comparison, and smart recommendations.

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind v4** + **shadcn/ui** (Radix primitives, CSS variables theme in `src/index.css`)
- **Vitest** + **@testing-library/react** for unit tests
- **Sonner** for toast notifications
- Import alias: `@/` → `src/`

## Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Production build
npm run lint      # Run ESLint
npm test          # Run Vitest in watch mode
npm run coverage  # Run tests with coverage report
```

Add shadcn components as needed:
```bash
npx shadcn@latest add <component>   # e.g. button, card, badge, dialog
```

## Architecture

### Domain Model

**PaymentMethod** attributes:
- `id`, `name`, `category` — `ewallet | bank_transfer | cash_otc | qr_code | card`
- `countries` — `PH | TH | ID`
- `confirmationTime` — `instant | 30min | 2hr | 24hr | 48hr | 3days`
- `expirationWindow` — how long the customer has to complete payment
- `prerequisites` — `app_required | bank_account | smartphone | physical_store`
- `transactionLimits` — `{ min, max, currency }`
- `paymentFlowSummary` — short human-readable description
- `successRate` — percentage (for recommendation scoring)

**OrderContext** (drives recommendations and filter highlights):
- `market` — `PH | TH | ID`
- `deliveryType` — `same_day | standard | scheduled`
- `orderValue` — numeric + currency

### Key Modules

**Data layer** (`src/data/`):
- `paymentMethods.ts` — static mock data for 8-10+ payment methods across all three markets
- `orderContexts.ts` — sample order contexts for the context switcher

**Filtering engine** (`src/services/filterService.ts`):
- Takes active filters (speed, prerequisite, compatibility) and order context
- Returns filtered + sorted list with a `fit` score or reason per method

**Recommendation engine** (`src/services/recommendationService.ts`):
- Scores methods based on order context (delivery type, value, market)
- Returns top 2-3 methods with a human-readable explanation string

**UI components** (`src/components/`):
- `PaymentMethodCard` — rich card with expandable details, badges for speed/requirements
- `FilterPanel` — speed filter, convenience filter, order context switcher
- `RecommendationBanner` — prominent top section showing recommended methods with reasoning
- `ComparisonDrawer` — side-by-side table for 2-3 selected methods (stretch)

### UX Principles

- Filtering should **communicate why** a method is or isn't a good fit—not just hide/show items
- Recommendations display with plain-language reasoning: *"Based on your same-day delivery, we recommend instant methods"*
- Order context switcher (delivery type + market) drives real-time UI changes
- Must be responsive (mobile + desktop)

## Payment Methods to Cover (minimum 8-10)

| Category | Methods |
|---|---|
| E-wallets | GCash (PH), TrueMoney (TH), GoPay (ID) |
| Bank transfers | InstaPay (PH, real-time), PromptPay (TH, real-time), BRI Transfer (ID, batch 1-3 days) |
| Cash/OTC | 7-Eleven via TrueMoney (TH/PH), Alfamart (ID) |
| QR Code | QRIS (ID), PromptPay QR (TH) |
| Cards | Visa/Mastercard (all markets) |

## Challenge Requirements

- **Req 1 (Base):** Rich payment method display with all attributes visible
- **Req 2 (Base):** Interactive filtering + optional comparison mode
- **Req 3 (Stretch):** Smart recommendations that update when order context changes
- **Req 4 (Stretch):** Polished microinteractions, smooth transitions, responsive design
