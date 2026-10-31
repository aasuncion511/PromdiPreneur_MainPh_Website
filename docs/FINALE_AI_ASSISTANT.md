# Finale phase: "Ask PromdiPreneur" AI assistant (ON HOLD)

**Status: planned, not started.** Allan decided (31 Oct 2026) to build this last, as the finishing touch after the core site, the ebook and the integrations are live. **Nothing in the current build calls OpenAI.**

## Before this phase starts

- The core site is live on promdipreneur.com.
- The inquiry form, ebook delivery and Discovery booking are working.
- Analytics shows real traffic, so we can measure the assistant's impact.

## Decisions already captured

| Topic          | Plan                                                                                                                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engine         | OpenAI API from Allan's account (not a ChatGPT Custom GPT link), so visitors stay on the site and leads reach GHL                                                                                               |
| Name and label | "Ask PromdiPreneur", clearly marked as an **AI assistant**. Never called "live" unless a person is answering                                                                                                    |
| Key safety     | The OpenAI key lives only in a Netlify environment variable (`OPENAI_API_KEY`), called from a server function (`/api/ask`, streamed). It is never in the browser and never pasted in chat                       |
| Knowledge      | Built from the site's own data files (services, how we work, products, ebook stages)                                                                                                                            |
| Scope          | Practical business-systems advice for Filipino SMEs, in plain English                                                                                                                                           |
| Guardrails     | No legal, tax or compliance answers (refer to agencies or professionals). No prices or quotes (route to Discovery). No promised results. Politely decline off-topic questions                                   |
| Hand-off       | Offer **Book a Discovery Session** regularly and whenever unsure. "Send this conversation to PromdiPreneur" does a GHL upsert with tag `AI Advisor` and a short summary                                         |
| Cost control   | Per-visitor rate limit (reuse the existing limiter), message and reply length caps, a daily spend cap in code, a monthly limit in the OpenAI dashboard, small low-cost model by default                         |
| Privacy        | Conversations are not stored unless the visitor chooses to send them. In-chat note not to share sensitive data. Privacy policy section on OpenAI processing. Analytics counts usage only, never message content |
| Rollout        | Behind `FEATURES.aiAssistant` (off). Tested against a mocked OpenAI first, then the real key on a preview, then Allan approves                                                                                  |

## Inputs needed from Allan when we start

1. OpenAI API key added in Netlify as `OPENAI_API_KEY`, and a monthly spending limit set in OpenAI.
2. Approved assistant name, greeting and tone.
3. Topics that must always go to a human.
4. Whether sent conversations should also notify admin@ by email.
