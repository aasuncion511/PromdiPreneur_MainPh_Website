# GoHighLevel integration

GHL stays the customer operating system (CRM, calendars, store, workflows). The website does not become a second CRM. **Nothing in this repo modifies existing GHL funnels, stores, workflows, pixels or calendars.** The site links to them and, once configured, creates or updates contacts through the API.

## What the website does with GHL

| Journey           | Website side                                                                                                       | GHL side                                                                               | Status                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Product purchase  | Links to shop / kits / payroll (UTMs forwarded, destination params preserved)                                      | Existing funnels, checkout (SaligPay), pixels, delivery: **unchanged**                 | Live links                                              |
| Ask a question    | `/api/inquiry` stores the inquiry, emails admin@, then best-effort **upserts the contact** (tag `website-inquiry`) | Optional workflow on tag `website-inquiry` (e.g. internal notification, pipeline card) | Ready. Needs `RESEND_*` (required) + `GHL_*` (optional) |
| Free ebook        | `/api/guide-request` upserts the contact with tag `LM \| Ebook`                                                    | New workflow delivers the ebook + optional nurture (`docs/EBOOK.md`)                   | **Inactive** until approved                             |
| Discovery booking | `/discovery` shows a request form                                                                                  | GHL calendar for PH discovery calls                                                    | **Pending**: calendar URL not supplied                  |

Why a server endpoint instead of an embedded GHL form: the website keeps its own fast, accessible, on-brand form with an honest success/failure contract. The GHL token stays on the server. Attribution is attached cleanly. If GHL is down, the inquiry is still stored and emailed. The GHL sync result is recorded per inquiry (`crmStatus`).

## Setup (Allan, in GHL)

1. **Settings → Private Integrations → Create.** Scope: `contacts.write` (and `contacts.readonly`). Copy the token into Netlify as `GHL_PRIVATE_TOKEN`.
2. **Location ID:** Settings → Business Profile (or the sub-account URL) → `GHL_LOCATION_ID`.
3. **Custom fields:** inventory the existing ones first and reuse them where they match. Create only the missing ones, then map them:

```json
GHL_CUSTOM_FIELDS = {
  "business_type": "<field id>",
  "lead_magnet_name": "<field id>",
  "marketing_consent": "<field id>",
  "consent_record": "<field id>",
  "utm_content": "<field id>",
  "referrer": "<field id>",
  "utm_source": "<field id>",
  "utm_medium": "<field id>",
  "utm_campaign": "<field id>",
  "landing_page": "<field id>"
}
```

Unmapped fields are skipped. The code never guesses field IDs.

4. **Tags used:** `website-inquiry` and `LM | Ebook` (reuse an equivalent tag if one already exists). Create new workflows triggered by these tags. Don't attach them to existing product workflows.
5. **Test:** submit a test inquiry on the deploy preview, then check that the contact appears with the tag and source "promdipreneur.com contact form".

## Discovery booking (to activate)

1. Create or choose the GHL calendar for PH "Business Systems Discovery" calls. The international portfolio's booking widget is deliberately **not** reused.
2. Put its URL in `DESTINATIONS.discoveryBooking.url` (`src/data/brand.ts`). Set `status: 'verified'` and `FEATURES.bookingLive = true`.
3. `/contact#discovery` then shows a "Book a Business Systems Discovery call" button, tracked as `diagnostic_booking_click`, with UTMs forwarded.

## Data protection

- Tokens live only in Netlify environment variables. `PUBLIC_*` variables never hold secrets.
- No personal data in URLs or analytics. Raw IPs are never stored (salted hash only).
- The CSV export (`/api/inquiries.csv`) requires `Authorization: Bearer $EXPORT_TOKEN`. It is disabled when the token is unset.

## Transactional email standard (v3 §8.3)

For the ebook delivery email:

- From name: `Allan | PromdiPreneur`
- From email: `admin@agency.promdipreneur.com`
- Reply-To: `admin@promdipreneur.com`

This depends on the sending domain being verified in GHL. Downloading the ebook does **not** create an opportunity. Opportunities follow the existing pipeline rules.
