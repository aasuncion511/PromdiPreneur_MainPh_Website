# Ask PromdiPreneur — admin guide

Feature Addendum 01 (1 Nov 2026). Branch `feature/ask-promdipreneur`. **Not live until it passes the acceptance test
on a preview and Allan approves.** The website launch does not wait for it (Allan's decision).

## What it is

- `/ask`: a chat page. A floating launcher on every page (desktop: bottom-right "Ask PromdiPreneur · AI"; phones:
  bottom-left "Ask AI", next to the Messenger button).
- Clearly labelled AI. "Talk to a Person" is always visible.
- Answers come from **Claude Haiku 5.5** (Anthropic API, official SDK) through a server function. The key never reaches the
  browser. Allan chose Claude on 1 Nov 2026; OpenAI remains available as a switch (`AI_PROVIDER=openai`).
- Knowledge: approved PromdiPreneur documents in `knowledge/` (now: _The Business Opening Checklist PH_) plus a list
  of official government pages taken from the ebook's own references.

## Decisions (Allan, 1 Nov 2026)

| Topic              | Decision                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Timing             | Site launches first; Ask goes live after its own tests                                           |
| Ebook as knowledge | Allowed before the regulatory review, with a verify-with-the-agency warning on regulatory topics |
| Government sources | Curated official links only (`knowledge/official-sources.json`); no live web search              |
| Spending cap       | **US$1/day, US$10/month** (hard stop; the chat then offers "Talk to a Person")                   |

## Setup (about 10 minutes, Allan)

1. **Anthropic account**: go to **console.anthropic.com** and sign up with admin@promdipreneur.com. This is
   separate from a Claude Pro subscription, which does not include API access.
2. **Billing**: add a payment method and a small prepaid credit (e.g. US$5).
3. **Limits**: set a **monthly spend limit of US$10**. This is the provider-side safety net; the site also stops
   itself (below).
4. **API keys**: create a key named `promdipreneur-website`. Copy it once.
5. **Netlify → promdipreneur-ph → Environment variables** (no "secret" tick on the free plan, All scopes):

   | Key                   | Value                                                |
   | --------------------- | ---------------------------------------------------- |
   | `ANTHROPIC_API_KEY`   | the key from step 4 (paste only here, never in chat) |
   | `ASK_DAILY_CAP_USD`   | `1`                                                  |
   | `ASK_MONTHLY_CAP_USD` | `10`                                                 |
   | `ASK_ACTIVE`          | `true` (set `false` to switch the AI off instantly)  |

   Defaults you don't need to set: `AI_PROVIDER=anthropic`, `ASK_MODEL=claude-haiku-5-5`, and prices
   US$0.10 input / US$0.50 output per 1M tokens (Claude Haiku 5.5 list prices). Optional: `ASK_MAX_PER_HOUR` (30 per
   visitor), `ASK_MAX_PER_SESSION` (20 per chat per day), `ASK_TIMEOUT_MS` (9500).

6. Redeploy, open `https://<preview>/ask/qa`, press **Run all tests**, then **Copy results** and paste them to
   Claude Code.

**Cost guide:** a typical answer is about 3,500 tokens in and 400 out, which is about **US$0.0006 per answer**
(roughly 18,000 answers for US$10).

### Switching to OpenAI instead (optional)

Set `AI_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_MODEL` (a fast, low-cost non-reasoning model) and its prices in
`ASK_PRICE_INPUT_PER_1M` / `ASK_PRICE_OUTPUT_PER_1M`. Then update the privacy policy's provider name.

## How the cost is controlled

- Per answer: at most the last 6 messages, max 1,000 characters per question, max 650 output tokens, 3 short
  knowledge excerpts.
- Per visitor: 30 questions/hour per internet address, 20 questions/day per chat.
- Whole site: after every answer the site adds the real token usage × your prices to a daily and monthly total. When
  either cap is reached, the chat stops answering until the next day or month and offers "Talk to a Person".
- At **80% of the monthly cap**, an email goes to admin@promdipreneur.com (once per month).
- The Anthropic Console spend limit (setup step 3) is the second, independent limit.

## Reports

`/api/ask-report` with your `EXPORT_TOKEN` (same token as the inquiry CSV):

```
curl -H "Authorization: Bearer YOUR_EXPORT_TOKEN" https://promdipreneur-ph.netlify.app/api/ask-report
```

It shows, per day, the number of sessions, questions, answers, errors, refused leak attempts, cap hits and
Talk-to-a-Person requests, plus estimated spend. **No chat text is stored anywhere.** In GA4 (if enabled) the events
are `ask_chat_open`, `ask_question_submitted`, `ask_response_delivered`, `ask_resource_clicked`,
`ask_human_help_clicked` and `ask_contact_submitted` (see `docs/TRACKING.md`).

Talk-to-a-Person requests arrive at admin@promdipreneur.com with the subject
"[PromdiPreneur] Ask PromdiPreneur — <name> wants to talk to a person". When GHL is connected, they are also saved
with tag **`Ask PromdiPreneur`**.

## Updating the knowledge

1. Put the new or updated document in `knowledge/docs/` as Markdown, with a **new version** in the file name (e.g.
   `business-opening-checklist-ph.v2.md`). Sections start with `## ` (one chunk each).
2. In `knowledge/manifest.json`: add the document with `"status": "approved"`, `approvedBy` and `approvedAt`. For an
   update, set the old version's status to `"retired"`. To **remove** a document, set `"status": "removed"`.
3. Run `npm run build:knowledge` (the normal build runs it too) and commit `knowledge/` plus
   `server/generated/knowledge.ts`.
4. Official links: edit `knowledge/official-sources.json`. Only official government pages; note where each came from.
5. Never add confidential documents: anything in the knowledge base can be quoted to visitors.

## Safety rules built in

- The AI is told it is an AI, never Allan; no invented laws, fees, sources, stories or prices; no pressure to buy;
  general guidance only on legal, tax, employment, financial and safety topics, with verification and professional
  referral; one follow-up question at most; business topics only.
- Emails, phone numbers and ID or card-like numbers are **removed before** the question reaches the AI provider. The visitor
  is told.
- Knowledge excerpts are marked as untrusted data. A secret marker detects prompt leaks: a reply that leaks
  instructions is replaced.
- Replies are shown as text only. Links survive only to promdipreneur.com, its subdomains, site pages and `*.gov.ph`.
- Claude answers directly (thinking off, max 650 output tokens). Conversations exist only in the visitor's open tab;
  the site stores no chat text.

## Switching it off

- **Instantly:** set `ASK_ACTIVE=false` in Netlify and redeploy. The chat then says it is resting and offers a person.
- **Hide it completely:** set `FEATURES.askLive = false` in `src/data/brand.ts`. This removes the launcher and the chat.

## Tests

- `npm run test:api` covers caps, rate limits, redaction, injection/leak guard, link sanitizing, API failure,
  validation, the human-help form, the required prompt rules and knowledge retrieval for the acceptance topics.
- `node scripts/qa/e2e.mjs` drives the real page against a simulated AI (`ASK_MODE=mock|inactive|fail|budget` on
  the local QA server).
- `/ask/qa` runs the Addendum §8 acceptance questions against the real AI on a preview.
