# Deployment checklist and rollback

**Rule:** promdipreneur.com, its DNS, the GHL funnels (shop, payroll, kits) and the portfolio are not touched until Allan approves. This repo deploys to a _new_ Netlify site first.

## A. Preview (no production impact)

- [ ] Netlify → Add new site → Import `aasuncion511/astrowind_promdi_website`, branch `feature/promdipreneur-site-v3`. Build settings come from `netlify.toml`.
- [ ] The branch deploy URL (`*.netlify.app`) is noindex: preview ribbon, robots Disallow and X-Robots-Tag.
- [ ] Allan reviews every page on a phone and a desktop.

## B. Make capture live (on the preview)

- [ ] Resend: add the domain `promdipreneur.com` and add its DNS records. These are **new** SPF/DKIM records; existing records are untouched. Wait for "Verified".
- [ ] Netlify env vars: `RESEND_API_KEY`, `INQUIRY_NOTIFY_FROM`, `INQUIRY_NOTIFY_TO`, `IP_HASH_SALT`, `EXPORT_TOKEN`. Optionally add `GHL_PRIVATE_TOKEN`, `GHL_LOCATION_ID` and `GHL_CUSTOM_FIELDS` (see `GHL_INTEGRATION.md`).
- [ ] Redeploy. Send one real inquiry and check that:
  - you land on `/thank-you`
  - the email arrives at admin@
  - the GHL contact has the `website-inquiry` tag (if GHL is configured)
  - `curl -H "Authorization: Bearer $EXPORT_TOKEN" https://<preview>/api/inquiries.csv` lists the inquiry
- [ ] Failure test: set an invalid `RESEND_API_KEY` and redeploy. The form must say "not sent" and show the fallbacks. Restore the key.
- [ ] Analytics (optional): set `PUBLIC_GA4_ID` and/or `PUBLIC_UMAMI_*`. Click Allow, click each product link, and check Realtime/DebugView.
- [ ] Free guide stays **inactive** (`EBOOK_ACTIVE` unset) until `EBOOK.md` → Activation is complete.

## C. Pre-launch content checks

- [ ] Approve the case studies (Fresh Start, Payroll, MinBizCon, Digital Store, Cleaning Kits, Car Rental OS as "in development").
- [ ] Confirm `m.me/Promdipreneur` opens the page chat, then switch `DESTINATIONS.messenger.url`.
- [ ] Privacy Policy reviewed.
- [ ] `npm run test:api && npm run build && npm run check:brand && npm run check` all pass.

## D. Go live (only after "approved for launch")

1. **Screenshot the current DNS records** for `promdipreneur.com` and `www`. That screenshot is the rollback.
2. Set the new Netlify site's production branch to `feature/promdipreneur-site-v3` (or merge to `main`). The production build has no preview ribbon and is indexable.
3. Point only the apex `promdipreneur.com` and `www` at the new site:
   - If the current site is on Netlify, move the custom domain from the old site to the new one.
   - Otherwise, change only those two DNS records.
   - **Never edit `shop`, `payroll`, `kits`, `portfolio` or the MX/email records.**
4. Within 10 minutes, check:
   - [ ] HTTPS works.
   - [ ] View-source shows `index,follow`.
   - [ ] `/robots.txt` allows crawling and `/sitemap-index.xml` loads.
   - [ ] Shop, kits, payroll and portfolio open exactly as before. Do a checkout test up to the payment page without paying.
   - [ ] One real inquiry goes through.
   - [ ] Facebook Sharing Debugger → Scrape Again.
   - [ ] Search Console → request indexing.

## Rollback (one step)

- **Bad deploy:** Netlify → Deploys → the previous good deploy → **Publish deploy** (instant).
- **Bad cutover:** move the custom domain back to the old Netlify site, or restore the two DNS records from the screenshot.
- **Guide problem:** set `EBOOK_ACTIVE=false`. The endpoint refuses immediately.

Rolling back loses no inquiries: they are stored in Netlify Blobs and already in the inbox.
