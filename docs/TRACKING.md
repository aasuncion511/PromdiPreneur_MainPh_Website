# Conversion tracking

`src/components/promdi/Tracking.astro`. Analytics is **consent-first**: nothing loads until the visitor clicks Allow, and nothing at all happens unless an ID is configured.

| Provider                        | Env                                           | Notes                                                                                     |
| ------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| GA4                             | `PUBLIC_GA4_ID=G-…`                           | Google signals and ad personalization off. Mark `lead_form_submit_success` as a key event |
| Umami (handoff v1.1 preference) | `PUBLIC_UMAMI_WEBSITE_ID`, `PUBLIC_UMAMI_SRC` | Cookieless. Can run alongside or instead of GA4                                           |

Allowed event properties: `placement`, `link_destination`, `form`, `error_type`. Nothing else is sent: no names, emails or messages (verified by the E2E suite).

## Event dictionary

| Event                          | Fires when                                                                       | Source of truth for the real outcome |
| ------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------ |
| `outbound_shop_click`          | Any link to shop.promdipreneur.com                                               | GHL store orders                     |
| `outbound_cleaning_kits_click` | Any link to kits.promdipreneur.com                                               | GHL orders                           |
| `outbound_payroll_click`       | Payroll page or live demo link                                                   | GHL orders / licences                |
| `outbound_portfolio_click`     | International portfolio link                                                     | n/a                                  |
| `case_study_click`             | "Read the case study"                                                            | n/a                                  |
| `contact_messenger_click`      | Messenger / Facebook link                                                        | Facebook inbox                       |
| `contact_email_click`          | mailto admin@                                                                    | Inbox                                |
| `lead_form_start`              | First focus in the contact form                                                  | n/a                                  |
| `lead_form_submit_success`     | **Only** after the server confirms the inquiry was stored and the email was sent | Inquiry store / GHL                  |
| `lead_form_submit_error`       | Server or network failure (error code only)                                      | n/a                                  |
| `ebook_cta_click`              | "Get Free Guide" links                                                           | n/a                                  |
| `ebook_view`                   | Ebook page viewed (once per session)                                             | n/a                                  |
| `ebook_form_success`           | Ebook request accepted, only after GHL confirmed the upsert                      | GHL contact + tag `LM \| Ebook`      |
| `ebook_form_error`             | Ebook request failed (error code only)                                           | n/a                                  |
| `ebook_download_click`         | "Download Your Ebook" on the thank-you page                                      | n/a                                  |
| `product_interest_click`       | "Ask about early access" (in-development product)                                | Inquiry                              |
| `diagnostic_booking_click`     | Discovery calendar button (once verified)                                        | GHL calendar bookings                |

Clicks are not conversions. Purchases, bookings and leads are counted in GHL.

## Attribution

On landing, the site stores `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` and `utm_term` for the session (first touch), plus the landing page and referrer origin.

- These are attached to inquiries and guide requests.
- They are appended to shop, kits, payroll and booking links **only where the destination doesn't already have that key**.
- `fbclid` and other parameters are not forwarded unless Allan approves.
- Facebook ad links keep working exactly as before, because the funnels themselves are untouched.
