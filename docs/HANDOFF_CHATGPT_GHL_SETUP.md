# HANDOFF FOR CHATGPT: GHL SUB-ACCOUNT + DISCOVERY CALENDAR SETUP

**From:** Claude Code (website build) · **To:** ChatGPT (guiding Allan step by step inside GoHighLevel) · **Date:** 31 Oct 2026

**Owner:** Allan Asuncion, PromdiPreneur (Business Systems & Automation Implementer)

**GHL sub-account (location) ID:** `9AKY7kTTUdEnC8FLOMwh`

## 0. Your role and the rules

ChatGPT cannot log in to GHL. Your job is to **walk Allan through each click**, one section at a time. Confirm each step is done before moving on, and at the end collect the items in **§9 Report back to Claude Code**.

The new promdipreneur.com website (Astro, preview approved, not yet live) is already built to connect to this sub-account:

- The website's own forms send contacts to GHL through the API.
- The "Book a Discovery Session" page embeds a GHL calendar.

What's missing is the GHL side, which only Allan can set up.

**Do not:**

- Edit, rename, pause or delete any **existing** funnel, store, product, workflow, pipeline, form, calendar, pixel or domain. Shop, payroll and kits are live and running paid ads. Only **create new** items, unless an existing item clearly does the same job; in that case, reuse it without changing it.
- Ask Allan to paste any **API key or token** into ChatGPT, Claude or email. Tokens go only into Netlify's environment variables (§5).
- Change DNS records, except the sending-domain records GHL shows in §2. Those are new records only.
- Create a sales **opportunity** when someone downloads the ebook. Opportunities start only when someone books a Discovery Session (§6) or is qualified.
- Use the retired "BASA" naming anywhere. The brand is **PromdiPreneur**; the role is **Business Systems & Automation Implementer**; the tagline is **FROM DISKARTE TO SYSTEMS.**

## 1. Sub-account basics (5 min)

Settings → Business Profile:

- **Business name:** PromdiPreneur
- **Email:** admin@promdipreneur.com
- **Website:** https://promdipreneur.com
- **Time zone:** **Asia/Manila (GMT+8).** This matters for the calendar.
- **Address:** Cagayan de Oro, Philippines. Use only what Allan is comfortable showing.

## 2. Email sending domain (check first, then fix)

The ebook delivery email must send as **Allan | PromdiPreneur <admin@agency.promdipreneur.com>**, with Reply-To **admin@promdipreneur.com**.

Settings → Email Services (or LC Email) → Dedicated sending domain:

1. Check whether `agency.promdipreneur.com` (or another promdipreneur domain) is already **verified**. If it is, don't touch it.
2. If not, add it and copy the DNS records GHL shows.
3. Add those records at the DNS provider (Namecheap). They are **new records only**. Do not edit or remove the existing `@`, `www`, `shop`, `payroll`, `kits`, `portfolio`, `international` or MX records.
4. Wait until GHL says **Verified**.

## 3. Custom fields (contact)

Settings → Custom Fields → Contact. If an equivalent field already exists, reuse it and note its **key**. Otherwise create a **Single line** text field with exactly these names. GHL generates the keys; the website looks fields up by key automatically, so no IDs are needed.

| Field name        | Expected key                                              |
| ----------------- | --------------------------------------------------------- |
| Business Type     | `contact.business_type`                                   |
| Lead Magnet Name  | `contact.lead_magnet_name`                                |
| Marketing Consent | `contact.marketing_consent` (website sends `yes` or `no`) |
| Consent Record    | `contact.consent_record`                                  |
| UTM Source        | `contact.utm_source`                                      |
| UTM Medium        | `contact.utm_medium`                                      |
| UTM Campaign      | `contact.utm_campaign`                                    |
| UTM Content       | `contact.utm_content`                                     |
| Landing Page      | `contact.landing_page`                                    |
| Referrer          | `contact.referrer`                                        |

**Report back:** any field whose key differs from this table.

## 4. Tags

Create these if they don't exist:

- `LM | Ebook`: someone requested the free ebook. **The website sends this exact text, including the spaces and the `|`.**
- `website-inquiry`: someone sent the website contact form.
- `discovery-booked`: someone booked a Discovery Session (added by the calendar, §6).

## 5. Private Integration token (for the website)

Settings → Private Integrations → **Create new integration**:

- **Name:** `promdipreneur.com website`
- **Scopes:** View Contacts, Edit Contacts, View Custom Fields. Nothing else.
- Copy the token **once** and store it directly in **Netlify → (the new PromdiPreneur site) → Site configuration → Environment variables → `GHL_PRIVATE_TOKEN`**, marked as a secret.

If the Netlify site doesn't exist yet, **don't save the token anywhere else**. Create it later when the Netlify site is ready; you can generate a new token at any time.

**Never paste the token into ChatGPT or Claude.**

## 6. Discovery Session calendar (main task)

Calendars → Calendar Settings → **Create calendar**. Use a simple 1-on-1 type, such as Personal booking or Event calendar. Reuse an existing Discovery calendar only if it is already right for Philippine prospects. The international portfolio's booking calendar is **not** to be reused.

| Setting                         | Value (confirm with Allan)                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Calendar name                   | **Business Systems Discovery Session**                                                                                                                 |
| URL slug                        | `discovery-session`                                                                                                                                    |
| Description (shown to visitors) | "A short, free conversation about your business: where inquiries, follow-ups or admin time are being lost, and what to organize first. No obligation." |
| Duration                        | **30 minutes** (Allan's call: 30 or 45)                                                                                                                |
| Meeting location                | Google Meet or Zoom link auto-generated (or phone). Pick one; don't leave it blank                                                                     |
| Team member                     | Allan                                                                                                                                                  |
| Time zone                       | Asia/Manila                                                                                                                                            |
| Availability                    | Allan's real hours, e.g. Mon–Fri 9:00–17:00 and Sat 9:00–12:00. **Only hours he can actually take calls**                                              |
| Slot interval                   | 30 min                                                                                                                                                 |
| Buffer after                    | 15 min                                                                                                                                                 |
| Minimum scheduling notice       | 12 hours                                                                                                                                               |
| Booking window                  | next 30 days                                                                                                                                           |
| Max bookings per day            | 4 (adjust to his capacity)                                                                                                                             |

**Booking form** (keep it short; this is a free first call):

- Required: First name, Email
- Optional: Phone
- Required, using the custom fields from §3 where possible:
  - Business name
  - Business type (dropdown, same options as the website): Not open yet — still planning · Café, restaurant or food stall · Salon, barbershop or spa · Sari-sari store, minimart or retail shop · Water refilling station · Laundry shop · Cleaning or home services · Clinic or pharmacy · Professional or office services · Trading or distribution · Other
  - "What's slowing your business down?" (multi-line)
- Consent checkbox, required: "I agree to be contacted about this booking. Privacy Policy: https://promdipreneur.com/privacy". Marketing consent stays a **separate, optional, unticked** box, or leave it out.

**Notifications** (calendar → Notifications):

| Message               | To                      | Content                                                                                                        |
| --------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Confirmation email    | Booker, immediately     | Date and time (Asia/Manila), meeting link, what to prepare (one or two problems to discuss), how to reschedule |
| Reminders             | Booker                  | 24 hours before, and 1 hour before (email; SMS only if the booker gave a phone number and SMS consent applies) |
| Internal notification | admin@promdipreneur.com | Every booking, reschedule and cancellation                                                                     |

**Pipeline and workflow:** new workflow named `Discovery — Booked`.

- **Trigger:** Appointment booked on _Business Systems Discovery Session_ (status confirmed).
- **Actions:**
  1. Add tag `discovery-booked`.
  2. Create or update an opportunity in the **existing** sales pipeline, at its first "Discovery booked" stage (or the closest existing stage). **Don't create a new pipeline** unless none exists, and confirm with Allan first.
  3. Internal notification to Allan.
- Also handle cancelled and no-show appointments with the existing pipeline rules. Don't invent new stages without Allan's OK.

**Website embedding:**

- Turn on any setting that allows the calendar to be **embedded on an external website**.
- Then Calendar → **⋯ → Share / Copy link**. Copy the **booking link**: either `https://api.leadconnectorhq.com/widget/booking/<calendarId>`, or a white-label domain such as `https://link.<domain>/widget/booking/<id>`.
- **Report back the exact link**, and say whether it's a custom domain (Claude Code then allows that domain in the site's security settings).

**Test:** book one test slot as a fake client. Check:

- the confirmation email arrives
- the internal notification arrives
- the tag and opportunity are created

Then cancel the test booking and delete the test contact and opportunity.

## 7. Free ebook delivery workflow

The ebook is **_The Business Opening Checklist PH_** (109 practical checks; 7 stages). The website saves the contact with tag `LM | Ebook`. GHL sends the email. Create a new workflow named `Ebook — Business Opening Checklist PH — Delivery`:

- **Trigger:** Contact Tag Added = `LM | Ebook`. Settings: **Allow re-entry: OFF** (one delivery per person).
- **Action 1, email (transactional, immediate):**
  - From: Allan | PromdiPreneur <admin@agency.promdipreneur.com>. Reply-To: admin@promdipreneur.com.
  - Subject: `Your free guide: The Business Opening Checklist PH`
  - Body: short and warm. A **Download your guide** button linking to `https://promdipreneur.com/resources/promdipreneur-business-opening-checklist-ph.pdf`. One line: "This guide is for planning and education, not legal, accounting or compliance advice." A soft P.S.: "Want help putting it into practice? Book a free Discovery Session: https://promdipreneur.com/discovery".
  - ⚠️ **That PDF link only works after the new website goes live with the PDF.** Until then, **build the workflow but leave it saved as Draft.**
- **Action 2, If/Else:** Marketing Consent = `yes`.
  - **Yes:** optional educational follow-up of 2–3 emails over about 10 days: one practical tip each, ending with the Discovery invitation. Each email has an unsubscribe link.
  - **No:** end.
- **No opportunity** in this workflow.
- **Exit condition:** if the contact gets tag `discovery-booked`, remove them from the nurture.

## 8. Website contact form (optional, small)

Create a new workflow named `Website Inquiry — Notify`:

- **Trigger:** Tag Added = `website-inquiry`.
- **Action:** internal notification to Allan.

The website already emails admin@ directly, so this is optional. Don't send an automatic sales reply.

## 9. Report back to Claude Code (copy this checklist into the Claude Code chat)

```
GHL SETUP RESULT — sub-account 9AKY7kTTUdEnC8FLOMwh
[ ] Business profile time zone = Asia/Manila
[ ] Sending domain verified: ______________________ (agency.promdipreneur.com? Y/N)
[ ] Custom fields created/reused. Keys that DIFFER from the table: __________ (or "none")
[ ] Tags exist: LM | Ebook / website-inquiry / discovery-booked
[ ] Private Integration token created with scopes Contacts (view/edit) + Custom Fields (view)
    and stored in Netlify as GHL_PRIVATE_TOKEN  (Y / "Netlify site not created yet")   ← do NOT paste the token
[ ] Discovery calendar booking link: ______________________________________
    Custom domain? Y/N   Duration: ___ min   Availability: ______________
[ ] Test booking: confirmation ✓  internal notice ✓  tag ✓  opportunity ✓  (test data deleted ✓)
[ ] Ebook delivery workflow built and saved as DRAFT (activate after site launch)
[ ] Anything existing that was reused (name it) — nothing existing was edited
```

Also send Claude Code the ebook PDF itself: **attach `The_Business_Opening_Checklist_PH_Designed.pdf` directly in the Claude Code chat**. Claude Code adds it to the website, checks every link inside it, and switches the ebook form on after Allan approves the regulatory-reference review.
