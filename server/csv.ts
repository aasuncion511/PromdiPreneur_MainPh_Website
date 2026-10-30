import type { InquiryRecord } from './inquiry-core.ts';

const COLUMNS: [string, (r: InquiryRecord) => string | undefined][] = [
  ['received_at', (r) => r.receivedAt],
  ['status', (r) => r.status],
  ['name', (r) => r.name],
  ['email', (r) => r.email],
  ['business_name', (r) => r.businessName],
  ['reply_preference', (r) => r.replyPreference],
  ['message', (r) => r.message],
  ['utm_source', (r) => r.source.utm_source],
  ['utm_medium', (r) => r.source.utm_medium],
  ['utm_campaign', (r) => r.source.utm_campaign],
  ['utm_content', (r) => r.source.utm_content],
  ['utm_term', (r) => r.source.utm_term],
  ['landing_page', (r) => r.source.landingPage],
  ['referrer', (r) => r.source.referrer],
  ['id', (r) => r.id],
];

/** Quotes every cell and neutralises spreadsheet formulas (=, +, -, @) so opening the file in Sheets/Excel is safe. */
function cell(v: string | undefined) {
  let s = v ?? '';
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(records: InquiryRecord[]) {
  const head = COLUMNS.map(([h]) => h).join(',');
  const rows = records.map((r) => COLUMNS.map(([, get]) => cell(get(r))).join(','));
  return '﻿' + [head, ...rows].join('\r\n') + '\r\n';
}
