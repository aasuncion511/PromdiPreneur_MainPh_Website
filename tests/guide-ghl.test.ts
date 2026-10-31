// Free guide endpoint + GHL adapter. Run: npm run test:api
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleGuideRequest, EBOOK_TAG, LEAD_MAGNET_NAME, type GuideDeps } from '../server/guide.ts';
import {
  buildUpsertBody,
  ghlConfigFromEnv,
  resetFieldMapCache,
  resolveFieldMap,
  upsertGhlContact,
  type GhlContact,
} from '../server/ghl.ts';

const good = {
  firstName: 'Ana',
  email: 'Ana@Example.com',
  businessType: 'Café, restaurant or food stall',
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

test('ebook: INACTIVE by default refuses and sends nothing to GHL', async () => {
  const { d, sent } = deps({ active: false });
  const r = await handleGuideRequest(good, '1.1.1.1', d);
  assert.deepEqual([r.status, r.body], [503, { ok: false, error: 'inactive' }]);
  assert.equal(sent.length, 0);
});

test('ebook: active but GHL not configured also refuses', async () => {
  const { d } = deps({ upsert: null });
  assert.equal((await handleGuideRequest(good, '1.1.1.1', d)).status, 503);
});

test('ebook: one upsert with single tag LM | Ebook, lead magnet name, business type, UTM', async () => {
  const { d, sent } = deps();
  const r = await handleGuideRequest(good, '1.1.1.1', d);
  assert.equal(r.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].email, 'ana@example.com');
  assert.deepEqual(sent[0].tags, [EBOOK_TAG]);
  assert.equal(EBOOK_TAG, 'LM | Ebook');
  assert.equal(sent[0].fields!.lead_magnet_name, LEAD_MAGNET_NAME);
  assert.equal(sent[0].fields!.business_type, 'Café, restaurant or food stall');
  assert.equal(sent[0].fields!.utm_source, 'facebook');
  assert.ok(!('opportunity' in sent[0]), 'no sales opportunity for a download');
});

test('ebook: marketing consent is optional, never assumed, and recorded with version + time', async () => {
  const { d, sent } = deps({ now: () => new Date('2026-10-31T00:00:00Z') });
  await handleGuideRequest(good, '1', d);
  await handleGuideRequest({ ...good, marketingConsent: 'true' }, '1', d);
  await handleGuideRequest({ ...good, marketingConsent: true }, '1', d);
  assert.deepEqual(
    sent.map((c) => c.fields!.marketing_consent),
    ['no', 'no', 'yes']
  );
  assert.equal(sent[2].fields!.consent_record, 'ebook-form-v1 | marketing=yes | 2026-10-31T00:00:00.000Z');
});

test('ebook: validation (business type must be from the list)', async () => {
  const { d, sent } = deps();
  const r = await handleGuideRequest({ ...good, businessType: 'Hacker', email: 'x' }, '1.1.1.1', d);
  assert.equal(r.status, 400);
  assert.equal(sent.length, 0);
  if (!r.body.ok) assert.deepEqual(Object.keys(r.body.fields!).sort(), ['businessType', 'email']);
});

test('ebook: GHL failure is reported as failure, never success', async () => {
  const { d } = deps({
    upsert: async () => {
      throw new Error('GHL 500');
    },
  });
  const r = await handleGuideRequest(good, '1.1.1.1', d);
  assert.deepEqual([r.status, r.body], [502, { ok: false, error: 'crm_failed' }]);
});

test('ebook: honeypot discarded, rate limit after 5', async () => {
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
  const ok = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response('{"contact":{"id":"C1"}}', { status: 200 });
  }) as unknown as typeof fetch;
  // explicit field map -> no lookup call
  const cfg = { token: 'secret', locationId: 'L', fieldMap: { business_type: 'CF1' } };
  assert.equal(await upsertGhlContact({ firstName: 'A', email: 'a@b.co', tags: [], source: 's' }, cfg, ok), 'C1');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://services.leadconnectorhq.com/contacts/upsert');
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer secret');
  const bad = (async () => new Response('nope', { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(
    upsertGhlContact({ firstName: 'A', email: 'a@b.co', tags: [], source: 's' }, cfg, bad),
    /GHL 401/
  );
});

test('ghl: custom field ids are looked up once by key (contact.<name>), unknown fields ignored', async () => {
  resetFieldMapCache();
  let lookups = 0;
  const bodies: Record<string, unknown>[] = [];
  const f = (async (url: string, init: RequestInit) => {
    if (url.includes('/customFields')) {
      lookups++;
      assert.ok(url.includes('/locations/9AKY7kTTUdEnC8FLOMwh/'));
      return new Response(
        JSON.stringify({
          customFields: [
            { id: 'ID_BT', fieldKey: 'contact.business_type' },
            { id: 'ID_MC', fieldKey: 'contact.marketing_consent' },
            { id: 'ID_X', fieldKey: 'contact.something_else' },
          ],
        }),
        { status: 200 }
      );
    }
    bodies.push(JSON.parse(String(init.body)));
    return new Response('{"contact":{"id":"C9"}}', { status: 200 });
  }) as unknown as typeof fetch;
  const cfg = { token: 't', locationId: '9AKY7kTTUdEnC8FLOMwh', fieldMap: {} };
  const c = {
    firstName: 'A',
    email: 'a@b.co',
    tags: ['LM | Ebook'],
    source: 's',
    fields: { business_type: 'Laundry shop', marketing_consent: 'no', utm_source: 'fb' },
  };
  await upsertGhlContact(c, cfg, f);
  await upsertGhlContact(c, cfg, f);
  assert.equal(lookups, 1, 'looked up once, then cached');
  assert.deepEqual(bodies[0].customFields, [
    { id: 'ID_BT', field_value: 'Laundry shop' },
    { id: 'ID_MC', field_value: 'no' },
  ]);
});

test('ghl: if the field lookup fails, the contact + tag still go through without custom fields', async () => {
  resetFieldMapCache();
  const bodies: Record<string, unknown>[] = [];
  const f = (async (url: string, init: RequestInit) => {
    if (url.includes('/customFields')) return new Response('forbidden', { status: 403 });
    bodies.push(JSON.parse(String(init.body)));
    return new Response('{"contact":{"id":"C2"}}', { status: 200 });
  }) as unknown as typeof fetch;
  const warn = console.warn;
  console.warn = () => {};
  try {
    const map = await resolveFieldMap({ token: 't', locationId: 'L2', fieldMap: {} }, f);
    assert.deepEqual(map, {});
    await upsertGhlContact(
      { firstName: 'A', email: 'a@b.co', tags: ['LM | Ebook'], source: 's', fields: { business_type: 'x' } },
      { token: 't', locationId: 'L2', fieldMap: {} },
      f
    );
  } finally {
    console.warn = warn;
  }
  assert.deepEqual(bodies.at(-1)!.tags, ['LM | Ebook']);
  assert.equal(bodies.at(-1)!.customFields, undefined);
});
