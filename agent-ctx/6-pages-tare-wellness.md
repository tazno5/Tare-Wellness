# Task: 6 Next.js client pages for Tare Wellness gift card platform

## Scope
Created 6 production-ready Next.js client component pages under `src/app/`:

1. `src/app/recipient-details/page.tsx` — carousel form (one slide per recipient),
   reads `recipients` from Zustand store, 5-step stepper (Recipient active),
   Live Card Preview, dark Gift Summary with delete buttons, Suspense wrapper,
   hero `/hero-giftcards.png`, bottom "Gift Card" (blush) + "Continue to Review"
   (disabled until all confirmed) buttons.
2. `src/app/cart-review/page.tsx` — "Everything looks beautiful" review page,
   reads cart + recipients from search params, 5-step stepper (Review active),
   Selected Package / Recipient Details (2×2) / Personal Message cards on left,
   Order Summary / Trust Badges / How It Reaches Them (dark) on right,
   email preview section with Live Preview Mode pill, hero
   `/hero-cart-review.png`, Suspense wrapper.
3. `src/app/checkout/page.tsx` — "One Last Step!" page, 5-step stepper
   (Checkout active), Card/Transfer tabs (no Apple Pay), required cardholder /
   card number / expiry / CVV, required billing name / email / street,
   sticky Gift Summary on right, "Complete Purchase" submit button posts to
   `/order-confirmation` via `router.push`, hero `/hero-checkout.png`,
   Suspense wrapper.
4. `src/app/order-confirmation/page.tsx` — "Your gift is on its way ❤️",
   expands cart into individual receipt cards (one per gift card instance)
   with "Card X of Y" badge, recipient info, seeded-hash redemption code
   (XXXX-XXXX-XXXX-XXXX, deterministic per recipient) with copy button,
   no-expiration note, dark Order Total card, 4-step Gift Journey timeline,
   3-FAQ accordion, hero `/hero-confirmation.png`, Suspense wrapper.
5. `src/app/redeem/page.tsx` — "You've received a gift of care!", uses
   `setRedemption` from store, mono-font auto-uppercase code input with
   checkmark validation, morphing CTA (Redeem Gift button → after submit
   becomes "Book a Session" link → `/book-session`), 10px (`mt-[10px]`) gap
   between input and button, success banner, 4 Your Options cards, 4-step
   Path to Wellness, dark Safe & Supportive trust banner, hero
   `/hero-redeem.png`. Text colors are maroon (`text-maroon`) — gradient is
   lighter (#FCE4EC → #F10897).
6. `src/app/book-session/page.tsx` — "Let's find the right session for you!",
   uses `setBooking` (useEffect writes booking details on selection change),
   live calendar (current month, past dates disabled, chevron month nav,
   today indicator dot), 4 session-type cards (Individual 50min / Couples
   60min / Family 75min / Wellness 30min, with coverage badges), 3 time-slot
   groups (Morning / Afternoon / Evening), sticky dark Booking Summary
   (service title, formatted date, time range, therapist, gift card applied
   -₦25,000, total ₦0), "Confirm Booking" link → `/booking-confirmation`,
   FAQ accordion, hero `/hero-book-session.png`. Text colors maroon.

## Conventions applied (all 6 files)
- `"use client"` directive at top.
- Gradient locked-in via `document.body.style.setProperty` in both `useMemo`
  (render-time) and `useEffect` (with cleanup) — `--page-gradient-from: #FCE4EC`
  → `--page-gradient-to: #F10897`.
- Hero images use `next/image` with `fill` + `hero-shadow` + `animate-float-slow`
  classes, plus a soft white bloom behind them.
- All form inputs use `required` attributes; required labels are marked with a
  magenta asterisk.
- Wrapped in `<Suspense>` where `useSearchParams` is used.
- Stepper shared inline component (5 steps, configurable `active` index).
- Maroon text via Tailwind utility `text-maroon` (defined in `globals.css` as
  `#3d002e`); brand dark `#4E0030` for primary buttons; `#F10897` for accent.
- shadcn components used: `Select`, `Switch`, `Tabs`, `Accordion`.

## Lint / build verification
- `bun run lint` → ✅ 0 errors, 0 warnings.
- Dev server compiled all 6 pages successfully, all return HTTP 200:
  - `GET /recipient-details 200`
  - `GET /cart-review 200`
  - `GET /checkout 200`
  - `GET /order-confirmation 200`
  - `GET /redeem 200`
  - `GET /book-session 200`
- All hero images and headline strings confirmed present in rendered HTML.

## Notes for follow-up agents
- The Zustand store at `src/lib/store.ts` already exports `CartItem`,
  `RecipientData`, `BookingDetails`, `RedemptionState` types and the
  `useStore` hook with all setters (`setCart`, `setRecipients`,
  `confirmRecipient`, `deleteRecipient`, `setRedemption`, `setBooking`).
- `useToast` is at `@/hooks/use-toast` (radix-toast based) and is rendered via
  `<Toaster />` in `src/app/layout.tsx`.
- The `Stepper` component is duplicated inline across pages (recipient-details,
  cart-review, checkout) — they all share the same visual design but use
  different `active` indices. Could be extracted to a shared component if
  desired.
- `CARD_LOOKUP` is duplicated per-page (each with slightly different fields
  needed locally). Could be lifted to a shared `@/lib/cards.ts` if desired.
- `recipient-details` reads `recipients` from the store (the gift-cards page
  populates them via `useStore.setState({ recipients })` before navigating).
  The other flow pages read cart/recipient info from URL search params so
  users can refresh without losing state, with fallback to the store.
- The redemption code in `order-confirmation` is generated via a seeded
  hash function (xmur3-style mixing of uid + cardId + index). The same seed
  always produces the same code, so the receipt is stable across refreshes.
- `book-session` writes booking details to the Zustand store inside a
  `useEffect` (per spec). This is a legitimate external-store update, not a
  local setState, so it does not trip the `react-hooks/set-state-in-effect`
  rule.
