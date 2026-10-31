# PromdiPreneur: main website (promdipreneur.com)

The Philippine-facing website for **PromdiPreneur, Business Systems & Automation Implementer**. FROM DISKARTE TO SYSTEMS.

Built on [AstroWind](https://github.com/onwidget/astrowind) (Astro 5 + Tailwind, MIT). All demo content has been removed. The site is static and fast, with two small Netlify Functions for lead capture. It links to the existing GHL product funnels without changing them.

> **Status: preview for approval. Not deployed to promdipreneur.com.** See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
>
> **Finale phase (on hold):** the "Ask PromdiPreneur" AI assistant (OpenAI) is planned as the last build, after launch. See [`docs/FINALE_AI_ASSISTANT.md`](docs/FINALE_AI_ASSISTANT.md).

## Pages

| Route                                           | Purpose                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/`                                             | v3 sections A–I: hero, problems, what we build, how we work, real work, Digital Store, free ebook, founder, Discovery CTA |
| `/services` (nav "What We Do")                  | PromdiPreneur Systems: 4 capability groupings, sequence, FAQ (no prices)                                                  |
| `/work` (nav "Our Work")                        | Verified projects with exact status; links to portfolio case studies                                                      |
| `/products` (nav "Digital Store")               | Product registry; links to the live store and funnels                                                                     |
| `/resources`, `/resources/free-ebook`           | Resources hub; landing page for _The Business Opening Checklist PH_ (**submission inactive** until activated)             |
| `/discovery`                                    | Book a Discovery Session (request form until the calendar URL is verified)                                                |
| `/about`, `/contact`                            | Founder; inquiry form + Messenger + email                                                                                 |
| `/thank-you`, `/resources/free-ebook/thank-you` | Confirmations (noindex, honest states)                                                                                    |
| `/privacy`, `/terms`, `/404`                    |                                                                                                                           |

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
docs/                    BRAND_STANDARD, EBOOK, GHL_INTEGRATION, TRACKING, DEPLOYMENT, HOSTING_OPTIONS,
                         PARITY_AND_INTEGRATION_MAP, QA_REPORT, PENDING, FINALE_AI_ASSISTANT
```

Adding a product means adding a record in `src/data/catalog.ts`, plus a destination in `src/data/brand.ts` if needed. No page redesign is required.

## Commands

Needs Node 22.18+.

```bash
npm install
npm run dev              # http://localhost:4321
npm run build            # production build (+ robots.txt, _headers)
npm run build:preview    # noindex + preview ribbon
npm run test:api         # 22 unit tests (inquiry, ebook, GHL, CSV)
npm run check:pdf-links  # list + test every link inside the ebook PDF
npm run check            # astro check + eslint + prettier
npm run check:brand      # retired terms / prices / demo content / dead PDF links / indexing
npm run serve:local      # serve dist + real pipelines on :4321 (MAIL_MODE, GUIDE_MODE)
npm run qa               # 67-check browser suite (build with PUBLIC_GA4_ID=G-TEST123456 first)
```

Environment variables are listed in [`.env.example`](.env.example). `PUBLIC_*` values are baked into the pages; everything else is a Netlify secret.

## Rules for contributors

- Follow [`docs/BRAND_STANDARD.md`](docs/BRAND_STANDARD.md). Do not reintroduce retired naming or prices.
- Only claim what is verified. Use status labels (Built, Designed and supported, In development).
- Never fake success, delivery or downloads. Inactive features say so plainly.
- Never modify GHL funnels, workflows, DNS or the live site without Allan's approval.

## Common maintenance

- **Add a product:** add a record to `PRODUCTS` in `src/data/catalog.ts` (and a destination in `src/data/brand.ts` if it links somewhere new).
- **Add a project:** add a record to `WORK` in `src/data/catalog.ts` with its honest status.
- **Change a link** (shop, funnels, booking): edit `DESTINATIONS` in `src/data/brand.ts`. Every button follows.
- **Replace the ebook PDF:** overwrite `public/resources/promdipreneur-business-opening-checklist-ph.pdf` and redeploy. Run `npm run check:pdf-links`.
- **Replace the ebook cover:** overwrite `src/assets/images/ebook/business-opening-checklist-ph-cover.webp`.
- **Hero copy:** `src/pages/index.astro`, section A. **Services copy:** `src/data/services.ts`.
- **Turn on the ebook or booking:** `FEATURES` in `src/data/brand.ts`, following `docs/EBOOK.md` and `docs/GHL_INTEGRATION.md`.
