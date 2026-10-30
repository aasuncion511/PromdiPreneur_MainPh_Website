/**
 * Free Business Guide request pipeline. INACTIVE by default.
 *
 * It accepts a request only when ALL are true (docs/EBOOK.md):
 *   EBOOK_ACTIVE === 'true'  (Allan approved the final PDF, cover and GHL delivery workflow)
 *   GHL is configured        (GHL_PRIVATE_TOKEN + GHL_LOCATION_ID)
 * Delivery is GHL's job: the contact is upserted with tag `lead-magnet:free-guide`, which triggers the approved
 * GHL workflow (email 1 = guide link). This endpoint never returns a download link and never claims delivery.
 */
import type { GhlContact } from './ghl.ts';

export const BUSINESS_TYPES = [
  'Retail / sari-sari / store',
  'Food & beverage',
  'Cleaning & home services',
  'Beauty & wellness',
  'Clinic & healthcare',
  'Professional services',
  'Construction & trades',
  'Trading & distribution',
  'Transport & car rental',
  'Events & hospitality',
  'Other',
] as const;

export const GUIDE_TAG = 'lead-magnet:free-guide';
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

export type GuideErrors = Partial<Record<'firstName' | 'email' | 'businessType' | 'consent', string>>;

export function validateGuide(
  raw: unknown
):
  | { ok: true; value: { firstName: string; email: string; businessType: string; businessName?: string } }
  | { ok: false; errors: GuideErrors } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const errors: GuideErrors = {};
  const firstName = clean(r.firstName, 80);
  const email = clean(r.email, 254).toLowerCase();
  const businessType = clean(r.businessType, 60);
  const businessName = clean(r.businessName, 120);
  if (!firstName) errors.firstName = 'Please tell us your first name.';
  if (!email || !EMAIL_RE.test(email)) errors.email = 'Please enter a valid email so we can send the guide.';
  if (!(BUSINESS_TYPES as readonly string[]).includes(businessType))
    errors.businessType = 'Please choose your type of business.';
  if (r.consent !== true) errors.consent = 'Please agree so we can email you the guide.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { firstName, email, businessType, ...(businessName ? { businessName } : {}) } };
}

export type GuideDeps = {
  active: boolean;
  upsert: ((c: GhlContact) => Promise<string>) | null;
  rateLimit: { hit(key: string): Promise<number> };
  hashIp(ip: string): Promise<string>;
};

export type GuideResult = { status: number; body: { ok: true } | { ok: false; error: string; fields?: GuideErrors } };

export async function handleGuideRequest(raw: unknown, ip: string, deps: GuideDeps): Promise<GuideResult> {
  if (!deps.active || !deps.upsert) return { status: 503, body: { ok: false, error: 'inactive' } };
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  if (typeof r.pp_extra_info === 'string' && r.pp_extra_info.trim()) return { status: 200, body: { ok: true } };
  const v = validateGuide(raw);
  if (!v.ok) return { status: 400, body: { ok: false, error: 'validation', fields: v.errors } };
  if ((await deps.rateLimit.hit(await deps.hashIp(ip || 'unknown'))) > 5)
    return { status: 429, body: { ok: false, error: 'rate_limited' } };
  const src = (r.source && typeof r.source === 'object' ? r.source : {}) as Record<string, unknown>;
  try {
    await deps.upsert({
      firstName: v.value.firstName,
      email: v.value.email,
      companyName: v.value.businessName,
      tags: [GUIDE_TAG],
      source: 'promdipreneur.com free guide',
      fields: {
        business_type: v.value.businessType,
        lead_magnet: 'Free Business Guide',
        utm_source: clean(src.utm_source, 150),
        utm_medium: clean(src.utm_medium, 150),
        utm_campaign: clean(src.utm_campaign, 150),
        landing_page: clean(src.landingPage, 300),
        email_permission: `free-guide-v1 ${new Date().toISOString()}`,
      },
    });
  } catch {
    return { status: 502, body: { ok: false, error: 'crm_failed' } };
  }
  return { status: 200, body: { ok: true } };
}
