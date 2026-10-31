# Homepage v2 (front revision)

Source: "HANDOFF — promdipreneur.com Homepage v2 (Front Revision)", 2026-11-01. Built on branch
`feature/homepage-v2` in 5 steps; Allan approved each step before the next.

## Allan's decisions (2026-11-01)

| #   | Decision                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Prices are allowed on the hub, **only** in the homepage Pricing section, sourced from `src/data/pricing.ts` |
| 2A  | New nav (Solutions · Results · Pricing · Store + Free Discovery Call) on every page                         |
| 3   | CTA wording site-wide: "Book a Free Discovery Call" (still goes to `/discovery`)                            |
| 4A  | Cost box keeps the Metro Manila wage figure and says "sa Metro Manila" in the headline                      |
| —   | Industry tiles → `/discovery`, tracked as `industry_tile_click` with `placement=industry_<slug>`            |
| —   | MinBizCon photos approved for use                                                                           |
| —   | Founder quote reworded: more formal, still casual                                                           |
| —   | Final CTA keeps a small "Not ready to book? Send a question →" link to `/contact`                           |

## Logic kept

- Routes, forms, `/api/*`, GHL, Resend, noindex/preview, privacy/terms: unchanged.
- Every outbound link still goes through `TrackedLink` (portfolio, payroll, kits, shop, Facebook, Messenger, email,
  plus the new `linkedin` destination). The ebook CTA keeps `data-track="ebook_cta_click"`.
- About and the Free Ebook are no longer in the nav; they stay reachable from the footer and the DIY strip.

## Brand guard

`npm run check:brand` fails on retired terms (BASA…), AstroWind demo content, and any ₱ amount outside
`src/data/pricing.ts` (source) or outside `<section id="pricing">` (build).

## Images (all Allan's own, blurred versions only)

`src/assets/images/profile/allan-minbizcon-800.webp`, `src/assets/images/hub/`: `fresh-start-crew-1512`,
`fresh-start-steam-clean`, `payroll-dashboard-demo`, `payroll-menu`, `minbizcon-desk-1100` (**cropped to remove the
old standee that shows retired BASA branding and "15+ years"**), `minbizcon-pass-blurred`, `minbizcon-partner-banner`,
`minbizcon-team-blurred`.

## Before launch

- Re-check the ₱755/day (Sept 2026) Metro Manila wage and contribution figures in `src/data/pricing.ts`.
- "See full inclusions →" is left out until a packages page exists.
- Discovery calendar link still pending from the GHL setup (`/discovery` shows the request form until then).
