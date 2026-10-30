# Free Business Guide: landing page, capture and delivery spec

**Status: built and INACTIVE.** The page, cover component, form, GHL capture endpoint and thank-you page all exist. Submissions and delivery stay off until the three items in _Activation_ are approved. The site never hosts a download link and never claims the guide was sent.

## What is live on the site now

| Piece            | Where                                                                                 | Current behavior                                                                      |
| ---------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Landing page     | `/free-guide` (`src/pages/free-guide.astro`)                                          | Working title, who it's for, what it covers (high level), "coming soon"               |
| Homepage section | `#free-guide` on `/`                                                                  | "Not ready to talk yet? Start with our free guide." → `/free-guide`                   |
| Navigation       | Resources → **Free Business Guide** (desktop dropdown + mobile menu + footer)         | Links to `/free-guide`                                                                |
| Resources page   | `/resources`                                                                          | Features the guide, marked coming soon                                                |
| Cover            | `src/components/promdi/EbookCover.astro`                                              | Labelled **"Cover placeholder"**; pass `src` to show the approved artwork             |
| Form             | `src/components/promdi/GuideForm.astro`                                               | Fields shown but **disabled**; says "Nothing is collected or sent from this form yet" |
| Endpoint         | `POST /api/guide-request` (`netlify/functions/guide-request.mts` → `server/guide.ts`) | Returns `503 inactive`                                                                |
| Thank-you        | `/free-guide/thank-you` (noindex)                                                     | While inactive: "The free guide isn't available yet. Nothing has been sent."          |

## Capture fields (handoff v1.1 §15, short form, no questionnaire)

| Field                                                                                        | Required                                    | Sent to GHL as                                                                       |
| -------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| First name                                                                                   | yes                                         | `firstName`                                                                          |
| Email                                                                                        | yes                                         | `email` (GHL de-duplicates by email, so a repeat request updates one contact)        |
| Type of business                                                                             | yes, one of 11 options in `server/guide.ts` | custom field `business_type`                                                         |
| Business name                                                                                | no                                          | `companyName`                                                                        |
| Consent: "Email me the guide and a few practical follow-up tips. I can unsubscribe anytime." | yes                                         | custom field `email_permission` = `free-guide-v1 <ISO timestamp>`                    |
| Attribution                                                                                  | automatic                                   | `utm_source`, `utm_medium`, `utm_campaign`, `landing_page` custom fields (if mapped) |
| Tag                                                                                          | automatic                                   | `lead-magnet:free-guide`                                                             |

Email permission does **not** imply SMS, call or WhatsApp permission. The site records the consent wording version and timestamp.

## Delivery workflow (built in GHL by Allan; the site only creates or updates the contact)

```
Website form ─▶ /api/guide-request ─▶ GHL contact upsert + tag lead-magnet:free-guide
                                          │
                       GHL workflow "Free Guide — Delivery" (trigger: tag added)
                                          │
   Email 1 (immediate): deliver the guide (GHL-hosted file link) + soft CTA "Ask Us About Your Business"
   Wait 2–3 days ── Email 2: one practical systems idea           CTA: Check my business
   Wait 3–4 days ── Email 3: where businesses leak (inquiry, quote, booking, retention)  CTA: Find my biggest bottleneck
   Later        ── Email 4: a real, verified PromdiPreneur system example              CTA: Ask Us About Your Business
   Exit: contact books a call / sends an inquiry / gets tag website-inquiry → leave this nurture (no duplicate sequences)
```

- Host the PDF in GHL Media (or Google Drive "anyone with the link"). The link only goes out by email, after the form is submitted.
- Sender: the verified promdipreneur.com sender in GHL. Every email has an unsubscribe link.
- **Do not edit existing GHL workflows** for the shop, payroll or kits. Create this one as new.

## Activation (all three required)

1. **Final PDF** approved and uploaded to GHL Media.
2. **Cover artwork** approved. Save it as `src/assets/images/brand/free-guide-cover.webp` and pass it to `<EbookCover src={...} />` on `/`, `/free-guide` and `/resources`. Replace the working title and the "What it covers" bullets with the final contents.
3. **GHL delivery workflow** built and tested with a test contact (Email 1 arrives, and the link opens the right PDF).

Then:

- Set `EBOOK_ACTIVE=true`, `GHL_PRIVATE_TOKEN`, `GHL_LOCATION_ID` and `GHL_CUSTOM_FIELDS` in Netlify.
- Set `FEATURES.ebookLive = true` in `src/data/brand.ts`. This enables the form and switches the thank-you copy to "Check your email".
- Deploy a preview. Submit one real request and confirm: GHL contact + tag, Email 1 received, thank-you page shown, `ebook_request` analytics event.
- Only then publish to production.

**Rollback:** set `EBOOK_ACTIVE=false`. The endpoint refuses immediately, without a redeploy. Set `FEATURES.ebookLive=false` to restore the inactive page.
