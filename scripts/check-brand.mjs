// Release guard: fails if retired branding, ₱ prices, AstroWind demo content or a fake ebook download appear in
// customer-facing output; checks preview builds are not indexable. Run after a build: npm run check:brand
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const RULES = [
  [
    'retired brand terms',
    [/\bBASA\b/i, /Business Automation Solutions? Architect/i, /Business Automation Systems Architect/i],
  ],
  ['prices on the hub', [/₱\s?\d/, /\bPHP\s?\d/]],
  [
    'AstroWind demo content',
    [/AstroWind/, /onwidget/i, /8D46E7/i, /Lorem ipsum/i, /pixabay/i, /Tailwind CSS template/i],
  ],
  ['fake ebook download', [/href="[^"]*\.pdf"/i, /download="/i]],
];
const TEXT = new Set(['.html', '.js', '.css', '.txt', '.xml', '.astro', '.ts', '.md', '.mjs']);
const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : TEXT.has(extname(p)) ? [p] : [];
  });

let failed = false;
for (const dir of ['dist', 'src']) {
  const files = walk(join(root, dir));
  for (const [label, res] of RULES) {
    const hits = [];
    for (const f of files)
      readFileSync(f, 'utf8')
        .split('\n')
        .forEach(
          (line, i) =>
            res.some((r) => r.test(line)) && hits.push(`${relative(root, f)}:${i + 1}: ${line.trim().slice(0, 110)}`)
        );
    console.log(`${hits.length ? 'FAIL' : 'PASS'}  ${dir}/: ${label} (${hits.length})`);
    hits.slice(0, 15).forEach((h) => console.log('      ' + h));
    if (hits.length) failed = true;
  }
}

const pages = walk(join(root, 'dist')).filter((f) => f.endsWith('.html'));
const robots = readFileSync(join(root, 'dist/robots.txt'), 'utf8');
const headers = readFileSync(join(root, 'dist/_headers'), 'utf8');
const preview = readFileSync(join(root, 'dist/index.html'), 'utf8').includes('Preview for approval');
// The HTML minifier may reorder attributes, so match the robots meta in either order.
const noindex = (f) => /<meta (?=[^>]*name="robots")(?=[^>]*content="noindex)[^>]*>/.test(readFileSync(f, 'utf8'));
if (preview) {
  const ok =
    pages.every(noindex) && robots.includes('Disallow: /\n') && headers.includes('X-Robots-Tag: noindex, nofollow');
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  preview: noindex on all ${pages.length} pages + robots Disallow + X-Robots-Tag`
  );
  failed ||= !ok;
} else {
  const shouldNoindex = (f) => /thank-you|404/.test(f);
  const bad = pages.filter((f) => noindex(f) !== shouldNoindex(f)).map((f) => relative(root, f));
  console.log(
    `${bad.length ? 'FAIL' : 'PASS'}  production: content pages indexable, thank-you/404 noindex ${bad.join(' ')}`
  );
  failed ||= bad.length > 0;
}
process.exit(failed ? 1 : 0);
