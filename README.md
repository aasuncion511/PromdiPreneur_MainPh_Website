# PromdiPreneur: main website (promdipreneur.com)

The Philippine-facing website for **PromdiPreneur, Business Systems & Automation Implementer**. FROM DISKARTE TO SYSTEMS.

Built on [AstroWind](https://github.com/onwidget/astrowind) (Astro 5 + Tailwind, MIT). All demo content has been removed. The site is static and fast, with two small Netlify Functions for lead capture. It links to the existing GHL product funnels without changing them.

> **Status: preview for approval. Not deployed to promdipreneur.com.** See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Pages

| Route                                 | Purpose                                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/`                                   | Hero (problem → outcome), problems, how we help + PromdiPreneur Systems, featured tools, real work, free guide, about, CTA |
| `/services`                           | Five solutions, customer journey, Review → Build → Improve, FAQ (no prices)                                                |
| `/our-work`                           | Verified projects with honest status labels; links to portfolio case studies                                               |
| `/products`                           | Product hub (registry-driven): Payroll, Cleaning Kits, Digital Shop, Car Rental OS (in development)                        |
| `/about`                              | Founder and principles                                                                                                     |
| `/resources`, `/free-guide`           | Resources hub; free ebook landing page (**inactive** until assets are approved)                                            |
| `/contact`                            | Inquiry form + Messenger/email + Discovery booking (coming soon)                                                           |
| `/thank-you`, `/free-guide/thank-you` | Confirmations (noindex, honest states)                                                                                     |
| `/privacy`, `/terms`, `/404`          |                                                                                                                            |

## Where things live

```
src/data/brand.ts        brand facts, CTAs, destination registry (every outbound URL), launch switches (FEATURES)
src/data/catalog.ts      product registry + verified work
src/data/services.ts     problems, solutions, phases, FAQ
src/components/promdi/   Header, Footer, Section, ProductCard, WorkCard, EbookCover, GuideForm, InquiryForm,
                         TrackedLink (tracked + UTM-forwarding links), Tracking (consent-first analytics), CtaBand
server/                  inquiry pipeline, guide pipeline, GHL adapter, CSV export (shared by functions + tests)
netlify/functions/       /api/inquiry, /api/guide-request, /api/inquiries.csv
scripts/                 postbuild (robots/_headers), check-brand, local QA server, e2e suite
docs/                    BRAND_STANDARD, EBOOK, GHL_INTEGRATION, TRACKING, DEPLOYMENT, QA_REPORT, PENDING
```

Adding a product means adding a record in `src/data/catalog.ts`, plus a destination in `src/data/brand.ts` if needed. No page redesign is required.

## Commands

Needs Node 22.18+.

```bash
npm install
npm run dev              # http://localhost:4321
npm run build            # production build (+ robots.txt, _headers)
npm run build:preview    # noindex + preview ribbon
npm run test:api         # 21 unit tests (inquiry, guide, GHL, CSV)
npm run check            # astro check + eslint + prettier
npm run check:brand      # retired terms / prices / demo content / fake downloads / indexing
npm run serve:local      # serve dist + real pipelines on :4321 (MAIL_MODE, GUIDE_MODE)
npm run qa               # 62-check browser suite (build with PUBLIC_GA4_ID=G-TEST123456 first)
```

Environment variables are listed in [`.env.example`](.env.example). `PUBLIC_*` values are baked into the pages; everything else is a Netlify secret.

## Rules for contributors

- Follow [`docs/BRAND_STANDARD.md`](docs/BRAND_STANDARD.md). Do not reintroduce retired naming or prices.
- Only claim what is verified. Use status labels (Built, Designed and supported, In development).
- Never fake success, delivery or downloads. Inactive features say so plainly.
- Never modify GHL funnels, workflows, DNS or the live site without Allan's approval.
