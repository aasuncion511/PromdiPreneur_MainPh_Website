// Free guide endpoint + GHL adapter. Run: npm run test:api
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleGuideRequest, GUIDE_TAG, type GuideDeps } from '../server/guide.ts';
import { buildUpsertBody, ghlConfigFromEnv, upsertGhlContact, type GhlContact } from '../server/ghl.ts';

const good = {
  firstName: 'Ana',
  email: 'Ana@Example.com',
  businessType: 'Food & beverage',
  consent: true,
  source: { utm_source: 'facebook', landingPage: 'https://promdipreneur.com/free-guide' },
};

function deps(over: Partial<GuideDeps> = {}) {
  const sent: GhlContact[] = [];
  let n = 0;
  const d: GuideDeps = {
    active: true,
    upsert: async (c) => (sent.push(c), 'id1'),
    rateLimit: { hit: async () => ++n },
    hashIp: async () => 'h',
    ...over,
  };
  return { d, sent };
}

test('guide: INACTIVE by default refuses and sends nothing to GHL', async () => {
  const { d, sent } = deps({ active: false });
  const r = await handleGuideRequest(good, '1.1.1.1', d);
  assert.deepEqual([r.status, r.body], [503, { ok: false, error: 'inactive' }]);
  assert.equal(sent.length, 0);
});

test('guide: active but GHL not configured also refuses', async () => {
  const { d } = deps({ upsert: null });
  assert.equal((await handleGuideRequest(good, '1.1.1.1', d)).status, 503);
});

test('guide: active request upserts contact with tag, business type, UTM and permission stamp', async () => {
  const { d, sent } = deps();
  const r = await handleGuideRequest(good, '1.1.1.1', d);
  assert.equal(r.status, 200);
  assert.equal(sent[0].email, 'ana@example.com');
  assert.deepEqual(sent[0].tags, [GUIDE_TAG]);
  assert.equal(sent[0].fields!.business_type, 'Food & beverage');
  assert.equal(sent[0].fields!.utm_source, 'facebook');
  assert.match(sent[0].fields!.email_permission!, /^free-guide-v1 \d{4}-/);
});

test('guide: validation (business type must be from the list, consent required)', async () => {
  const { d, sent } = deps();
  const r = await handleGuideRequest({ ...good, businessType: 'Hacker', consent: false, email: 'x' }, '1.1.1.1', d);
  assert.equal(r.status, 400);
  assert.equal(sent.length, 0);
  if (!r.body.ok) assert.deepEqual(Object.keys(r.body.fields!).sort(), ['businessType', 'consent', 'email']);
});

test('guide: GHL failure is reported as failure, never success', async () => {
  const { d } = deps({
    upsert: async () => {
      throw new Error('GHL 500');
    },
  });
  const r = await handleGuideRequest(good, '1.1.1.1', d);
  assert.deepEqual([r.status, r.body], [502, { ok: false, error: 'crm_failed' }]);
});

test('guide: honeypot discarded, rate limit after 5', async () => {
  const { d, sent } = deps();
  assert.equal((await handleGuideRequest({ ...good, pp_extra_info: 'spam' }, '1', d)).status, 200);
  assert.equal(sent.length, 0);
  const s: number[] = [];
  for (let i = 0; i < 6; i++) s.push((await handleGuideRequest(good, '1', d)).status);
  assert.deepEqual(s, [200, 200, 200, 200, 200, 429]);
});

test('ghl: config requires token + location; bad field map JSON is ignored', () => {
  assert.equal(ghlConfigFromEnv({}), null);
  const c = ghlConfigFromEnv({ GHL_PRIVATE_TOKEN: 't', GHL_LOCATION_ID: 'L', GHL_CUSTOM_FIELDS: '{bad' });
  assert.deepEqual(c, { token: 't', locationId: 'L', fieldMap: {} });
});

test('ghl: only mapped custom fields are sent, never guessed', () => {
  const body = buildUpsertBody(
    {
      firstName: 'A',
      email: 'a@b.co',
      tags: ['t'],
      source: 's',
      fields: { business_type: 'Retail', unknown: 'x', utm_source: '' },
    },
    { token: 't', locationId: 'L', fieldMap: { business_type: 'CF1', utm_source: 'CF2' } }
  );
  assert.deepEqual(body.customFields, [{ id: 'CF1', field_value: 'Retail' }]);
  assert.equal(body.locationId, 'L');
});

test('ghl: upsert sends token server-side to the v2 endpoint and throws on error', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const ok = (async (url: string, init: RequestInit) => (
    calls.push({ url, init }), new Response('{"contact":{"id":"C1"}}', { status: 200 })
  )) as unknown as typeof fetch;
  const cfg = { token: 'secret', locationId: 'L', fieldMap: {} };
  assert.equal(await upsertGhlContact({ firstName: 'A', email: 'a@b.co', tags: [], source: 's' }, cfg, ok), 'C1');
  assert.equal(calls[0].url, 'https://services.leadconnectorhq.com/contacts/upsert');
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer secret');
  const bad = (async () => new Response('nope', { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(
    upsertGhlContact({ firstName: 'A', email: 'a@b.co', tags: [], source: 's' }, cfg, bad),
    /GHL 401/
  );
});
