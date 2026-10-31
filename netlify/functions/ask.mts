import type { Config, Context } from '@netlify/functions';
import { handleAsk } from '../../server/ask-core.ts';
import { askDeps } from '../../server/ask-netlify.ts';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/** Ask PromdiPreneur (Feature Addendum 01). POST { sessionId, messages:[{role,content}] } → { ok, reply }. */
export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });
  if (!(req.headers.get('content-type') || '').includes('application/json'))
    return json(415, { ok: false, error: 'unsupported_type' });
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host)
    return json(403, { ok: false, error: 'forbidden_origin' });
  const raw = await req.text();
  if (raw.length > 16_000) return json(413, { ok: false, error: 'too_long' });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: 'bad_json' });
  }
  try {
    const r = await handleAsk(body, context.ip, askDeps());
    return json(r.status, r.body);
  } catch (err) {
    console.error('ask failed', err instanceof Error ? err.message : err); // never logs the question text
    return json(500, { ok: false, error: 'server_error' });
  }
};

export const config: Config = { path: '/api/ask' };
