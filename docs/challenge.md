# The Payment Method Maze: Build Kyori Grocery's Checkout Optimizer

**Challenge URL:** https://yuno-challenge.vercel.app/challenge/cmm2f4ert0004sptu87unheu6

---

## The Situation

Kyori Grocery, a rapidly growing online supermarket operating across Indonesia, Thailand, and the Philippines, is hemorrhaging conversions at checkout. Their Head of Payments, Anika, reached out to Yuno with an urgent problem:

> "We're offering 12 different payment methods across our three markets, and our checkout completion rate is only 58%. Customers are abandoning carts because they can't figure out which payment method to use, or they pick one that takes 3 days to confirm, and then they cancel their perishable grocery order. We need to fix this fast—we're losing $400K/month in abandoned transactions."

After analyzing Kyori's transaction data, the Yuno team discovered the core issue: customers don't understand the payment methods available to them. Terms like "e-wallet," "bank transfer," "QR code," and "cash voucher" mean different things in different countries. A customer in Manila might not know that GCash is an instant payment, while a bank transfer via Instapay takes 2 hours. A customer in Bangkok might not realize that cash payment at 7-Eleven via TrueMoney requires them to physically visit a store within 24 hours.

The result? Customers either:
- Choose a slow payment method and cancel when their groceries don't arrive fast enough
- Get confused and abandon the checkout entirely
- Pick a payment method that doesn't work for their situation (e.g., selecting bank transfer when they don't have a bank account)

Yuno has been tasked with building a checkout assistant interface that helps Kyori's customers make informed payment decisions in real-time.

---

## Domain Background

### Payment Method Types

- **E-wallets / Digital Wallets:** Mobile apps that store money digitally (e.g., GCash in Philippines, TrueMoney in Thailand, GoPay in Indonesia). Typically instant confirmation, high success rates.
- **Bank Transfers:** Direct transfers from a customer's bank account. Can be:
  - Real-time (Instapay in Philippines, PromptPay in Thailand): confirm within minutes to hours
  - Batch processing (standard transfers): can take 1-3 business days
- **Cash-based / Over-the-Counter (OTC):** Customer receives a code/reference and pays cash at a physical location (7-Eleven, Alfamart, drugstores). Confirmation happens when they physically pay, usually within 24-48 hours.
- **QR Code Payments:** Customer scans a QR code with their banking or wallet app. Usually instant confirmation.
- **Credit/Debit Cards:** Traditional card payments. Instant authorization but may have lower acceptance rates in some markets.

### Key Attributes That Affect Customer Choice

- **Confirmation time:** How long until the merchant knows the payment succeeded?
- **Expiration window:** How long does the customer have to complete payment?
- **Prerequisites:** Does the method require a bank account? A smartphone? Physical store visit?
- **Typical success rate:** Some methods have higher failure rates due to insufficient balances, network issues, etc.
- **User familiarity:** In each market, certain payment methods are dominant

### Why This Matters for Groceries

Kyori sells perishable goods. If a customer chooses a payment method that takes 3 days to confirm, the order can't be fulfilled on time. Kyori needs to guide customers toward methods that match their delivery expectations while still offering choice.

---

## Your Mission

Build an interactive checkout payment method selector that helps Kyori Grocery customers choose the best payment option for their situation.

The interface should:
- Present all available payment methods with rich, educational information (not just logos and names)
- Allow customers to filter and compare payment methods based on their priorities (speed, convenience, no bank account needed, etc.)
- Provide smart recommendations based on order context (e.g., same-day delivery orders should highlight instant payment methods; high-value orders might warn about daily limits on certain e-wallets)

This should feel like a **decision-support tool**, not just a list of payment buttons. Think of it as a "payment method advisor" embedded in the checkout flow.

---

## Functional Requirements

### Requirement 1: Rich Payment Method Display *(Base)*

Display all available payment methods with educational, contextual information that helps customers make informed decisions. Each method should show:

- Name and visual identity (placeholders/mock logos are fine)
- Confirmation time (instant, 2 hours, 24 hours, etc.)
- Payment flow summary (e.g., "Scan QR code in your banking app" or "Pay cash at any 7-Eleven within 24 hours")
- Key requirements/prerequisites (e.g., "Requires GCash app" or "No bank account needed")
- Any limitations (e.g., "Maximum 50,000 PHP per transaction" or "Must complete payment within 48 hours")

**Acceptance Criteria:** A reviewer should be able to open your interface and immediately understand the trade-offs between at least 6-8 distinct payment methods across the three markets.

---

### Requirement 2: Interactive Filtering & Comparison *(Base)*

Provide interactive controls that let customers filter payment methods based on their priorities and constraints:

- **Speed filter:** Show only instant methods, or methods that confirm within X hours
- **Convenience filter:** "I have a bank account" vs. "I prefer cash" vs. "I only want to use my phone"
- **Order context awareness:** If the order is tagged as "same-day delivery" or "express," the interface should highlight compatible payment methods (or deprioritize slow ones)

The filtering should be visual and intuitive—not just hiding/showing methods, but clearly communicating why a method is or isn't a good fit.

**Bonus points:** Include a side-by-side comparison mode where users can select 2-3 methods and see their attributes compared in a table or card layout.

**Acceptance Criteria:** A reviewer should be able to apply at least 2-3 filters and see the interface respond intelligently.

---

### Requirement 3: Smart Recommendations *(Stretch Goal)*

Implement a recommendation system that suggests the best 2-3 payment methods based on:

- **Order details:** Delivery speed, order value, customer location (market/country)
- **Payment method performance data:** Some methods have higher success rates or lower abandonment in certain contexts
- **Customer preferences (if available):** Returning customers might have a preferred method

Display the recommendations prominently with a clear explanation: *"Based on your same-day delivery order, we recommend these instant payment methods."*

**Acceptance Criteria:** The interface should dynamically adjust recommendations when the reviewer changes order parameters.

---

### Requirement 4: Visual Design & Microinteractions *(Stretch Goal)*

Elevate the UX with polished visual design and thoughtful microinteractions:

- Smooth transitions when filtering or comparing methods
- Hover states or expandable details for each method
- Visual indicators (icons, badges, color coding) to quickly communicate speed, requirements, etc.
- Responsive design that works on mobile

**Acceptance Criteria:** The interface should feel production-ready with attention to spacing, typography, color, and interaction feedback. It should work seamlessly on both desktop and a mobile viewport.

---

## Test Data

Your solution should work with realistic payment method data across Indonesia, Thailand, and the Philippines. Mock data is expected.

### Payment Methods to Include (at least 8-10)

| Category | Examples |
|---|---|
| E-wallets (2-3) | GCash (PH), TrueMoney (TH), GoPay (ID) |
| Bank transfers (2-3) | InstaPay (PH), PromptPay (TH) – mix of real-time and batch |
| Cash/OTC (1-2) | 7-Eleven (PH/TH), Alfamart (ID) |
| QR code (1-2) | QRIS (ID), PromptPay QR (TH) |
| Cards (1-2) | Visa/Mastercard |

### Attributes per Method

- Country/market availability
- Confirmation time (instant, 30min, 2hr, 24hr, 48hr, 3 days)
- Expiration window
- Prerequisites (app required, bank account required, smartphone required, etc.)
- Transaction limits (min/max amounts)
- Short description of the payment flow

### Sample Order Contexts

- Same-day delivery, standard delivery, scheduled delivery
- Low-value (~500 PHP / ~200 THB / ~100k IDR) vs. high-value (~5000 PHP / ~2000 THB / ~1M IDR)
- Different markets: Manila, Bangkok, Jakarta

---

## Deliverables

1. A working, interactive interface (web-based, accessible via browser)
2. Source code with clear structure and comments
3. A README explaining:
   - How to run your solution locally
   - Key design decisions (tech stack, architecture, UX approach)
   - Which requirements were completed (base vs. stretch goals)
   - Assumptions made about payment method data or order context
4. A brief demo guide explaining how a reviewer should interact with the solution

---

## What "Done" Looks Like

- [ ] Open the interface in a browser
- [ ] See 8-10 payment methods with rich, educational details
- [ ] Apply filters (e.g., "instant only" or "no bank account needed") and see the interface respond intelligently
- [ ] Change order context (e.g., toggle between same-day and standard delivery) and see the interface adapt
- [ ] Understand the trade-offs between methods within 30 seconds of using the interface
- [ ] Experience smooth, polished interactions (stretch goal 4)

---

## Notes & Tips

- **Use your judgment:** The scenario is intentionally open-ended. Make assumptions where needed and document them.
- **AI tools are your friend:** This challenge is scoped for 2 hours with AI assistance. Use code generation, component libraries, and AI-generated test data freely.
- **Show your frontend chops:** This is a frontend-focused challenge. Impress with UX thinking, visual polish, and interaction design—not backend complexity.
- **No backend required:** Static/mock data is expected.
- **Focus on user empathy:** The real challenge is communication design. How do you make complex payment method differences understandable and actionable for a grocery shopper in a hurry?
