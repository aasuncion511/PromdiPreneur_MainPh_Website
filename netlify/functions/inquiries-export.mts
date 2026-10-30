/**
 * Protected CSV export of stored inquiries for Allan: GET /api/inquiries.csv with
 * `Authorization: Bearer <EXPORT_TOKEN>`. Disabled (404) when EXPORT_TOKEN is not set. No public admin page.
 */
import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';
import { INQUIRY_STORE } from '../../server/netlify-deps.ts';
import { toCsv } from '../../server/csv.ts';
import type { InquiryRecord } from '../../server/inquiry-core.ts';

export default async (req: Request) => {
  const token = process.env.EXPORT_TOKEN || '';
  if (!token) return new Response('Not found', { status: 404 });
  const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const a = new Uint8Array(Buffer.from(given));
  const b = new Uint8Array(Buffer.from(token));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response('Unauthorized', { status: 401 });

  const store = getStore({ name: INQUIRY_STORE, consistency: 'strong' });
  const { blobs } = await store.list();
  const records: InquiryRecord[] = [];
  for (const { key } of blobs) {
    const r = (await store.get(key, { type: 'json' })) as InquiryRecord | null;
    if (r) records.push(r);
  }
  records.sort((x, y) => x.receivedAt.localeCompare(y.receivedAt));
  return new Response(toCsv(records), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="promdipreneur-inquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
};

export const config: Config = { path: '/api/inquiries.csv' };
