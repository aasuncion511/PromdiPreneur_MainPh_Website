# HANDOFF FOR CLAUDE (claude.ai + Claude in Chrome): GHL SUB-ACCOUNT + DISCOVERY CALENDAR

**From:** Claude Code (website build) · **To:** Claude in Chrome, working inside Allan's logged-in GoHighLevel · **Date:** 31 Oct 2026

**Owner:** Allan Asuncion, PromdiPreneur (Business Systems & Automation Implementer)

**GHL sub-account (location) ID:** `9AKY7kTTUdEnC8FLOMwh`

This replaces the earlier ChatGPT handoff. ChatGPT ran out of tokens partway, so **some items may already exist. Audit first (§2), then build only what's missing.**

---

## 0. How to start (Allan reads this part)

1. Install **Claude in Chrome** from the Chrome Web Store and sign in with your Claude account.
2. In Chrome, log in to GHL and **switch into the PromdiPreneur sub-account** (location `9AKY7kTTUdEnC8FLOMwh`).
3. Open the Claude side panel in that tab. Attach this file, or paste it in, and say:
   **"Follow this handoff. Start with §2 Audit and show me the results before creating anything."**
4. Stay at the screen. Claude asks before every save. Approve each one.

**You do these two steps yourself, not Claude** (they involve a secret and your DNS):

- §6, the Private Integration token
- any DNS records in §4

---

## 1. Your role and the rules (Claude reads this part)

You are operating GHL in Allan's browser. The new promdipreneur.com website (built, previewed at `promdipreneur-ph.netlify.app`, not yet live) already connects to this sub-account:

- Its forms send contacts to GHL through the API, with tags and custom fields.
- Its "Book a free Business Systems Diagnostic" page (`/diagnostic`) embeds a GHL calendar.

Your job: build the GHL side, test it, and produce the report in §10.

**Work rules:**

- **Ask Allan before every create, save or publish.** Show what you're about to save in one short summary, then wait for his yes.
- **Audit before you build.** If an item already exists and fits, reuse it unchanged and note it.
- **Don't touch anything existing.** Don't edit, rename, pause or delete any existing funnel, website, store, product, workflow, pipeline, stage, form, calendar, pixel, domain or integration. Shop, payroll and kits are live and running paid ads. Only **create new** items.
- **No secrets.** Don't read, copy, reveal or type any API key or token. If one appears on screen, don't repeat it. Allan handles §6 himself.
- **No DNS.** Don't log into Namecheap or change DNS. If GHL shows DNS records, list them for Allan.
- **No ebook opportunities.** An ebook download never creates an opportunity. Opportunities only start from a Diagnostic booking.
- **Branding:** the brand is **PromdiPreneur**; the role is **Business Systems & Automation Implementer**; the tagline is **FROM DISKARTE TO SYSTEMS.** Never use "BASA".
- **Stop if you get stuck.** If a page looks different from these instructions, or a step needs a paid upgrade, stop and tell Allan. Don't guess, and don't click "Upgrade".

---

## 2. Audit first (read-only, about 5 min)

Check each item and report a table to Allan: **exists / missing / exists but differs**. Don't change anything in this step.

| Check                                                                                                                                                    | Where in GHL                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Business profile time zone = Asia/Manila                                                                                                                 | Settings → Business Profile                                                          |
| Sending domain verified (e.g. `agency.promdipreneur.com`)                                                                                                | Settings → Email Services                                                            |
| The 10 custom fields in §5                                                                                                                               | Settings → Custom Fields (Contact)                                                   |
| Tags `LM \| Ebook`, `website-inquiry`, `discovery-booked`                                                                                                | Settings → Tags                                                                      |
| Private Integration named `promdipreneur.com website`                                                                                                    | Settings → Private Integrations (just check whether it exists; don't open the token) |
| A calendar named "Business Systems Diagnostic" (or an older "Discovery Session" calendar; report it, don't edit it)                                      | Calendars → Calendar Settings                                                        |
| Existing sales pipeline and its stage names                                                                                                              | Opportunities → Pipelines                                                            |
| Workflows named `Diagnostic — Booked` (or an older `Discovery — Booked`), `Ebook — Business Opening Checklist PH — Delivery`, `Website Inquiry — Notify` | Automation → Workflows                                                               |

Then build the missing pieces in this order: **§3 → §5 → §7 (main task) → §8 → §9.** §4 and §6 are Allan's.

---

## 3. Business profile

Settings → Business Profile. Change only if empty or wrong, and confirm with Allan first.

- **Business name:** PromdiPreneur
- **Email:** admin@promdipreneur.com
- **Website:** https://promdipreneur.com
- **Time zone:** **Asia/Manila (GMT+8).** Critical for the calendar.

---

## 4. Email sending domain (Allan, only if the audit shows none verified)

The ebook email needs a verified GHL sending domain such as `agency.promdipreneur.com`. If one is already verified, skip this section.

If not:

1. Claude: open Settings → Email Services → add the domain, then **list the DNS records GHL shows** for Allan.
2. Allan: add them in Namecheap as **new records only**. Don't touch `@`, `www`, `shop`, `payroll`, `kits`, `portfolio`, `international`, the MX records, or the Resend records (`send`, `resend._domainkey`) already added for the website.

This is **not needed for the Diagnostic calendar launch**, only for the ebook later. If it takes time, move on.

---

## 5. Custom fields and tags

**Custom fields:** Settings → Custom Fields → Contact. Create any missing field as **Single line** text, with exactly these names. The website finds fields by key automatically.

| Field name        | Expected key                                                  |
| ----------------- | ------------------------------------------------------------- |
| Business Type     | `contact.business_type`                                       |
| Lead Magnet Name  | `contact.lead_magnet_name`                                    |
| Marketing Consent | `contact.marketing_consent` (the website sends `yes` or `no`) |
| Consent Record    | `contact.consent_record`                                      |
| UTM Source        | `contact.utm_source`                                          |
| UTM Medium        | `contact.utm_medium`                                          |
| UTM Campaign      | `contact.utm_campaign`                                        |
| UTM Content       | `contact.utm_content`                                         |
| Landing Page      | `contact.landing_page`                                        |
| Referrer          | `contact.referrer`                                            |

After saving, check each field's actual key. **Report any key that differs** from this table.

**Tags:** create any that are missing, typed exactly:

- `LM | Ebook` (with the spaces around the `|`)
- `website-inquiry`
- `discovery-booked`

---

## 6. Private Integration token (Allan only, 3 min)

Claude: don't do this step. Just remind Allan when you reach it.

Allan:

1. GHL → Settings → Private Integrations → **Create new integration**.
2. **Name:** `promdipreneur.com website`
3. **Scopes:** View Contacts, Edit Contacts, View Custom Fields. Nothing else.
4. Copy the token, then go to **Netlify → promdipreneur-ph → Project configuration → Environment variables → Add a variable**:
   - **Key:** `GHL_PRIVATE_TOKEN`
   - **Value:** the token
   - Leave "Contains secret values" unticked (free plan), choose **All scopes**, same value for all contexts.
5. **Deploys → Trigger deploy → Deploy site.**

Never paste the token into any chat, Claude Code included.

---

## 7. Business Systems Diagnostic calendar (main task)

**Updated 1 Nov 2026 (Allan):** the 30-minute session with Allan is now called the **Business Systems Diagnostic**. It is **free** (no payment step) and bookable **weekdays 1:30–3:30 PM only**. "Discovery" now means the free online questionnaire on the Discovery site. Never call this calendar a "Discovery Call".

Calendars → Calendar Settings → **Create calendar**. Choose a simple 1-on-1 type (Personal booking, or the closest equivalent). Don't reuse the international portfolio's calendar. **No payment** on this calendar.

| Setting                         | Value                                                                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Calendar name                   | **Business Systems Diagnostic**                                                                                                   |
| URL slug                        | `business-systems-diagnostic`                                                                                                     |
| Description (visitors see this) | "A free 30-minute session with Allan to map how your inquiries, sales and daily work move, and what to fix first. No obligation." |
| Duration                        | **30 minutes**                                                                                                                    |
| ★ Meeting location              | Google Meet or Zoom link, auto-generated (or phone). Not blank                                                                    |
| Team member                     | Allan                                                                                                                             |
| Time zone                       | Asia/Manila                                                                                                                       |
| Availability                    | **Monday–Friday, 1:30 PM – 3:30 PM only.** No weekends                                                                            |
| Slot interval                   | 30 min (start times 1:30, 2:00, 2:30, 3:00)                                                                                       |
| Buffer after                    | 0 min (a 15-minute buffer would remove slots in a 2-hour window)                                                                  |
| Minimum scheduling notice       | 12 hours                                                                                                                          |
| Booking window                  | next 30 days                                                                                                                      |
| Max bookings per day            | 4                                                                                                                                 |
| Payment                         | **Off** (free)                                                                                                                    |

**Booking form** (short; this is a free first call):

- Required: First name, Email, Business name
- Optional: Phone
- Business Type, using the `contact.business_type` field. Make it a dropdown on the form if GHL allows, with these options: Not open yet — still planning · Café, restaurant or food stall · Salon, barbershop or spa · Sari-sari store, minimart or retail shop · Water refilling station · Laundry shop · Cleaning or home services · Clinic or pharmacy · Professional or office services · Trading or distribution · Other
- Required, multi-line: "What's slowing your business down?"
- Required consent checkbox: "I agree to be contacted about this booking. Privacy Policy: https://promdipreneur.com/privacy". No pre-ticked marketing box.

**Notifications** (calendar → Notifications):

| Message      | To                      | Content                                                                                                            |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Confirmation | Booker, immediately     | Date and time (Asia/Manila), meeting link, "Bring one or two problems you want to talk through", how to reschedule |
| Reminders    | Booker                  | 24 hours before and 1 hour before (email)                                                                          |
| Internal     | admin@promdipreneur.com | Every booking, reschedule and cancellation                                                                         |

**Embedding (important for the website):**

1. Turn on any option that allows embedding on an external website.
2. Calendar → **⋯ → Share / Copy link** (or Copy embed code). Record the **booking link**. It looks like `https://api.leadconnectorhq.com/widget/booking/<calendarId>`, or a white-label domain such as `https://link.<domain>/widget/booking/<id>`.
3. Report the exact link, and whether it's on a custom domain.

---

## 8. Workflow: `Diagnostic — Booked`

Automation → Workflows → **Create workflow → Start from scratch**. (Name: `Diagnostic — Booked`.)

- **Trigger:** Customer Booked Appointment. Filter: calendar = Business Systems Diagnostic.
- **Actions:**
  1. Add tag `discovery-booked`.
  2. Create/Update Opportunity in the **existing** sales pipeline, at its first stage that means "Diagnostic booked" (or "Discovery booked") (or the closest existing stage). **Don't create a pipeline or stage.** If none fits, stop and ask Allan.
  3. Internal notification (email) to admin@promdipreneur.com: "New Diagnostic booking: {{contact.name}}, {{appointment.start_time}}".
- **Publish** only after Allan approves.

**Test it:**

1. Open the booking link in a new tab and book a slot as "Test Diagnostic", using an email Allan controls.
2. Check that:
   - the confirmation email arrives
   - the internal email arrives
   - the contact has the `discovery-booked` tag
   - the opportunity appears in the right stage
3. Then **cancel the test booking** and delete the test contact and opportunity (ask Allan first).

---

## 9. Workflow: `Ebook — Business Opening Checklist PH — Delivery` (build as DRAFT)

The ebook isn't live yet. Build this, but **leave it as Draft. Don't publish it.**

- **Trigger:** Contact Tag Added = `LM | Ebook`. **Allow re-entry: OFF.**
- **Action 1, email:**
  - From: Allan | PromdiPreneur, using the verified sending domain. Reply-To: admin@promdipreneur.com.
  - Subject: `Your free guide: The Business Opening Checklist PH`
  - Body: short and warm.
    - Button **Download your guide** → `https://promdipreneur.com/resources/promdipreneur-business-opening-checklist-ph.pdf`
    - One line: "This guide is for planning and education, not legal, accounting or compliance advice."
    - P.S.: "Want help putting it into practice? Take the free 5-minute Business Discovery: https://promdipreneur.com/go/dst_discovery"
- **Action 2, If/Else:** `marketing_consent` = `yes` → (optional) 2–3 educational emails over about 10 days, each ending with an invitation to the free Business Discovery. Otherwise → end.
- **Goal / exit:** the contact gets tag `discovery-booked` → leave the workflow.
- **No opportunity** in this workflow.

Optional, small: a workflow `Website Inquiry — Notify` (trigger: tag added `website-inquiry` → internal notification to Allan). **Skip it.** The website already emails admin@ directly.

---

## 10. Report back to Claude Code

Give Allan this, filled in, to paste into the Claude Code chat:

```
GHL SETUP RESULT — sub-account 9AKY7kTTUdEnC8FLOMwh  (done by Claude in Chrome)
[ ] Time zone = Asia/Manila
[ ] Sending domain verified: ____________ (or "not yet — ebook only, not blocking")
[ ] Custom fields OK. Keys that DIFFER from the table: ________ (or "none")
[ ] Tags exist: LM | Ebook / website-inquiry / discovery-booked
[ ] GHL_PRIVATE_TOKEN added to Netlify by Allan + redeployed: Y/N      ← never the token itself
[ ] Diagnostic calendar booking link: ______________________________________
    Custom domain? Y/N   Duration: 30 min   Availability: Mon–Fri 1:30–3:30 PM   Payment: none
[ ] Diagnostic — Booked workflow published. Pipeline/stage used: ______________
[ ] Test booking: confirmation ✓  internal ✓  tag ✓  opportunity ✓  (test data deleted ✓)
[ ] Ebook delivery workflow saved as DRAFT
[ ] Existing items reused (names): ______  — nothing existing was edited
```

When Claude Code gets this, it switches on the booking calendar on the website, adds the calendar domain to the site's security settings if needed, and retests everything on the Netlify preview.
