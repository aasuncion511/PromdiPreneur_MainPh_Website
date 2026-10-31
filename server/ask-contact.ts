/**
 * "Talk to a Person" from Ask PromdiPreneur (Feature Addendum 01 §4).
 * Voluntary short form: name, email, business type, optional summary. The visitor's chat questions are attached
 * ONLY if they tick "include my questions", and they see exactly what will be sent. Assistant replies are never sent.
 * Reply request and marketing opt-in are separate. Success is returned only after the email to the business
 * inbox was accepted. Source label: "Ask PromdiPreneur".
 */
import { BUSINESS_TYPES } from './guide.ts';
import { escapeHtml } from './inquiry-core.ts';

export const ASK_SOURCE = 'Ask PromdiPreneur';
export const ASK_CONTACT_CONSENT_VERSION = 'ask-contact-v1';
export const HONEYPOT = 'pp_extra_info';

export type AskContact = {
  name: string;
  email: string;
  businessType: string;
  summary?: string;
  questions?: string[];
  marketingConsent: boolean;
};

export type AskContactRecord = AskContact & {
  id: string;
  receivedAt: string;
  source: typeof ASK_SOURCE;
  consentRecord: string;
  ipHash: string;
  status: 'received' | 'notified' | 'notify_failed';
  crmStatus?: 'synced' | 'failed' | 'not_configured';
};

export type AskContactDeps = {
  configured: boolean;
  store: { put(r: AskContactRecord): Promise<void> };
  mailer: { send(m: { to: string; subject: string; text: string; html: string; replyTo: string }): Promise<void> };
  crm?: { sync(r: AskContactRecord): Promise<void> } | null;
  rateLimit: { hit(key: string): Promise<number> };
  hashIp(ip: string): Promise<string>;
  notifyTo: string;
  onSubmitted?: () => Promise<void>;
  now?: () => Date;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// eslint-disable-next-line no-control-regex -- deliberately stripping control characters from user input
const one = (v: unknown) => (typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim() : '');
const multi = (v: unknown) =>
  // eslint-disable-next-line no-control-regex -- deliberately stripping control characters from user input
  typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim() : '';

export function validateAskContact(
  raw: unknown
): { ok: true; value: AskContact } | { ok: false; errors: Record<string, string> } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const name = one(r.name);
  if (!name) errors.name = 'Please tell us your name.';
  else if (name.length > 100) errors.name = 'Please keep your name under 100 characters.';
  const email = one(r.email).toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email))
    errors.email = 'Please enter a valid email so we can reply.';
  const businessType = one(r.businessType);
  if (!(BUSINESS_TYPES as readonly string[]).includes(businessType))
    errors.businessType = 'Please choose your type of business.';
  const summary = multi(r.summary);
  if (summary.length > 1500) errors.summary = 'Please keep this under 1,500 characters.';
  if (r.replyConsent !== true) errors.replyConsent = 'Please agree that we may reply to you about this request.';
  let questions: string[] | undefined;
  if (r.includeQuestions === true) {
    if (!Array.isArray(r.questions)) errors.questions = 'Could not read your questions.';
    else
      questions = r.questions
        .filter((q) => typeof q === 'string')
        .slice(-5)
        .map((q) => multi(q).slice(0, 1000))
        .filter(Boolean);
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      email,
      businessType,
      ...(summary ? { summary } : {}),
      ...(questions?.length ? { questions } : {}),
      marketingConsent: r.marketingConsent === true,
    },
  };
}

export async function handleAskContact(raw: unknown, ip: string, deps: AskContactDeps) {
  if (!deps.configured) return { status: 503, body: { ok: false, error: 'not_configured' } };
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  if (typeof r[HONEYPOT] === 'string' && (r[HONEYPOT] as string).trim()) return { status: 200, body: { ok: true } };
  if (typeof r.elapsedMs !== 'number' || r.elapsedMs < 2500)
    return { status: 422, body: { ok: false, error: 'too_fast' } };
  const v = validateAskContact(raw);
  if (!v.ok) return { status: 400, body: { ok: false, error: 'validation', fields: v.errors } };
  const ipHash = await deps.hashIp(ip || 'unknown');
  if ((await deps.rateLimit.hit(`askc:${ipHash}`)) > 5)
    return { status: 429, body: { ok: false, error: 'rate_limited' } };

  const now = (deps.now ?? (() => new Date()))();
  const record: AskContactRecord = {
    ...v.value,
    id: `ask-${now.toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`,
    receivedAt: now.toISOString(),
    source: ASK_SOURCE,
    consentRecord: `${ASK_CONTACT_CONSENT_VERSION} | reply=yes | marketing=${v.value.marketingConsent ? 'yes' : 'no'} | questions=${v.value.questions ? 'included' : 'not included'} | ${now.toISOString()}`,
    ipHash,
    status: 'received',
  };
  try {
    await deps.store.put(record);
  } catch {
    return { status: 503, body: { ok: false, error: 'store_failed' } };
  }
  try {
    await deps.mailer.send(buildAskContactMail(record, deps.notifyTo));
  } catch {
    await deps.store.put({ ...record, status: 'notify_failed' }).catch(() => {});
    return { status: 502, body: { ok: false, error: 'notify_failed' } };
  }
  let crmStatus: AskContactRecord['crmStatus'] = 'not_configured';
  if (deps.crm)
    crmStatus = await deps.crm.sync(record).then(
      () => 'synced' as const,
      () => 'failed' as const
    );
  await deps.store.put({ ...record, status: 'notified', crmStatus }).catch(() => {});
  await deps.onSubmitted?.().catch(() => {});
  return { status: 200, body: { ok: true } };
}

export function buildAskContactMail(r: AskContactRecord, to: string) {
  const subject = `[PromdiPreneur] ${ASK_SOURCE} — ${r.name.slice(0, 60)} wants to talk to a person`;
  const rows: [string, string][] = [
    ['Source', ASK_SOURCE],
    ['Name', r.name],
    ['Email', r.email],
    ['Business type', r.businessType],
    ['Marketing emails', r.marketingConsent ? 'Yes, opted in' : 'No (reply about this request only)'],
    ['Received', `${r.receivedAt} (UTC)`],
    ['Record ID', r.id],
  ];
  const parts = [
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Their summary:',
    r.summary || '(none)',
    '',
    r.questions
      ? `Questions they chose to share from the AI chat:\n${r.questions.map((q) => `- ${q}`).join('\n')}`
      : 'Chat questions: not shared by the visitor.',
    '',
    'Reply to this email to answer them directly.',
  ];
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#14231a">
<h2 style="color:#00441b;margin:0 0 12px">${ASK_SOURCE}: request to talk to a person</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="color:#555">${escapeHtml(k)}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`).join('')}</table>
<h3 style="color:#00441b;margin:16px 0 6px">Their summary</h3>
<p style="white-space:pre-wrap;background:#f7f7f3;padding:12px;border-radius:8px">${escapeHtml(r.summary || '(none)')}</p>
<h3 style="color:#00441b;margin:16px 0 6px">Chat questions</h3>
${r.questions ? `<ul>${r.questions.map((q) => `<li style="white-space:pre-wrap">${escapeHtml(q)}</li>`).join('')}</ul>` : '<p>Not shared by the visitor.</p>'}
<p style="color:#555">Reply to this email to answer them directly.</p></div>`;
  return { to, subject, text: parts.join('\n'), html, replyTo: r.email };
}
