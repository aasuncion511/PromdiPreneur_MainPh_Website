/**
 * Production wiring for Netlify: Netlify Blobs (site-scoped, private, no extra account) for storage and
 * rate limiting, Resend's HTTP API for the admin email. Secrets come from Netlify environment variables only.
 */
import { getStore } from '@netlify/blobs';
import type { Deps, InquiryRecord, Mail } from './inquiry-core.ts';
import { ghlConfigFromEnv, upsertGhlContact } from './ghl.ts';

const env = (k: string) => (typeof process !== 'undefined' ? process.env[k] : undefined) || '';

export const INQUIRY_STORE = 'inquiries';

export function netlifyDeps(): Deps {
  const apiKey = env('RESEND_API_KEY');
  const from = env('INQUIRY_NOTIFY_FROM');
  const to = env('INQUIRY_NOTIFY_TO') || 'admin@promdipreneur.com';
  const inquiries = getStore({ name: INQUIRY_STORE, consistency: 'strong' });
  const limits = getStore({ name: 'inquiry-ratelimit', consistency: 'strong' });

  const ghl = ghlConfigFromEnv(process.env);

  return {
    configured: Boolean(apiKey && from),
    crm: ghl
      ? {
          async sync(r: InquiryRecord) {
            await upsertGhlContact(
              {
                firstName: r.name.split(' ')[0],
                email: r.email,
                companyName: r.businessName,
                tags: ['website-inquiry'],
                source: 'promdipreneur.com contact form',
                fields: {
                  utm_source: r.source.utm_source,
                  utm_medium: r.source.utm_medium,
                  utm_campaign: r.source.utm_campaign,
                  landing_page: r.source.landingPage,
                },
              },
              ghl
            );
          },
        }
      : null,
    notifyTo: to,
    store: {
      async put(record: InquiryRecord) {
        await inquiries.setJSON(record.id, record);
      },
    },
    rateLimit: {
      async hit(key: string) {
        const bucket = `${key}:${new Date().toISOString().slice(0, 13)}`; // one window per UTC hour
        const current = ((await limits.get(bucket, { type: 'json' })) as { n: number } | null)?.n ?? 0;
        await limits.setJSON(bucket, { n: current + 1 });
        return current + 1;
      },
    },
    async hashIp(ip: string) {
      const data = new TextEncoder().encode(`${env('IP_HASH_SALT')}|${ip}`);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
    },
    mailer: {
      async send(mail: Mail) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to: [mail.to],
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
            reply_to: mail.replyTo,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
      },
    },
  };
}
