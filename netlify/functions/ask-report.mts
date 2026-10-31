/**
 * Ask PromdiPreneur usage report for Allan: GET /api/ask-report with `Authorization: Bearer <EXPORT_TOKEN>`.
 * Aggregate numbers only (sessions, questions, replies, errors, cap hits, human-help requests) + spend. No chat text.
 */
import type { Config } from '@netlify/functions';
import { timingSafeEqual } from 'node:crypto';
import { askCounters } from '../../server/ask-netlify.ts';
import { capsFromEnv } from '../../server/ask-core.ts';

export default async (req: Request) => {
  const token = process.env.EXPORT_TOKEN || '';
  if (!token) return new Response('Not found', { status: 404 });
  const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const a = new Uint8Array(Buffer.from(given));
  const b = new Uint8Array(Buffer.from(token));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response('Unauthorized', { status: 401 });

  const { stats } = askCounters();
  const days: Record<string, unknown>[] = [];
  const today = new Date();
  for (let i = 0; i < 31; i++) {
    const d = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    const counts = (await stats.get(`counts:${d}`, { type: 'json' })) as Record<string, number> | null;
    const spend = (await stats.get(`spend:day:${d}`, { type: 'json' })) as { usd: number } | null;
    if (counts || spend) days.push({ day: d, ...(counts ?? {}), usd: Number((spend?.usd ?? 0).toFixed(4)) });
  }
  const month = today.toISOString().slice(0, 7);
  const monthSpend = (await stats.get(`spend:month:${month}`, { type: 'json' })) as { usd: number } | null;
  const caps = capsFromEnv(process.env);
  return new Response(
    JSON.stringify(
      {
        month,
        monthSpendUsd: Number((monthSpend?.usd ?? 0).toFixed(4)),
        caps: { dailyUsd: caps.dailyUsd, monthlyUsd: caps.monthlyUsd },
        active: process.env.ASK_ACTIVE === 'true',
        last31Days: days,
        note: 'Spend is estimated from token usage x OPENAI_PRICE_* settings. Check the OpenAI dashboard for the billed amount.',
      },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  );
};

export const config: Config = { path: '/api/ask-report' };
