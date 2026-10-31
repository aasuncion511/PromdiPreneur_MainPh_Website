# Free ebook: The Business Opening Checklist PH

Sources: Master Handoff v3 §8 and the Final Ebook Addendum (31 Oct 2026).

**Status: integrated with the real cover and title. Submission and delivery stay INACTIVE** until the activation gates below are met. The site never shows a fake download and never claims a delivery that didn't happen.

## Asset status

| Asset                               | Status                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Title, subtitle, author, brand line | **Done.** Exact text in `src/data/brand.ts` → `EBOOK`                                                                                                                                                                                                                                                                                                                                            |
| Cover                               | **Done.** The supplied cover, unaltered: `src/assets/images/ebook/business-opening-checklist-ph-cover.webp` (888×1286). Social card: `og-business-opening-checklist.png`                                                                                                                                                                                                                         |
| Final PDF                           | **Not in the repo yet.** Found in Allan's Drive as `The_Business_Opening_Checklist_PH_Designed.pdf` (801,835 bytes, modified 30 Oct 2026). It could not be transferred into the build environment through the Drive connector (size). **Allan: add it to the repo at `public/resources/promdipreneur-business-opening-checklist-ph.pdf`** (GitHub → Add file → Upload), or attach it in the chat |
| PDF link/QR check                   | Blocked until the PDF is in the repo. Then run `npm run check:pdf-links`. Expected destinations to confirm: `https://promdipreneur.com/`, `https://shop.promdipreneur.com/` and the Facebook page. QR targets: pass them as extra arguments                                                                                                                                                      |
| Regulatory source review            | **Approval gate.** PDF page 4 says the legal/regulatory references were not independently re-validated in the design update; references were checked on 4 Oct 2026. Allan approves before the ebook is announced. Marketing must not call it "compliance-verified"                                                                                                                               |

## What's on the site

| Where                                                                    | What                                                                                                                                                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/resources/free-ebook`                                                  | Addendum §3 copy (eyebrow, H1, intro, 4 benefits, form, support text, trust note, secondary CTA), the real cover, the 7 stages, "Also inside", who it's for, author line                         |
| `/resources/free-ebook/thank-you` (noindex)                              | Live: "Your free guide is on its way. Please check your email." + spam hint + **Download Your Ebook** shown only after a confirmed submission in this browser. Inactive: "Nothing has been sent" |
| Homepage `#free-ebook`                                                   | Resource card: title, "109 practical checks…", **Get Free Guide**                                                                                                                                |
| Resources page, nav (Resources → Free Ebook), footer, products page note | All link to `/resources/free-ebook`                                                                                                                                                              |
| Old preview paths                                                        | `/free-guide` and `/free-guide/thank-you` 301 to the new routes (relative `_redirects`, never to the live domain)                                                                                |

There is deliberately no unconditional download button anywhere (Addendum §4).

## Capture and GHL mechanics

```
Form (First name, Email, Business type, optional marketing tick)
  → POST /api/guide-request  (inactive → 503 until EBOOK_ACTIVE=true)
  → validate, honeypot, 5/hour/IP rate limit, double-submit guard in the browser
  → GHL contacts/upsert (dedupe by email)     ── fails? visitor sees "not sent" + email fallback
      tag: LM | Ebook (one tag only)
      fields: business_type, lead_magnet_name, utm_source/medium/campaign/content, landing_page, referrer,
              marketing_consent (yes|no), consent_record ("ebook-form-v1 | marketing=… | ISO time")
  → { ok: true } → /resources/free-ebook/thank-you
  → GHL workflow (built by Allan, NEW — no existing workflow edited):
      Trigger: tag "LM | Ebook" added · Allow re-entry: OFF (one delivery per contact)
      1. Email (transactional, immediate): download link = https://promdipreneur.com/resources/promdipreneur-business-opening-checklist-ph.pdf
         From "Allan | PromdiPreneur" <admin@agency.promdipreneur.com>, Reply-To admin@promdipreneur.com
      2. If/Else marketing_consent = yes → optional educational sequence (2–3 emails) ending in a Discovery invitation
         else → end
      No opportunity is created for a download. Opportunities follow the existing pipeline rules (qualified / booked Discovery).
```

- **Consent:** asking for the guide is the request for fulfilment, covered by the processing notice and the privacy link. Ongoing marketing needs the separate, unticked, optional box.
- **Unsubscribe:** GHL adds the unsubscribe link and suppresses unsubscribed contacts.
- **Hosting:** the PDF ships with the site (`public/resources/`). That gives a stable, owner-controlled URL at no extra cost. It is a public URL: the form is lead capture before convenient delivery, not access control.
- **Updating the PDF:** replace the file with the same name and redeploy. For a breaking content change, use a versioned file name and update the GHL email.

## Tracking (consent-first, once each)

| Event                  | When                                          |
| ---------------------- | --------------------------------------------- |
| `ebook_view`           | Ebook page viewed (once per session)          |
| `ebook_cta_click`      | Any "Get Free Guide" link                     |
| `ebook_form_success`   | Only after the server confirms the GHL upsert |
| `ebook_form_error`     | Server or network failure (error code only)   |
| `ebook_download_click` | "Download Your Ebook" on the thank-you page   |

The site does not fire Meta Pixel events. If GHL forms or pages carry the pixel, conversions stay counted there (no double-firing).

## Activation (all required, in order)

1. PDF added at `public/resources/promdipreneur-business-opening-checklist-ph.pdf`. Then run `npm run check:pdf-links` and fix or flag any broken destinations.
2. Allan approves the regulatory-reference publishing review (Addendum §6).
3. GHL: Private Integration token, location ID and custom field IDs set (`docs/GHL_INTEGRATION.md`). The workflow above is built, with the sending domain verified for `agency.promdipreneur.com`.
4. Netlify env: `EBOOK_ACTIVE=true`. Code: `FEATURES.ebookLive = true` in `src/data/brand.ts`. **The build fails if the PDF is missing.**
5. On the deploy preview, with a test contact:
   - one GHL contact with the tag
   - exactly one delivery email
   - the link opens the PDF on a phone
   - a second submit sends no second email
   - unsubscribe works
6. Delete the test contact. Allan approves the production switch.

**Rollback:** `EBOOK_ACTIVE=false` stops requests immediately without a redeploy.
