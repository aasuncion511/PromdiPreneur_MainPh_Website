/**
 * GoHighLevel (LeadConnector API v2) contact upsert. Server-side only: the private integration token never
 * reaches the browser. Used for (a) best-effort CRM sync of contact inquiries and (b) free-guide requests, where
 * GHL is the delivery system (a GHL workflow triggered by the tag sends the guide — the website never sends files).
 *
 * Env: GHL_PRIVATE_TOKEN (Private Integration token; scopes contacts.write + locations/customFields.readonly),
 * GHL_LOCATION_ID (sub-account id, set in netlify.toml), optional GHL_CUSTOM_FIELDS = JSON map of logical field ->
 * GHL custom field id. When GHL_CUSTOM_FIELDS is not set, field ids are looked up ONCE by key from the sub-account
 * (custom field named "Business Type" has key contact.business_type, etc.). Fields that don't exist in GHL are
 * skipped — never guessed, never created. Existing workflows are not touched by this code.
 */

export type GhlContact = {
  firstName: string;
  email: string;
  companyName?: string;
  tags: string[];
  source: string;
  /** Logical fields; sent only if mapped in GHL_CUSTOM_FIELDS. */
  fields?: Record<string, string | undefined>;
};

export type GhlConfig = { token: string; locationId: string; fieldMap: Record<string, string> };

export function ghlConfigFromEnv(env: Record<string, string | undefined>): GhlConfig | null {
  const token = env.GHL_PRIVATE_TOKEN || '';
  const locationId = env.GHL_LOCATION_ID || '';
  if (!token || !locationId) return null;
  let fieldMap: Record<string, string> = {};
  try {
    fieldMap = env.GHL_CUSTOM_FIELDS ? JSON.parse(env.GHL_CUSTOM_FIELDS) : {};
  } catch {
    fieldMap = {};
  }
  return { token, locationId, fieldMap };
}

export function buildUpsertBody(c: GhlContact, cfg: GhlConfig) {
  const customFields = Object.entries(c.fields ?? {})
    .filter(([k, v]) => v && cfg.fieldMap[k])
    .map(([k, v]) => ({ id: cfg.fieldMap[k], field_value: v }));
  return {
    locationId: cfg.locationId,
    firstName: c.firstName,
    email: c.email,
    ...(c.companyName ? { companyName: c.companyName } : {}),
    tags: c.tags,
    source: c.source,
    ...(customFields.length ? { customFields } : {}),
  };
}

/** Logical fields the site can send. A GHL custom field matches when its key is `contact.<logical name>`. */
export const LOGICAL_FIELDS = [
  'business_type',
  'lead_magnet_name',
  'marketing_consent',
  'consent_record',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'landing_page',
  'referrer',
] as const;

let cachedMap: { locationId: string; map: Record<string, string> } | null = null;

/** Explicit GHL_CUSTOM_FIELDS wins; otherwise read the sub-account's custom fields once and match by key. */
export async function resolveFieldMap(
  cfg: GhlConfig,
  fetchImpl: typeof fetch = fetch
): Promise<Record<string, string>> {
  if (Object.keys(cfg.fieldMap).length) return cfg.fieldMap;
  if (cachedMap?.locationId === cfg.locationId) return cachedMap.map;
  try {
    const res = await fetchImpl(
      `https://services.leadconnectorhq.com/locations/${encodeURIComponent(cfg.locationId)}/customFields?model=contact`,
      {
        headers: { Authorization: `Bearer ${cfg.token}`, Version: '2021-07-28', Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) throw new Error(`GHL customFields ${res.status}`);
    const data = (await res.json()) as { customFields?: { id: string; fieldKey?: string }[] };
    const map: Record<string, string> = {};
    for (const f of data.customFields ?? []) {
      const key = (f.fieldKey || '').replace(/^contact\./, '');
      if ((LOGICAL_FIELDS as readonly string[]).includes(key)) map[key] = f.id;
    }
    cachedMap = { locationId: cfg.locationId, map };
    return map;
  } catch (err) {
    // Contact + tag still go through (delivery is triggered by the tag); only the extra fields are skipped.
    console.warn('GHL custom field lookup failed; sending contact without custom fields', err);
    return {};
  }
}

/** Test hook. */
export function resetFieldMapCache() {
  cachedMap = null;
}

/** Upsert = GHL de-duplicates by email per location, so repeat submissions update one contact (idempotent). */
export async function upsertGhlContact(
  c: GhlContact,
  cfg: GhlConfig,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const res = await fetchImpl('https://services.leadconnectorhq.com/contacts/upsert', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(buildUpsertBody(c, { ...cfg, fieldMap: await resolveFieldMap(cfg, fetchImpl) })),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GHL ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json().catch(() => ({}))) as { contact?: { id?: string } };
  return data.contact?.id ?? 'unknown';
}
