/**
 * The inquiry pipeline, independent of any host: validate → spam checks → rate limit → durable store →
 * admin email → answer. The Netlify Function and the local QA server inject storage and mail.
 *
 * Contract with the browser: success is { ok: true, id } with HTTP 200 and is returned ONLY after the record
 * is stored AND the notification email was accepted by the mail provider. Anything else is an error status
 * with { ok: false, error }, and the page shows the failure state with email/Messenger fallbacks.
 */
import { validateInquiry, type InquiryInput } from './validate.ts';

export type InquiryRecord = InquiryInput & {
  id: string;
  receivedAt: string;
  ipHash: string;
  userAgent: string;
  status: 'received' | 'notified' | 'notify_failed';
  notifyError?: string;
  crmStatus?: 'synced' | 'failed' | 'not_configured';
};

export type Deps = {
  /** false when the mail provider is not configured: the endpoint then refuses submissions (form NOT LIVE). */
  configured: boolean;
  store: { put(record: InquiryRecord): Promise<void> };
  /** Returns the hit count for this key in the current window, including this hit. */
  rateLimit: { hit(key: string): Promise<number> };
  mailer: { send(mail: Mail): Promise<void> };
  /** Optional CRM sync (GHL). Best-effort: runs after store + email; a failure is recorded, never shown as success/failure to the visitor. */
  crm?: { sync(record: InquiryRecord): Promise<void> } | null;
  hashIp(ip: string): Promise<string>;
  notifyTo: string;
  maxPerHour?: number;
  now?: () => Date;
  newId?: () => string;
};

export type Mail = { to: string; subject: string; text: string; html: string; replyTo: string };

export type Result = {
  status: number;
  body: { ok: true; id: string } | { ok: false; error: string; fields?: Record<string, string> };
};

/** Hidden field real visitors never see or fill. */
export const HONEYPOT_FIELD = 'pp_extra_info';
/** Submissions faster than this after the form rendered are treated as automated. */
export const MIN_FILL_MS = 2500;

export async function handleInquiry(raw: unknown, ip: string, userAgent: string, deps: Deps): Promise<Result> {
  if (!deps.configured) return { status: 503, body: { ok: false, error: 'not_configured' } };

  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  // Honeypot filled: almost certainly a bot. Answer like a success so it does not retry, store nothing.
  if (typeof r[HONEYPOT_FIELD] === 'string' && r[HONEYPOT_FIELD].trim() !== '') {
    return { status: 200, body: { ok: true, id: 'discarded' } };
  }
  // Too fast to be typed by a person: ask them to try again (a real person sees a clear message, not fake success).
  const elapsed = typeof r.elapsedMs === 'number' ? r.elapsedMs : 0;
  if (elapsed < MIN_FILL_MS) return { status: 422, body: { ok: false, error: 'too_fast' } };

  const v = validateInquiry(raw);
  if (!v.ok)
    return { status: 400, body: { ok: false, error: 'validation', fields: v.errors as Record<string, string> } };

  const ipHash = await deps.hashIp(ip || 'unknown');
  const hits = await deps.rateLimit.hit(ipHash);
  if (hits > (deps.maxPerHour ?? 5)) return { status: 429, body: { ok: false, error: 'rate_limited' } };

  const now = (deps.now ?? (() => new Date()))();
  const id = (deps.newId ?? defaultId)(now);
  const record: InquiryRecord = {
    ...v.value,
    id,
    receivedAt: now.toISOString(),
    ipHash,
    userAgent: userAgent.slice(0, 200),
    status: 'received',
  };

  try {
    await deps.store.put(record);
  } catch {
    return { status: 503, body: { ok: false, error: 'store_failed' } };
  }

  try {
    await deps.mailer.send(buildMail(record, deps.notifyTo));
  } catch (err) {
    // The record is kept (nothing is lost) but the visitor is told it did not go through, so they can use a fallback.
    await deps.store
      .put({
        ...record,
        status: 'notify_failed',
        notifyError: String(err instanceof Error ? err.message : err).slice(0, 300),
      })
      .catch(() => {});
    return { status: 502, body: { ok: false, error: 'notify_failed' } };
  }

  let crmStatus: InquiryRecord['crmStatus'] = 'not_configured';
  if (deps.crm) {
    crmStatus = await deps.crm.sync(record).then(
      () => 'synced' as const,
      () => 'failed' as const
    );
  }
  await deps.store.put({ ...record, status: 'notified', crmStatus }).catch(() => {});
  return { status: 200, body: { ok: true, id } };
}

function defaultId(now: Date) {
  return `${now.toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
}

export function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

export function buildMail(r: InquiryRecord, to: string): Mail {
  const who = (r.businessName || r.name).replace(/[\r\n]+/g, ' ').slice(0, 80);
  const subject = `[PromdiPreneur] New Business Question — ${who}`;
  const src = r.source;
  const campaign =
    [src.utm_source, src.utm_medium, src.utm_campaign, src.utm_content, src.utm_term].filter(Boolean).join(' / ') ||
    'none';
  const rows: [string, string][] = [
    ['Name', r.name],
    ['Email', r.email],
    ['Business', r.businessName || '—'],
    [
      'Prefers reply by',
      r.replyPreference === 'messenger' ? 'Messenger (they will start the chat on Facebook)' : 'Email',
    ],
    ['Received', `${r.receivedAt} (UTC)`],
    ['Campaign (utm)', campaign],
    ['Landing page', src.landingPage],
    ['Referrer', src.referrer || '—'],
    ['Record ID', r.id],
  ];
  const text = [
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'What’s slowing down their business:',
    r.message,
    '',
    'Reply to this email to answer them directly.',
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#14231B">
<h2 style="color:#004C25;margin:0 0 12px">New business question</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="color:#555;vertical-align:top">${escapeHtml(k)}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`
    )
    .join('')}</table>
<h3 style="color:#004C25;margin:16px 0 6px">What’s slowing down their business</h3>
<p style="white-space:pre-wrap;background:#F7F7F3;padding:12px;border-radius:8px">${escapeHtml(r.message)}</p>
<p style="color:#555">Reply to this email to answer them directly.</p></div>`;
  return { to, subject, text, html, replyTo: r.email };
}
