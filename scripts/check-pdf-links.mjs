// Lists every web link embedded in the ebook PDF and checks each destination answers (Final Ebook Addendum §6).
// It reports; it never rewrites the PDF. QR codes are images, so their targets must be listed by hand in
// docs/EBOOK.md and checked the same way (pass them as extra arguments).
//   node scripts/check-pdf-links.mjs [path/to.pdf] [extra-url ...]
import { existsSync, readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const pdfPath = process.argv[2] || 'public/resources/promdipreneur-business-opening-checklist-ph.pdf';
if (!existsSync(pdfPath)) {
  console.error(`No PDF at ${pdfPath}. Place the approved file there first (docs/EBOOK.md).`);
  process.exit(2);
}
const buf = readFileSync(pdfPath);
const text = [buf.toString('latin1')];
// Link annotations may sit inside compressed object streams: inflate every FlateDecode stream and search those too.
const raw = buf.toString('latin1');
for (const m of raw.matchAll(/stream\r?\n/g)) {
  const start = m.index + m[0].length;
  const end = raw.indexOf('endstream', start);
  if (end < 0) continue;
  try {
    text.push(inflateSync(buf.subarray(start, end)).toString('latin1'));
  } catch {
    /* not a Flate stream (images, fonts): skip */
  }
}
const urls = new Set(process.argv.slice(3));
for (const t of text) for (const m of t.matchAll(/\/URI\s*\(([^)]+)\)/g)) urls.add(m[1].replace(/\\([()\\])/g, '$1'));

let bad = 0;
for (const u of [...urls].sort()) {
  if (!/^https?:/i.test(u)) {
    console.log(`SKIP  ${u} (not a web link)`);
    continue;
  }
  try {
    const r = await fetch(u, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000) });
    const ok = r.status < 400;
    if (!ok) bad++;
    console.log(`${ok ? 'OK  ' : 'FAIL'}  ${r.status}  ${u}${r.url !== u ? `  → ${r.url}` : ''}`);
  } catch (e) {
    bad++;
    console.log(`FAIL  ---  ${u}  (${e.cause?.code || e.message})`);
  }
}
console.log(`\n${urls.size} link(s) found, ${bad} problem(s). Flag problems to Allan; do not silently edit the PDF.`);
process.exit(bad ? 1 : 0);
