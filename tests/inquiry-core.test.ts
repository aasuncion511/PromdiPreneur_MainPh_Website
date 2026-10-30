// Run: npm run test:api   (Node's built-in test runner; Node >= 22.18 runs TypeScript directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMail,
  handleInquiry,
  HONEYPOT_FIELD,
  type Deps,
  type InquiryRecord,
  type Mail,
} from '../server/inquiry-core.ts';
import { toCsv } from '../server/csv.ts';
import { validateInquiry } from '../server/validate.ts';

function record(input: unknown, status: InquiryRecord['status'] = 'received'): InquiryRecord {
  const v = validateInquiry(input);
  if (!v.ok) throw new Error('fixture should be valid');
  return { ...v.value, id: '1', receivedAt: 't', ipHash: 'h', userAgent: '', status };
}

const good = {
  name: 'Juan Dela Cruz',
  email: 'Juan@Example.com ',
  businessName: 'JDC Laundry',
  message: 'Our Messenger inquiries get buried and we forget to follow up.',
  replyPreference: 'email',
  privacyConsent: true,
  elapsedMs: 15000,
  source: {
    utm_source: 'facebook',
    utm_campaign: 'oct-launch',
    landingPage: 'https://promdipreneur.com/',
    referrer: 'https://l.facebook.com/',
  },
};

function fakeDeps(over: Partial<Deps> = {}) {
  const saved: InquiryRecord[] = [];
  const sent: Mail[] = [];
  let hits = 0;
  const deps: Deps = {
    configured: true,
    notifyTo: 'admin@promdipreneur.com',
    store: { put: async (r) => void saved.push(r) },
    rateLimit: { hit: async () => ++hits },
    mailer: { send: async (m) => void sent.push(m) },
    hashIp: async (ip) => `h${ip.length}x`,
    ...over,
  };
  return { deps, saved, sent };
}

test('accepted inquiry is stored, emailed, and answered ok only after both', async () => {
  const { deps, saved, sent } = fakeDeps();
  const r = await handleInquiry(good, '203.0.113.9', 'UA', deps);
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
  assert.equal(saved.at(-1)!.status, 'notified');
  assert.equal(saved[0].email, 'juan@example.com');
  assert.equal(saved[0].ipHash, 'h11x');
  assert.ok(!JSON.stringify(saved).includes('203.0.113.9'), 'raw IP never stored');
  assert.equal(saved[0].source.utm_source, 'facebook');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, '[PromdiPreneur] New Business Question — JDC Laundry');
  assert.equal(sent[0].to, 'admin@promdipreneur.com');
  assert.equal(sent[0].replyTo, 'juan@example.com');
});

test('mail provider failure keeps the record but does NOT report success', async () => {
  const { deps, saved } = fakeDeps({
    mailer: {
      send: async () => {
        throw new Error('resend 500');
      },
    },
  });
  const r = await handleInquiry(good, '1.1.1.1', 'UA', deps);
  assert.equal(r.status, 502);
  assert.equal(r.body.ok, false);
  assert.equal(saved.at(-1)!.status, 'notify_failed');
});

test('storage failure does NOT report success and sends no email', async () => {
  const { deps, sent } = fakeDeps({
    store: {
      put: async () => {
        throw new Error('blobs down');
      },
    },
  });
  const r = await handleInquiry(good, '1.1.1.1', 'UA', deps);
  assert.equal(r.status, 503);
  assert.equal(sent.length, 0);
});

test('unconfigured endpoint refuses (form NOT LIVE) and stores nothing', async () => {
  const { deps, saved } = fakeDeps({ configured: false });
  const r = await handleInquiry(good, '1.1.1.1', 'UA', deps);
  assert.deepEqual([r.status, r.body], [503, { ok: false, error: 'not_configured' }]);
  assert.equal(saved.length, 0);
});

test('honeypot submissions are discarded silently', async () => {
  const { deps, saved, sent } = fakeDeps();
  const r = await handleInquiry({ ...good, [HONEYPOT_FIELD]: 'http://spam' }, '1.1.1.1', 'UA', deps);
  assert.equal(r.status, 200);
  assert.equal(saved.length + sent.length, 0);
});

test('instant submissions are rejected with a retry message', async () => {
  const { deps, saved } = fakeDeps();
  const r = await handleInquiry({ ...good, elapsedMs: 300 }, '1.1.1.1', 'UA', deps);
  assert.equal(r.status, 422);
  assert.equal(saved.length, 0);
});

test('rate limit: 6th submission in the hour is refused', async () => {
  const { deps } = fakeDeps();
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) statuses.push((await handleInquiry(good, '1.1.1.1', 'UA', deps)).status);
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
});

test('validation: required fields, consent must be true, sizes enforced', () => {
  const v = validateInquiry({ name: '', email: 'nope', message: 'short', privacyConsent: 'true' });
  assert.equal(v.ok, false);
  if (!v.ok) assert.deepEqual(Object.keys(v.errors).sort(), ['email', 'message', 'name', 'privacyConsent']);
  const long = validateInquiry({ ...good, message: 'x'.repeat(3001) });
  assert.equal(long.ok, false);
  const bad = validateInquiry({ ...good, replyPreference: 'sms' });
  assert.equal(bad.ok, false);
});

test('validation strips control characters and caps source fields', () => {
  const v = validateInquiry({
    ...good,
    name: 'Ana\u0007 Reyes',
    source: { landingPage: 'https://x', utm_source: 'a'.repeat(500) },
  });
  assert.equal(v.ok, true);
  if (v.ok) {
    assert.equal(v.value.name, 'Ana Reyes');
    assert.equal(v.value.source.utm_source!.length, 150);
  }
});

test('notification email escapes HTML and blocks subject header injection', () => {
  const rec = record({ ...good, businessName: 'Evil\r\nBcc: x@y.z', message: '<script>alert(1)</script> please help' });
  const m = buildMail(rec, 'admin@promdipreneur.com');
  assert.ok(!m.subject.includes('\n') && !m.subject.includes('\r'));
  assert.ok(!m.html.includes('<script>'));
  assert.ok(m.html.includes('&lt;script&gt;'));
});

test('CSV export neutralises spreadsheet formulas', () => {
  const rec = record({ ...good, name: '=HYPERLINK("http://evil")' }, 'notified');
  const csv = toCsv([rec]);
  assert.ok(csv.includes(`"'=HYPERLINK(""http://evil"")"`));
});

test('optional CRM sync: success recorded; CRM failure never blocks or fakes the visitor result', async () => {
  const { deps, saved } = fakeDeps({ crm: { sync: async () => {} } });
  assert.equal((await handleInquiry(good, '1.1.1.1', 'UA', deps)).status, 200);
  assert.equal(saved.at(-1)!.crmStatus, 'synced');
  const f = fakeDeps({
    crm: {
      sync: async () => {
        throw new Error('GHL down');
      },
    },
  });
  const r = await handleInquiry(good, '1.1.1.1', 'UA', f.deps);
  assert.equal(r.status, 200, 'stored + emailed = accepted, even if CRM sync failed');
  assert.equal(f.saved.at(-1)!.crmStatus, 'failed');
});
