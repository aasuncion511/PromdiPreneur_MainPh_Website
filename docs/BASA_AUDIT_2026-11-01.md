# BASA branding audit — 1 Nov 2026

**Decision (Allan):** the brand is **PromdiPreneur**. The new legal name will be **Promdipreneur Business Automation
Digital Solutions**, but it is **not registered yet**. So:

- **Marketing copy:** BASA is removed now.
- **Legal lines** (copyright with the legal entity, privacy policy, terms): keep the **currently registered** name
  ("AJDA Enterprises, Inc., doing business as PromdiPreneur BASA Consultancy") until the new registration is approved.

## A. Changed by Claude Code (on branches; nothing merged to `main`, nothing live yet)

Each repo has a branch named **`rebrand/remove-basa`**. To publish, merge it (or tell Claude Code "merge the rebrand
branches").

| Site / repo                                                                                                          | What changed                                                                                                                                                                  | Kept on purpose                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **promdipreneur-diagnostic-page.netlify.app** (`promdipreneur_diagnostic_page`)                                      | Hero eyebrow, footer blurb, About title/description/intro, site description, search-engine data (JSON-LD) now say "PromdiPreneur — Business Systems & Automation Implementer" | Footer copyright, privacy policy, terms and the `dba` field keep the registered name (marked "LEGAL" in the code) |
| **promdipreneur.com (current live site)** (`promdipreneur_mainOld`)                                                  | Hero eyebrow, About copy and signature, footer title and copyright, author tag, template title                                                                                | —                                                                                                                 |
| **portfolio.promdipreneur.com** (`Promdipreneur_International_Folio`, live branch `claude/portfolio-v2-independent`) | Brand name in footer, nav, search data and sitemap; work-history entry; share title (og:site_name); README                                                                    | Privacy/terms intros use `site.legalTradeName` (current name)                                                     |
| **MinBizCon scanner** (`minbizcon-promdipreneur-scanner`)                                                            | "Powered by PromdiPreneur", subtitle                                                                                                                                          | —                                                                                                                 |
| **BaltaCars client demo** (`baltacars-client-demo`)                                                                  | Pitch deck closing slide, handoff "From:" line                                                                                                                                | —                                                                                                                 |
| **New PromdiPreneur website** (this repo)                                                                            | Already clean; the release check blocks BASA from ever shipping                                                                                                               | —                                                                                                                 |

Clean, no change needed: payroll.promdipreneur.com, kits.promdipreneur.com, the ebook PDF on the new site,
roast-room, crm-Comp-AI, portfolio-template, Allan_Claude_Fleet_Management.

**Portfolio note:** the portfolio's live site builds from `claude/portfolio-v2-independent`, not `main`. Merge the
rebrand branch into **that** branch.

## B. Allan to change (Claude Code has no access)

| Where                                                    | What it says now                                                                                                                                                                                                                                                                                                                                                                                                                                       | Change to                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **shop.promdipreneur.com** (GHL funnel)                  | "Promdipreneur BASA · Business Automation Solutions Architect"                                                                                                                                                                                                                                                                                                                                                                                         | "PromdiPreneur · Business Systems & Automation Implementer" (GHL → Sites → Funnels → shop → header/footer) |
| **Facebook page**                                        | Check the page name, intro/bio, category and pinned posts (could not be read from here)                                                                                                                                                                                                                                                                                                                                                                | Brand "PromdiPreneur"; role "Business Systems & Automation Implementer"                                    |
| **LinkedIn** (Allan's profile + any company page)        | Check the headline, experience entry and company name                                                                                                                                                                                                                                                                                                                                                                                                  | Same as above                                                                                              |
| **GHL**                                                  | Business profile name, email sender name, email/SMS templates, calendar descriptions, invoice/estimate templates                                                                                                                                                                                                                                                                                                                                       | "PromdiPreneur" (legal name on invoices stays as registered)                                               |
| **Physical/print**                                       | The MinBizCon registration standee ("BASA CONSULTANCY", "15+ years")                                                                                                                                                                                                                                                                                                                                                                                   | Reprint before reuse                                                                                       |
| **Google Drive folder** "PromdiPreneur BASA CONSULTANCY" | Folder name                                                                                                                                                                                                                                                                                                                                                                                                                                            | Rename to "PromdiPreneur" (links keep working)                                                             |
| **Google Drive client-facing files**                     | `BASA_Service_Menu_Client.docx`, `BASA Consultancy - Package & Pricing Architecture v1`, `BASA_Client_Journey_Pricing` (doc, PDF and docx copies), `Bugbusters_IPM_BASA_Proposal_Pack` (2 copies), résumés (`AllanAsuncion_AI_Automation_Resume`, `AllanAsuncionResume_CRM_AI_Automation_Specialist`, `Allan_Asuncion_AI_Automation_Resume_2026`, PDFs and docx copies), `PromdiPreneur_Top_10_Local_Business_Growth_Services_Playbook` (doc and docx) | Update before sending to anyone again                                                                      |
| **Google Drive internal files** (optional)               | `BASA_Master_Strategy_*`, `BASA_AI_Operating_System`, `Master Template BASA Blueprint`, `International_Client_Acquisition_Strategy_BASA` (2), `PromdiPreneur_BASA_Offer_Strategy`, `Promdipreneur_BASA_Internal_Operations_Manual_Bugbusters`, `BASA_*Daily_FB_Posts*` (7 sheets), `BASA_30Day_FB_Content_Calendar`, website architecture drafts and handoffs, ebook drafts                                                                            | Rename only if you still use them; old versions can stay as history                                        |

## C. Legal name: questions for Allan before the registration

1. **Is "Promdipreneur Business Automation Digital Solutions" a new trade name (DBA) under AJDA Enterprises, Inc., or a
   new company?** It changes the footer/privacy/terms wording ("AJDA Enterprises, Inc., doing business as …" vs. the new
   company name alone).
2. **When it's registered:** tell Claude Code. It's a 5-minute change in two places:

   - Discovery site: `src/lib/site.ts` (`legalName`, `dba`), `content/legal/privacy.md`, `content/legal/terms.md`
   - Portfolio: `src/content/site.ts` (`legalTradeName`)

   The new main website shows no legal entity name, so nothing changes there.

## D. Related item found during the audit (not BASA)

The **Discovery site still sells the Diagnostic for ₱500 with a checkout** (`src/lib/site.ts → diagnostic.price`). Allan
said on 1 Nov the Diagnostic is now **free** and bookable **weekdays 1:30–3:30 PM**. The new main website already
says "free". The Discovery site's payment flow needs its own change (not done; it's checkout logic).
