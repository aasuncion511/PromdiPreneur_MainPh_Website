# Netlify setup (pre-launch)

About 20 minutes. This creates the new site on a free `*.netlify.app` address. **It does not touch promdipreneur.com.** The domain moves only at launch, after Allan approves (`docs/DEPLOYMENT.md` § D).

## 1. Create the site from GitHub

1. Go to https://app.netlify.com. Log in (the same account as the portfolio is fine) and stay on the free plan.
2. **Add new site → Import an existing project → GitHub.** Authorize Netlify if asked.
3. Pick the repository **`aasuncion511/PromdiPreneur_MainPh_Website`**. If it's not listed, click "Configure the Netlify app on GitHub" and give it access to that repo.
4. **Branch to deploy:** `feature/promdipreneur-site-v3` (not `main`; `main` is still the old template).
5. **Build settings:** leave everything as Netlify fills it in from the repo's `netlify.toml` (build command `npm run build`, publish directory `dist`, functions `netlify/functions`).
6. **Site name:** `promdipreneur-ph` (your address becomes `promdipreneur-ph.netlify.app`; pick another name if it's taken).
7. Click **Deploy**. The first build takes 2–4 minutes.

## 2. Keep it hidden from Google until launch

The branch you deploy counts as Netlify's "production", so it doesn't get the automatic noindex that previews get. Add this now and remove it at launch:

- **Site configuration → Environment variables → Add a variable**
  - Key: `PUBLIC_PREVIEW`
  - Value: `1`
  - Scopes: all. Deploy contexts: all.

Then go to **Deploys → Trigger deploy → Deploy site**. The site now shows the "Preview for approval" ribbon and is noindex.

## 3. Email for the contact form (Resend)

1. Create a free account at https://resend.com with admin@promdipreneur.com.
2. **Domains → Add domain → `promdipreneur.com`.** Resend shows 3–4 DNS records (TXT/MX, usually on `send.promdipreneur.com` and `resend._domainkey`).
3. In **Namecheap → Domain List → promdipreneur.com → Advanced DNS → Add New Record**, add exactly those records.
   - These are **new** records only.
   - **Do not** edit or delete `@`, `www`, `shop`, `payroll`, `kits`, `portfolio`, `international` or the existing mail (MX) records.
4. Wait for Resend to say **Verified** (minutes to a few hours).
5. **API Keys → Create API key** (permission: Sending access). Copy it once.

## 4. Environment variables (Site configuration → Environment variables)

Add each one. Tick **"Contains secret values"** where it says _secret_, if your plan shows that option.

| Key                   | Value                                                       | Notes                                         |
| --------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| `PUBLIC_PREVIEW`      | `1`                                                         | Already added in step 2. **Remove at launch** |
| `RESEND_API_KEY`      | the Resend key from step 3                                  | _secret_. Paste only here                     |
| `INQUIRY_NOTIFY_FROM` | `PromdiPreneur Website <website@promdipreneur.com>`         | Must be on the verified domain                |
| `INQUIRY_NOTIFY_TO`   | `admin@promdipreneur.com`                                   | Where new inquiries arrive                    |
| `IP_HASH_SALT`        | any random 32+ character string (use a password generator)  | _secret_. Used for spam limits                |
| `EXPORT_TOKEN`        | another random 32+ character string                         | _secret_. Unlocks your inquiry CSV download   |
| `GHL_PRIVATE_TOKEN`   | the Private Integration token from GHL (ChatGPT handoff §5) | _secret_. Paste only here                     |

Already handled in the code, so **don't add**: `GHL_LOCATION_ID` (set in `netlify.toml` as `9AKY7kTTUdEnC8FLOMwh`) and `GHL_CUSTOM_FIELDS` (fields are found automatically).

Leave **`EBOOK_ACTIVE` unset** until you approve the ebook (`docs/EBOOK.md`).

Optional: `PUBLIC_GA4_ID` = your `G-…` ID, if you want analytics.

After adding variables: **Deploys → Trigger deploy → Deploy site** (variables only apply to new deploys).

## 5. Quick check (on the `.netlify.app` address)

- [ ] The site loads with the preview ribbon.
- [ ] Every menu link works on your phone.
- [ ] Send one test question from `/contact`. You should land on the thank-you page, and the email should arrive at admin@promdipreneur.com.
- [ ] If GHL is set up: the test contact appears in GHL with tag `website-inquiry`. Delete it afterwards.
- [ ] `/resources/free-ebook` still says "Opening soon" (correct until you approve it).

## 6. Send to Claude Code

```
NETLIFY READY
Site address: https://__________.netlify.app
Env vars added: RESEND_API_KEY / INQUIRY_NOTIFY_FROM / INQUIRY_NOTIFY_TO / IP_HASH_SALT / EXPORT_TOKEN / GHL_PRIVATE_TOKEN / PUBLIC_PREVIEW   (names only, never values)
Resend domain verified: Y/N
Test inquiry: landed on thank-you Y/N · email arrived Y/N · GHL contact Y/N
```

With that, plus the ChatGPT GHL report (calendar link), Claude Code will:

1. switch on the booking calendar
2. retest everything on your Netlify address
3. prepare the launch: domain switch, removing `PUBLIC_PREVIEW`, rollback steps

The ebook is switched on separately, after you approve the regulatory review.
