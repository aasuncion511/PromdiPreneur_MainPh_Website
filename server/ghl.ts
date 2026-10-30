/**
 * GoHighLevel (LeadConnector API v2) contact upsert. Server-side only: the private integration token never
 * reaches the browser. Used for (a) best-effort CRM sync of contact inquiries and (b) free-guide requests, where
 * GHL is the delivery system (a GHL workflow triggered by the tag sends the guide — the website never sends files).
 *
 * Env: GHL_PRIVATE_TOKEN (Private Integration token, scope contacts.write), GHL_LOCATION_ID,
 * optional GHL_CUSTOM_FIELDS = JSON map of logical field -> GHL custom field id, e.g.
 *   {"business_type":"abc123","lead_magnet":"def456","utm_source":"..."}
 * Unmapped logical fields are skipped (never guessed). Existing workflows are not touched by this code.
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
    body: JSON.stringify(buildUpsertBody(c, cfg)),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GHL ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json().catch(() => ({}))) as { contact?: { id?: string } };
  return data.contact?.id ?? 'unknown';
}
