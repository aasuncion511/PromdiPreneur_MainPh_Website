/**
 * Free ebook request pipeline — "The Business Opening Checklist PH". INACTIVE by default.
 *
 * Accepts a request only when ALL are true (docs/EBOOK.md):
 *   EBOOK_ACTIVE === 'true'  (PDF hosted, GHL delivery workflow tested, source-verification review approved)
 *   GHL is configured        (GHL_PRIVATE_TOKEN + GHL_LOCATION_ID)
 *
 * Flow (v3 §8, Addendum §4): validate → spam/rate checks → GHL contact upsert (dedupe by email, one tag
 * "LM | Ebook") → { ok: true } ONLY if GHL confirmed the upsert. The GHL workflow then sends ONE transactional
 * delivery email with the PDF link. No sales opportunity is created for a download. Marketing follow-up only
 * if marketing_consent = yes. This endpoint never returns a download link and never claims delivery itself.
 */
import type { GhlContact } from './ghl.ts';

/** Addendum §5: micro-to-small brick-and-mortar owners, including people still planning to open. */
export const BUSINESS_TYPES = [
  'Not open yet — still planning',
  'Café, restaurant or food stall',
  'Salon, barbershop or spa',
  'Sari-sari store, minimart or retail shop',
  'Water refilling station',
  'Laundry shop',
  'Cleaning or home services',
  'Clinic or pharmacy',
  'Professional or office services',
  'Trading or distribution',
  'Other',
] as const;

export const EBOOK_TAG = 'LM | Ebook';
export const LEAD_MAGNET_NAME = 'The Business Opening Checklist PH';
/** Bump when the consent wording on the form changes (stored with each contact). */
export const CONSENT_VERSION = 'ebook-form-v1';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v: unknown, max: number) =>
  typeof v === 'string'
    ? v
        // eslint-disable-next-line no-control-regex -- deliberately stripping control characters from user input
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : '';

export type GuideErrors = Partial<Record<'firstName' | 'email' | 'businessType', string>>;

export function validateGuide(
  raw: unknown
):
  | { ok: true; value: { firstName: string; email: string; businessType: string; marketingConsent: boolean } }
  | { ok: false; errors: GuideErrors } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const errors: GuideErrors = {};
  const firstName = clean(r.firstName, 80);
  const email = clean(r.email, 254).toLowerCase();
  const businessType = clean(r.businessType, 60);
  if (!firstName) errors.firstName = 'Please tell us your first name.';
  if (!email || !EMAIL_RE.test(email)) errors.email = 'Please enter a valid email so we can send your guide.';
  if (!(BUSINESS_TYPES as readonly string[]).includes(businessType))
    errors.businessType = 'Please choose your business type.';
  if (Object.keys(errors).length) return { ok: false, errors };
  // Marketing consent is optional and must be an explicit `true`; anything else is "no".
  return { ok: true, value: { firstName, email, businessType, marketingConsent: r.marketingConsent === true } };
}

export type GuideDeps = {
  active: boolean;
  upsert: ((c: GhlContact) => Promise<string>) | null;
  rateLimit: { hit(key: string): Promise<number> };
  hashIp(ip: string): Promise<string>;
  now?: () => Date;
};

export type GuideResult = { status: number; body: { ok: true } | { ok: false; error: string; fields?: GuideErrors } };

export async function handleGuideRequest(raw: unknown, ip: string, deps: GuideDeps): Promise<GuideResult> {
  if (!deps.active || !deps.upsert) return { status: 503, body: { ok: false, error: 'inactive' } };
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  // Honeypot filled: bot. Answer like success so it doesn't retry; nothing reaches GHL.
  if (typeof r.pp_extra_info === 'string' && r.pp_extra_info.trim()) return { status: 200, body: { ok: true } };
  const v = validateGuide(raw);
  if (!v.ok) return { status: 400, body: { ok: false, error: 'validation', fields: v.errors } };
  if ((await deps.rateLimit.hit(await deps.hashIp(ip || 'unknown'))) > 5) {
    return { status: 429, body: { ok: false, error: 'rate_limited' } };
  }
  const src = (r.source && typeof r.source === 'object' ? r.source : {}) as Record<string, unknown>;
  const now = (deps.now ?? (() => new Date()))().toISOString();
  try {
    await deps.upsert({
      firstName: v.value.firstName,
      email: v.value.email,
      tags: [EBOOK_TAG],
      source: 'promdipreneur.com free ebook',
      fields: {
        business_type: v.value.businessType,
        lead_magnet_name: LEAD_MAGNET_NAME,
        utm_source: clean(src.utm_source, 150),
        utm_medium: clean(src.utm_medium, 150),
        utm_campaign: clean(src.utm_campaign, 150),
        utm_content: clean(src.utm_content, 150),
        landing_page: clean(src.landingPage, 300),
        referrer: clean(src.referrer, 300),
        // Resource fulfilment is the request itself; ongoing marketing needs the separate opt-in.
        marketing_consent: v.value.marketingConsent ? 'yes' : 'no',
        consent_record: `${CONSENT_VERSION} | marketing=${v.value.marketingConsent ? 'yes' : 'no'} | ${now}`,
      },
    });
  } catch {
    // GHL did not confirm: never report success (the visitor sees "not sent" + email fallback).
    return { status: 502, body: { ok: false, error: 'crm_failed' } };
  }
  return { status: 200, body: { ok: true } };
}
