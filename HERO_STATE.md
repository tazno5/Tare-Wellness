# LOCKED-IN SPEC — Tare Wellness Hero Image Format

This is the canonical, locked-in standard for ALL hero images on the Tare Wellness site.
Any new page with a hero illustration MUST follow this exact format. Do not deviate.

## File Location
- Hero images live at `public/hero-<page-name>.png`
- Format: PNG with alpha transparency (RGBA), 1648×1648 recommended
- Source artwork must have transparent background (no solid black bg)

## DOM Structure (EXACT) — Standard Variant

```tsx
{/* Hero image — floats bare, no card wrapper */}
<motion.div
  initial={{ opacity: 0, scale: 0.94, y: 24 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
  className="relative mt-6 aspect-[534/500] w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[360px]"
>
  <Image
    src="/hero-<page-name>.png"
    alt="<descriptive alt text>"
    fill
    priority
    sizes="(max-width: 640px) 70vw, (max-width: 1024px) 320px, 360px"
    className="relative animate-float-slow object-contain transition-all duration-500 ease-out hover:scale-[1.02] hover:drop-shadow-[0_0_30px_rgba(219,39,119,0.35)]"
  />
</motion.div>
```

## Hard Rules

1. **NO CARD DIV BEHIND THE IMAGE.**
   Never wrap the hero `<Image>` in a `motion.div` or `div` that has any of:
   `bg-white`, `bg-[#...]`, `bg-black`, `rounded-3xl`, `rounded-[3rem]`,
   `shadow-*`, `border`, `p-6`, or any other background/card/border/shadow class.
   The wrapper className MUST contain ONLY: `relative`, `mt-*`, `aspect-*`,
   `w-full`, `max-w-*`, and (optionally) `mx-auto` or responsive `order-*`.

2. **NO `hero-shadow` FILTER.**
   The old `.hero-shadow` CSS class applies a `drop-shadow()` filter that creates
   a halo around the image's alpha shape and looks like a card. Do NOT add
   `hero-shadow` to any hero `<Image>` className.

3. **NO `mix-blend-screen`.**
   The image must render with its native alpha channel. Do not add
   `mix-blend-screen` or any blend mode to the hero image. Source assets must
   be authored with proper transparency (no black bg to "knock out").

4. **REQUIRED className on `<Image>`:**
   `relative animate-float-slow object-contain transition-all duration-500 ease-out
    hover:scale-[1.02] hover:drop-shadow-[0_0_30px_rgba(219,39,119,0.35)]`

5. **The illustration MUST float directly on the page background (`#FFF5EE` cream)**
   with zero framing box, zero border, zero card background, zero offset shadow.

## Page-Background Constraint

The site-wide background is cream `#FFF5EE` (set in `src/app/layout.tsx` and
`src/app/globals.css` via `--page-gradient-from` / `--page-gradient-to`).
Do NOT change this on a per-page basis. Hero images float bare on this cream bg.

## Enhanced Variant — Home & Gift Cards ONLY

The home page (`src/components/site/Hero.tsx`) and gift-cards page
(`src/app/gift-cards/page.tsx`) use an enhanced variant with:
- A decorative **watercolor morphing layer** (`z-[1]`) BEHIND the image — animated
  pastel blobs that only show through the image's transparent pixels.
- An additional `hero-card-glow` class on the `<Image>` (pulsing pink drop-shadow,
  2.5s loop) — defined in `src/app/globals.css` as `.hero-card-glow`.
- `z-[3]` on the `<Image>` so it stacks ABOVE the watercolor layer.

This enhanced variant is the "clean standard" — only use it on hero images that
sit on a plain section background (not inside a form card or content panel).

```tsx
{/* Enhanced variant — home + gift-cards only */}
<motion.div
  initial={{ opacity: 0, scale: 0.94, y: 24 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
  className="relative mt-10 aspect-[534/500] w-full max-w-md sm:max-w-lg lg:max-w-xl"
>
  {/* Watercolor liquid morphing background layer (z-1) */}
  <div aria-hidden className="absolute inset-0 z-[1] overflow-hidden rounded-[3rem]">
    <div className="absolute inset-0 animate-watercolor-morph">
      <div className="absolute left-[10%] top-[15%] h-[50%] w-[50%] rounded-full bg-[#C7B2E2]/40 blur-3xl animate-blob-1" />
      <div className="absolute right-[5%] top-[20%] h-[45%] w-[45%] rounded-full bg-[#B5E1C3]/35 blur-3xl animate-blob-2" />
      <div className="absolute left-[20%] bottom-[10%] h-[40%] w-[40%] rounded-full bg-[#BCE1F0]/35 blur-3xl animate-blob-3" />
      <div className="absolute right-[15%] bottom-[15%] h-[35%] w-[35%] rounded-full bg-[#E8B6D5]/30 blur-3xl animate-blob-4" />
    </div>
  </div>
  <Image
    src="/hero-<page-name>.png"
    alt="<descriptive alt text>"
    fill
    priority
    sizes="..."
    className="hero-card-glow relative z-[3] animate-float-slow object-contain transition-all duration-500 ease-out hover:scale-[1.02] hover:drop-shadow-[0_0_30px_rgba(219,39,119,0.35)]"
  />
</motion.div>
```

## Exceptions / Auth Split Variant — Login Page (and any future auth pages)

When a hero image appears on a page that ALSO contains an auth form (e.g., `/login`),
embed the hero image INSIDE the auth card as the LEFT column of a 2-column split
layout. On desktop the hero sits left + form sits right; on mobile they stack
(hero on top, form below) inside the same card.

**Key invariant:** The hero `<Image>`'s *immediate wrapper* (`<div>` around it)
still follows all the Hard Rules — no `bg-white`, no `shadow-*`, no `border`,
no card classes. The CARD class (`rounded-3xl bg-white shadow-*`) goes on the
OUTER container that wraps BOTH the hero column and the form column. The hero
image's column wrapper may have `bg-[#FFF5EE]` (the page background color) so
the hero's transparent pixels still blend with the cream page background even
though it's inside the card visually.

```tsx
{/* Auth split card — hero + form embedded in the same card */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
  className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-[0_15px_50px_rgba(78, 0, 48, 0.15)] md:grid md:grid-cols-2"
>
  {/* LEFT: Hero image column (inside the card, immediate wrapper has no card styling) */}
  <motion.div
    initial={{ opacity: 0, scale: 0.94, y: 24 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    className="relative flex items-center justify-center bg-[#FFF5EE] p-6 sm:p-10 lg:p-12"
  >
    <div className="relative aspect-square w-full max-w-[180px] sm:max-w-[240px] lg:max-w-[300px]">
      <Image
        src="/hero-login.png"
        alt="Man wearing black t-shirt holding TARE Be Well gift card"
        fill
        priority
        sizes="(max-width: 768px) 60vw, 300px"
        className="relative animate-float-slow object-contain transition-all duration-500 ease-out hover:scale-[1.02] hover:drop-shadow-[0_0_30px_rgba(219,39,119,0.35)]"
      />
    </div>
  </motion.div>

  {/* RIGHT: Auth form column */}
  <div className="p-6 sm:p-8 lg:p-10">
    {/* form fields go here */}
  </div>
</motion.div>
```

**Note on rule #1 ("no card div behind the image"):** This variant technically
places the hero inside the card boundary, BUT the immediate wrapper around the
`<Image>` (the inner `<div>` with `aspect-square`) still has no card styling —
only `relative`, `aspect-square`, `w-full`, `max-w-*`. The cream `bg-[#FFF5EE]`
on the hero column wrapper is the same as the page background, so visually
the hero's transparent pixels blend seamlessly with the page background even
though the column itself is part of the white card. This is the only allowed
deviation from the strict "hero must float on page background" rule, and it
only applies to auth-flow pages where the hero + form must read as one unit.

## Accessibility

- `alt` text MUST be descriptive and specific (e.g., "Couple sharing pizza while
  filling out TARE gift card recipient details"). Never use generic alt like
  "illustration" or "hero image".
- `priority` MUST be set on the hero `<Image>` (LCP optimization).
- The pulsing `hero-card-glow` animation is automatically disabled by an existing
  `@media (prefers-reduced-motion: reduce)` rule in `globals.css` — do not
  re-enable it for reduced-motion users.

## Constraint Checklist (verify before merging any new page)

- [ ] Hero `<Image>` is NOT wrapped in a card/div with `bg-*`, `shadow-*`, `border`, or `rounded-*` styling
- [ ] No `.hero-shadow` class anywhere on the hero `<Image>`
- [ ] No `mix-blend-screen` on the hero `<Image>` (source asset must have alpha)
- [ ] Hero `<Image>` className includes: `relative animate-float-slow object-contain transition-all duration-500 ease-out hover:scale-[1.02] hover:drop-shadow-[0_0_30px_rgba(219,39,119,0.35)]`
- [ ] `aspect-[534/500]` (or `aspect-square`) is set on the wrapper for responsive scaling
- [ ] `priority` is set on the `<Image>`
- [ ] `alt` text is descriptive and specific
- [ ] On home + gift-cards only: `hero-card-glow relative z-[3]` added, watercolor morphing layer present
- [ ] On auth pages (login, etc.): hero image is embedded in the auth card as the LEFT column of a 2-col split (mobile stacks vertically). The hero's *immediate wrapper* still has no card styling — only `relative aspect-square w-full max-w-*`. The outer card class (`rounded-3xl bg-white shadow-*`) goes on the container that wraps both the hero column and form column.

## Pages Currently Using Each Variant

| Variant | Pages |
|---|---|
| **Standard (bare floating)** | `/recipient-details`, `/redeem`, `/book-session`, `/booking-confirmation`, `/cart-review`, `/checkout`, `/order-confirmation`, `/how-it-works`, `/faq`, `/contact-us`, `/privacy-policy`, `/terms-and-conditions` |
| **Enhanced (watercolor + glow)** | `/` (home, via `src/components/site/Hero.tsx`), `/gift-cards` |
| **Auth Split (hero embedded in auth card, 2-col on desktop)** | `/login` |

When adding a new page, default to the **Standard** variant unless the page has
specific reasons to use the Enhanced or Auth Split variant.
