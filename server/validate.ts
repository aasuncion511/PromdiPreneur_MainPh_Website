/**
 * Inquiry payload rules, shared by the browser form (instant feedback) and the server (the real gate).
 * Plain TypeScript with erasable syntax only, so Node runs it directly and Netlify bundles it.
 */

export const LIMITS = {
  name: 100,
  email: 254,
  businessName: 120,
  messageMin: 10,
  message: 3000,
  utm: 150,
  url: 300,
} as const;
export const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type ReplyPreference = 'email' | 'messenger';

export type InquiryInput = {
  name: string;
  email: string;
  businessName?: string;
  message: string;
  replyPreference: ReplyPreference;
  privacyConsent: true;
  source: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    landingPage: string;
    referrer?: string;
  };
};

export type FieldErrors = Partial<
  Record<'name' | 'email' | 'businessName' | 'message' | 'replyPreference' | 'privacyConsent', string>
>;

// Pragmatic email check: one @, a dot in the domain, no spaces. Real deliverability is proven by the reply.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(v: unknown): string {
  // eslint-disable-next-line no-control-regex -- deliberately stripping control characters from user input
  return typeof v === 'string' ? v.replace(/\u0000/g, '').trim() : '';
}

/** Strips control characters except newlines/tabs (message keeps its line breaks). */
function text(v: unknown): string {
  // eslint-disable-next-line no-control-regex -- deliberately stripping control characters from user input
  return str(v).replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function oneLine(v: unknown): string {
  return text(v).replace(/\s+/g, ' ');
}

export function validateInquiry(raw: unknown): { ok: true; value: InquiryInput } | { ok: false; errors: FieldErrors } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const name = oneLine(r.name);
  if (!name) errors.name = 'Please tell us your name.';
  else if (name.length > LIMITS.name) errors.name = `Please keep your name under ${LIMITS.name} characters.`;

  const email = oneLine(r.email).toLowerCase();
  if (!email) errors.email = 'Please enter your email so we can reply.';
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email))
    errors.email = 'That email address doesn’t look right. Please check it.';

  const businessName = oneLine(r.businessName);
  if (businessName.length > LIMITS.businessName)
    errors.businessName = `Please keep the business name under ${LIMITS.businessName} characters.`;

  const message = text(r.message);
  if (!message) errors.message = 'Please tell us a little about what’s slowing your business down.';
  else if (message.length < LIMITS.messageMin) errors.message = 'Please add a bit more detail so we can help.';
  else if (message.length > LIMITS.message)
    errors.message = `Please keep your message under ${LIMITS.message} characters.`;

  const replyPreference =
    r.replyPreference === 'messenger'
      ? 'messenger'
      : r.replyPreference === 'email' || r.replyPreference === undefined
        ? 'email'
        : null;
  if (!replyPreference) errors.replyPreference = 'Please choose how we should reply.';

  if (r.privacyConsent !== true) errors.privacyConsent = 'Please agree to be contacted about this inquiry.';

  if (Object.keys(errors).length) return { ok: false, errors };

  const s = (r.source && typeof r.source === 'object' ? r.source : {}) as Record<string, unknown>;
  const source: InquiryInput['source'] = { landingPage: oneLine(s.landingPage).slice(0, LIMITS.url) || 'unknown' };
  for (const k of UTM_FIELDS) {
    const v = oneLine(s[k]).slice(0, LIMITS.utm);
    if (v) source[k] = v;
  }
  const referrer = oneLine(s.referrer).slice(0, LIMITS.url);
  if (referrer) source.referrer = referrer;

  return {
    ok: true,
    value: {
      name,
      email,
      ...(businessName ? { businessName } : {}),
      message,
      replyPreference: replyPreference as ReplyPreference,
      privacyConsent: true,
      source,
    },
  };
}
