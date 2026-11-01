/**
 * Netlify wiring for Ask PromdiPreneur: Netlify Blobs for counters, spend and rate limits; Resend for email;
 * Claude (default) or OpenAI for answers. Secrets come from Netlify environment variables only.
 *
 *   ASK_ACTIVE=true            switch (anything else = assistant shows "temporarily unavailable")
 *   AI_PROVIDER                "anthropic" (default, Claude) or "openai"
 *   ANTHROPIC_API_KEY          secret, server only (Claude)
 *   ASK_MODEL                  optional Claude model id (default claude-haiku-5-5)
 *   ASK_PRICE_INPUT_PER_1M / ASK_PRICE_OUTPUT_PER_1M  optional; default to Claude Haiku 5.5 list prices
 *   OPENAI_API_KEY             secret, server only
 *   OPENAI_MODEL               e.g. a fast, low-cost non-reasoning model from your OpenAI account
 *   OPENAI_REASONING_EFFORT    optional; only for reasoning models (e.g. "low")
 *   OPENAI_PRICE_INPUT_PER_1M / OPENAI_PRICE_OUTPUT_PER_1M   USD prices of that model (for the spend caps)
 *   ASK_DAILY_CAP_USD (1) / ASK_MONTHLY_CAP_USD (10) / ASK_MAX_PER_HOUR (30) / ASK_MAX_PER_SESSION (20)
 */
import { getStore } from '@netlify/blobs';
import { aiProvider, capsFromEnv, openaiCaller, type AskDeps, type CounterField } from './ask-core.ts';
import { claudeCaller } from './ask-anthropic.ts';
import type { AskContactDeps, AskContactRecord } from './ask-contact.ts';
import { ASK_SOURCE } from './ask-contact.ts';
import { netlifyDeps } from './netlify-deps.ts';
import { ghlConfigFromEnv, upsertGhlContact } from './ghl.ts';

const env = (k: string) => (typeof process !== 'undefined' ? process.env[k] : undefined) || '';

export const ASK_STATS_STORE = 'ask-stats';

export function askCounters() {
  const stats = getStore({ name: ASK_STATS_STORE, consistency: 'strong' });
  return {
    async incr(day: string, field: CounterField) {
      const key = `counts:${day}`;
      const cur = ((await stats.get(key, { type: 'json' })) as Record<string, number> | null) ?? {};
      cur[field] = (cur[field] ?? 0) + 1;
      await stats.setJSON(key, cur);
    },
    stats,
  };
}

function hitter(storeName: string, window: (d: Date) => string) {
  const s = getStore({ name: storeName, consistency: 'strong' });
  return {
    async hit(key: string) {
      const bucket = `${key}:${window(new Date())}`;
      const cur = ((await s.get(bucket, { type: 'json' })) as { n: number } | null)?.n ?? 0;
      await s.setJSON(bucket, { n: cur + 1 });
      return cur + 1;
    },
  };
}

export function askDeps(): AskDeps {
  const base = netlifyDeps(); // reuse IP hashing and the Resend mailer
  const { stats, incr } = askCounters();
  const timeoutMs = Number(env('ASK_TIMEOUT_MS')) || undefined;
  const useClaude = aiProvider(process.env) === 'anthropic';
  const ready = useClaude ? Boolean(env('ANTHROPIC_API_KEY')) : Boolean(env('OPENAI_API_KEY') && env('OPENAI_MODEL'));
  return {
    active: env('ASK_ACTIVE') === 'true' && ready,
    callModel: useClaude
      ? claudeCaller({ apiKey: env('ANTHROPIC_API_KEY'), model: env('ASK_MODEL') || undefined, timeoutMs })
      : openaiCaller({
          apiKey: env('OPENAI_API_KEY'),
          model: env('OPENAI_MODEL'),
          reasoningEffort: env('OPENAI_REASONING_EFFORT') || undefined,
          timeoutMs,
        }),
    spend: {
      async get(key) {
        return (((await stats.get(`spend:${key}`, { type: 'json' })) as { usd: number } | null)?.usd ?? 0) as number;
      },
      async add(key, usd) {
        const cur = (((await stats.get(`spend:${key}`, { type: 'json' })) as { usd: number } | null)?.usd ??
          0) as number;
        const next = cur + usd;
        await stats.setJSON(`spend:${key}`, { usd: next });
        return next;
      },
    },
    counters: { incr },
    rateLimit: hitter('ask-ratelimit', (d) => d.toISOString().slice(0, 13)),
    sessionHits: hitter('ask-sessions', () => 'day'),
    hashIp: base.hashIp,
    caps: capsFromEnv(process.env),
    alert: base.configured
      ? (message) =>
          base.mailer.send({
            to: base.notifyTo,
            subject: '[PromdiPreneur] Ask PromdiPreneur is at 80% of its monthly AI budget',
            text: message,
            html: `<p>${message}</p>`,
            replyTo: base.notifyTo,
          })
      : undefined,
  };
}

export function askContactDeps(): AskContactDeps {
  const base = netlifyDeps();
  const store = getStore({ name: 'ask-contacts', consistency: 'strong' });
  const ghl = ghlConfigFromEnv(process.env);
  const { incr } = askCounters();
  return {
    configured: base.configured,
    notifyTo: base.notifyTo,
    mailer: base.mailer,
    hashIp: base.hashIp,
    rateLimit: base.rateLimit,
    store: {
      async put(r: AskContactRecord) {
        await store.setJSON(r.id, r);
      },
    },
    crm: ghl
      ? {
          async sync(r) {
            await upsertGhlContact(
              {
                firstName: r.name.split(' ')[0],
                email: r.email,
                tags: [ASK_SOURCE],
                source: `promdipreneur.com ${ASK_SOURCE}`,
                fields: {
                  business_type: r.businessType,
                  marketing_consent: r.marketingConsent ? 'yes' : 'no',
                  consent_record: r.consentRecord,
                },
              },
              ghl
            );
          },
        }
      : null,
    onSubmitted: () => incr(new Date().toISOString().slice(0, 10), 'contacts'),
  };
}
