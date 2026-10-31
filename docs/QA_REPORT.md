# QA report

Run on 30 Oct 2026 against the production build, served by `scripts/local-server.mjs`. That server runs the real inquiry and guide pipelines, with file storage, a captured outbox and a captured GHL in place of the external services. Raw results are in `scripts/out/qa-results.json`.

| Check                                                                               | Result                                                                                        |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `astro check` (TypeScript)                                                          | 0 errors, 0 warnings                                                                          |
| ESLint / Prettier                                                                   | clean                                                                                         |
| Unit tests (`npm run test:api`): inquiry pipeline, ebook endpoint, GHL adapter, CSV | **22/22**                                                                                     |
| Browser E2E (`npm run qa`, Chromium)                                                | **68/68**                                                                                     |
| Brand/release guard (`npm run check:brand`), production and preview builds          | pass                                                                                          |
| axe-core WCAG 2.2 AA + best practice, all 13 pages, desktop and mobile              | 0 violations                                                                                  |
| Lighthouse mobile: `/`, `/resources/free-ebook`, `/discovery`, `/services`          | Performance 99 · Accessibility 100 · Best Practices 100 · SEO 100. LCP 1.6–1.7 s, CLS ≤ 0.052 |
| Lighthouse desktop, same pages                                                      | 100 / 100 / 100 / 100                                                                         |

Lighthouse ran on localhost with gzip enabled (lab data, not field data).

## E2E coverage

- **Pages and links:**
  - All 12 routes return 200, with one H1, a title, a description (≤170 characters) and a canonical URL each.
  - Every internal link target returns 200.
  - Unknown URLs get a 404 page.
- **Navigation:**
  - Services, Our Work, Products, Resources (dropdown with Free Business Guide) and About.
  - The dropdown opens with the keyboard and Escape closes it.
  - The mobile menu has aria-expanded, focus management and Escape.
  - The first Tab reaches "Skip to content".
  - On a 390×844 screen, the H1 and an "Ask a Question" CTA are visible without scrolling.
- **Live funnels untouched:** links go to the exact shop, kits, payroll and payroll-demo URLs and open in a new tab with `noopener`. UTMs are forwarded without overwriting the destination's own parameters, and `fbclid` is not forwarded. The legacy flyer and the international booking widget are not linked.
- **Analytics:**
  - With an ID configured, nothing loads before Allow.
  - After Allow, separate events fire for shop, kits, payroll and case-study clicks, each with a placement.
  - No PII appears in any payload.
- **Contact form:**
  - Empty submit shows a focused error summary.
  - A valid submit goes to `/thank-you` only after the record is stored and the email is accepted. The email goes to admin@ with reply-to set to the visitor and the right subject. UTMs are stored and the CRM sync is recorded.
  - When the mail provider fails, the page says "not sent", offers Messenger and email, and the record is kept.
  - When the form isn't configured, it refuses and stores nothing.
  - Spam handling: the honeypot discards silently, too-fast submissions get a 422, and the 6th submission per hour gets a 429.
- **Free guide (inactive):**
  - The page states that nothing is collected yet, and every field and button is disabled.
  - The form asks for first name, email, business type and an optional business name.
  - There is no PDF or download link anywhere.
  - The cover is labelled as a placeholder.
  - The API returns `503 inactive` and nothing reaches GHL.
  - The thank-you page says nothing has been sent.
  - Resources features the guide as "coming soon".
  - When the API is switched to active (test mode), it upserts the GHL contact with the `lead-magnet:free-guide` tag and the business type.
- **Responsive:** no horizontal scroll on any page at 320, 360, 390, 768, 1024, 1280, 1440 or 1920px.

## v3 / ebook update: what was added to the suite

- **Navigation:** the v3 labels (Home, What We Do, Our Work, Digital Store, Resources, About). The header CTA "Book a Discovery Session" goes to `/discovery`. Resources lists the Free Ebook.
- **Homepage:** the v3 hero copy, and the ebook card with the real cover (image loads), exact title and "Get Free Guide".
- **Ebook page:**
  - addendum H1, exact title, real cover, all 7 stages by name, and the trust note
  - the form fields; the marketing box is optional and unticked
  - while inactive: every control disabled, and no PDF or download link anywhere
  - the API returns 503 and nothing reaches GHL
  - the thank-you page says nothing was sent
- **Ebook API when activated (test mode):** exactly one GHL upsert, a single tag `LM | Ebook`, the business type, and `marketing_consent=no` by default.
- **Redirects:** `/free-guide` and `/our-work` return relative 301s, never to the live domain.
- **404 page:** returns 404 and every link is labelled.

## Bugs found and fixed during QA

1. **Footer overflowed at exactly 768px** (email link in a 12-column grid). The footer now uses 2 columns until 1024px.
2. **Logo link accessible name** didn't match its visible text. Fixed.
3. **Heading order** on Our Work went from H1 to H3. Card headings are now H2 on that page.
4. **Redirects pointed at the live site.** Astro's static redirects resolved to `https://promdipreneur.com/…`, which would have sent preview visitors to the current live site. They are now relative Netlify `_redirects` rules.
5. **Invalid markup on Services:** a link sat inside a `<dl>` (axe "definition-list"). Moved outside the list.
6. **Empty button on the 404 page** after the CTA labels changed (caught by `astro check`). Fixed, and a 404 check was added to E2E.
7. **Demo content leak:** an unused AstroWind "star us on GitHub" widget was still being compiled into the CSS. Deleted.

## Not proven here (needs Allan's accounts)

| Item                             | How to prove it                                                          |
| -------------------------------- | ------------------------------------------------------------------------ |
| A real email reaching admin@     | `DEPLOYMENT.md` § B on the Netlify preview                               |
| A real GHL contact being created | Set `GHL_*`, then submit a test inquiry                                  |
| GA4/Umami receiving data         | Set an ID, then check Realtime/DebugView                                 |
| Facebook/m.me destinations       | facebook.com is blocked from the build environment. Allan taps the links |
