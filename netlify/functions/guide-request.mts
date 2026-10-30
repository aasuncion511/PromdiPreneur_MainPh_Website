// Free guide request -> GHL. Inactive (503) until EBOOK_ACTIVE=true and GHL credentials exist. See docs/EBOOK.md.
import type { Config, Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { handleGuideRequest } from '../../server/guide.ts';
import { ghlConfigFromEnv, upsertGhlContact } from '../../server/ghl.ts';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host)
    return json(403, { ok: false, error: 'forbidden_origin' });
  const raw = await req.text();
  if (raw.length > 10_000) return json(413, { ok: false, error: 'too_large' });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: 'bad_json' });
  }
  const ghl = ghlConfigFromEnv(process.env);
  const limits = getStore({ name: 'guide-ratelimit', consistency: 'strong' });
  const r = await handleGuideRequest(body, context.ip, {
    active: process.env.EBOOK_ACTIVE === 'true',
    upsert: ghl ? (c) => upsertGhlContact(c, ghl) : null,
    rateLimit: {
      async hit(key) {
        const bucket = `${key}:${new Date().toISOString().slice(0, 13)}`;
        const n = (((await limits.get(bucket, { type: 'json' })) as { n: number } | null)?.n ?? 0) + 1;
        await limits.setJSON(bucket, { n });
        return n;
      },
    },
    async hashIp(ip) {
      const d = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(`${process.env.IP_HASH_SALT || ''}|${ip}`)
      );
      return Array.from(new Uint8Array(d).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
    },
  });
  return json(r.status, r.body);
};

export const config: Config = { path: '/api/guide-request' };
