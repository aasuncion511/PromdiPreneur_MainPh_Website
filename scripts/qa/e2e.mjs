// End-to-end QA in real Chromium against the production build + scripts/local-server.mjs (real pipelines).
//   PUBLIC_GA4_ID=G-TEST123456 npm run build     # placeholder ID: exercises analytics, Google is never contacted
//   PORT=4321 node scripts/local-server.mjs &
//   node scripts/qa/e2e.mjs                       # PASS/FAIL lines; artifacts in scripts/out/
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = new URL('../..', import.meta.url).pathname;
const BASE = process.env.BASE || 'http://localhost:4321';
const out = join(root, 'scripts/out');
const data = join(root, '.local-data');
mkdirSync(out, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${String(detail).slice(0, 220)}` : ''}`);
};
const mode = (q) => fetch(`${BASE}/__qa/mode?${q}`).then((r) => r.json());
const clear = () =>
  ['inquiries', 'outbox', 'ghl'].forEach(
    (d) => (rmSync(join(data, d), { recursive: true, force: true }), mkdirSync(join(data, d), { recursive: true }))
  );
const read = (d) => readdirSync(join(data, d)).map((f) => JSON.parse(readFileSync(join(data, d, f), 'utf8')));
const PAGES = [
  '/',
  '/services',
  '/our-work',
  '/products',
  '/about',
  '/resources',
  '/free-guide',
  '/contact',
  '/privacy',
  '/terms',
  '/thank-you',
  '/free-guide/thank-you',
];
const PII = {
  name: 'Maria QA Santos',
  email: 'maria.qa@example.com',
  business: 'QA Bakeshop CDO',
  message: 'Our orders come from Messenger and Viber and we lose track of follow-ups every week.',
};

const browser = await chromium.launch();
async function open(viewport = { width: 1280, height: 860 }, extra = {}) {
  const ctx = await browser.newContext({ viewport, ...extra });
  const ga = [];
  await ctx.route(
    'https://www.googletagmanager.com/**',
    (r) => (ga.push(r.request().url()), r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }))
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on(
    'response',
    (r) =>
      r.url().startsWith(BASE) &&
      r.status() >= 400 &&
      !r.url().includes('/api/') &&
      errors.push(`${r.status()} ${r.url()}`)
  );
  return { ctx, page, errors, ga };
}
const events = (page) => page.evaluate(() => window.ppEventLog || []);
const consent = (page, v) => page.evaluate((v) => localStorage.setItem('pp-analytics-consent', v), v);

// ---------------------------------------------------------------- every page: loads, SEO basics, internal links
{
  const { ctx, page, errors } = await open();
  const internal = new Set();
  for (const p of PAGES) {
    errors.length = 0;
    const res = await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const h1 = await page.locator('h1').count();
    const title = await page.title();
    const desc = (await page.locator('meta[name=description]').getAttribute('content')) || '';
    const canon = await page.locator('link[rel=canonical]').getAttribute('href');
    check(
      `page ${p}: 200, one H1, title, description, canonical, no errors`,
      res.status() === 200 &&
        h1 === 1 &&
        title &&
        desc.length > 20 &&
        desc.length <= 170 &&
        canon?.startsWith('https://promdipreneur.com'),
      `h1=${h1} desc=${desc.length} ${errors.join(' ')}`
    );
    for (const href of await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))) {
      if (href.startsWith('/') && !href.startsWith('//')) internal.add(href.split('#')[0] || '/');
    }
  }
  const broken = [];
  for (const href of internal) {
    const r = await fetch(BASE + href);
    if (r.status !== 200) broken.push(`${href}=${r.status}`);
  }
  check(`links: all ${internal.size} internal link targets return 200`, broken.length === 0, broken.join(' '));

  // Navigation
  await page.goto(BASE + '/');
  const navText = await page.locator('nav[aria-label=Main]').innerText();
  check(
    'nav: Services, Our Work, Products, Resources, About',
    ['Services', 'Our Work', 'Products', 'Resources', 'About'].every((t) => navText.includes(t))
  );
  const dd = page.locator('.pp-dd__btn');
  await dd.focus();
  await page.keyboard.press('Enter');
  check(
    'nav: Resources dropdown opens by keyboard and lists "Free Business Guide"',
    (await dd.getAttribute('aria-expanded')) === 'true' &&
      (await page.locator('.pp-dd__menu a', { hasText: 'Free Business Guide' }).isVisible())
  );
  await page.keyboard.press('Escape');
  check('nav: Escape closes the dropdown', (await dd.getAttribute('aria-expanded')) === 'false');
  check(
    'nav: header CTA → /contact',
    (await page.locator('header a[data-placement=header]').getAttribute('href')) === '/contact'
  );

  // Brand + content rules on the rendered homepage
  const body = await page.locator('body').innerText();
  check(
    'brand: role "Business Systems & Automation Implementer" shown, no retired terms',
    (await page.content()).includes('Business Systems &amp; Automation Implementer') &&
      !/\bBASA\b|Solutions Architect/i.test(body)
  );
  check(
    'brand: homepage has the free guide section with a cover placeholder clearly labelled',
    (await page.locator('#free-guide').isVisible()) &&
      /cover placeholder/i.test(await page.locator('#free-guide').innerText())
  );
  check(
    'logo: keeps its 480:214 aspect ratio',
    await page
      .locator('header img')
      .first()
      .evaluate(
        (i) =>
          Math.abs(i.getBoundingClientRect().width / i.getBoundingClientRect().height - 480 / 214) < 0.04 &&
          i.naturalWidth > 0
      )
  );
  await ctx.close();
}

// ---------------------------------------------------------------- outbound destinations + UTM + analytics consent
{
  const { ctx, page, ga } = await open();
  await page.goto(`${BASE}/products?utm_source=facebook&utm_medium=paid_social&utm_campaign=qa-oct&fbclid=NOPE`);
  check(
    'analytics: consent banner appears (ID configured); nothing loaded before a choice',
    (await page.locator('#pp-consent').isVisible()) && ga.length === 0
  );
  const want = {
    shop: 'https://shop.promdipreneur.com/',
    kits: 'https://kits.promdipreneur.com/',
    payroll: 'https://payroll.promdipreneur.com/',
    payrollDemo: 'https://payroll.promdipreneur.com/payroll-demo',
  };
  for (const [dest, url] of Object.entries(want)) {
    const href = await page.locator(`a[data-dest=${dest}]`).first().getAttribute('href');
    const u = new URL(href);
    check(
      `link: ${dest} → ${url} + forwarded UTMs, no fbclid`,
      `${u.origin}${u.pathname}` === url &&
        u.searchParams.get('utm_campaign') === 'qa-oct' &&
        !u.searchParams.has('fbclid'),
      href
    );
  }
  const ext = await page.$$eval(
    'a[target=_blank]',
    (as) => as.filter((a) => !(a.rel || '').includes('noopener')).length
  );
  check('links: every new-tab link has rel=noopener', ext === 0);
  await page.locator('#pp-consent [data-consent=granted]').click();
  check(
    'analytics: gtag.js requested only after Allow',
    ga.some((u) => u.includes('id=G-TEST123456'))
  );
  for (const [dest, ev] of [
    ['shop', 'outbound_shop_click'],
    ['kits', 'outbound_cleaning_kits_click'],
    ['payroll', 'outbound_payroll_click'],
  ]) {
    const [pop] = await Promise.all([
      ctx.waitForEvent('page'),
      page.locator(`.pp-card a[data-dest=${dest}]`).first().click(),
    ]);
    await pop.close();
    const e = (await events(page)).filter((x) => x[0] === ev);
    check(
      `analytics: ${ev} with placement=products`,
      e.length === 1 && e[0][1].placement === 'products',
      JSON.stringify(e)
    );
  }
  await page.goto(BASE + '/our-work');
  const cs = await page.$$eval('a[data-event=case_study_click]', (as) => as.map((a) => a.href));
  check(
    `link: all ${cs.length} case-study links point at real portfolio work pages`,
    cs.length >= 5 && cs.every((h) => h.startsWith('https://portfolio.promdipreneur.com/work/'))
  );
  const [pop] = await Promise.all([
    ctx.waitForEvent('page'),
    page.locator('a[data-event=case_study_click]').first().click(),
  ]);
  await pop.close();
  check(
    'analytics: case_study_click fired',
    (await events(page)).some((x) => x[0] === 'case_study_click')
  );
  check(
    'links: legacy flyer and international booking widget not linked anywhere',
    !(await page.content()).includes('run.app') && !(await page.content()).includes('ireOpOYGzupk7E9wo3zy')
  );
  await ctx.close();
}

// ---------------------------------------------------------------- contact form: real pipeline
async function submitInquiry(page) {
  await page.fill('#f-name', PII.name);
  await page.fill('#f-email', PII.email);
  await page.fill('#f-businessName', PII.business);
  await page.fill('#f-message', PII.message);
  await page.check('#f-consent');
  await page.waitForTimeout(2600);
  await page.getByRole('button', { name: 'Send My Question' }).click();
}
{
  clear();
  await mode('mail=capture&guide=inactive&reset=1');
  const { ctx, page } = await open({ width: 390, height: 844 }, { isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/contact?utm_source=facebook&utm_campaign=qa-form`);
  await consent(page, 'granted');
  await page.reload();
  await page.getByRole('button', { name: 'Send My Question' }).click();
  check(
    'contact: empty submit → focused error summary, nothing sent',
    (await page.locator('#pp-inquiry-summary').isVisible()) &&
      (await page.evaluate(() => document.activeElement?.id)) === 'pp-inquiry-summary' &&
      read('inquiries').length === 0
  );
  check(
    'contact: discovery booking shows "coming soon", not a dead link',
    (await page.locator('#discovery').innerText()).includes('coming soon') &&
      (await page.locator('#discovery a').count()) === 0
  );
  await page.check('input[value=messenger]');
  check(
    'contact: Messenger choice explains the visitor starts the chat',
    await page.locator('#f-messenger-note').isVisible()
  );
  await page.check('input[value=email]');
  await Promise.all([page.waitForURL('**/thank-you'), submitInquiry(page)]);
  const recs = read('inquiries');
  const mails = read('outbox');
  check(
    'contact success: /thank-you only after record stored + email accepted',
    page.url().endsWith('/thank-you') && recs[0]?.status === 'notified' && mails.length === 1,
    recs[0]?.status
  );
  check(
    'contact success: email to admin@, reply-to visitor, subject format',
    mails[0]?.to === 'admin@promdipreneur.com' &&
      mails[0]?.replyTo === PII.email &&
      mails[0]?.subject === `[PromdiPreneur] New Business Question — ${PII.business}`
  );
  check(
    'contact success: UTM + landing page stored; CRM sync recorded',
    recs[0]?.source.utm_campaign === 'qa-form' && recs[0]?.crmStatus === 'synced' && read('ghl').length === 1
  );
  const ev = await events(page);
  await page.goto(BASE + '/contact');
  check(
    'analytics: no PII in any event payload',
    ![PII.name, PII.email, PII.business, PII.message.slice(0, 25)].some((s) => JSON.stringify(ev).includes(s))
  );
  await ctx.close();
}
for (const [label, q, txt] of [
  ['mail outage', 'mail=fail', 'didn’t go through'],
  ['form not configured', 'mail=unconfigured', 'isn’t accepting messages'],
]) {
  clear();
  await mode(`${q}&reset=1`);
  const { ctx, page } = await open();
  await page.goto(BASE + '/contact');
  await submitInquiry(page);
  await page.locator('#pp-inquiry-error').waitFor({ state: 'visible' });
  const t = await page.locator('#pp-inquiry-error').innerText();
  check(
    `${label}: stays on page, says NOT sent, offers retry + Messenger + email`,
    page.url().endsWith('/contact') &&
      t.includes('was not sent') &&
      t.includes(txt) &&
      (await page.locator('#pp-inquiry-error a').count()) === 2
  );
  if (label === 'mail outage') {
    check('mail outage: record kept as notify_failed (nothing lost)', read('inquiries')[0]?.status === 'notify_failed');
    await page.locator('#pp-inquiry').screenshot({ path: join(out, 'contact-failure-state.png') });
  }
  await ctx.close();
}
{
  clear();
  await mode('mail=capture&reset=1');
  const post = (b, ip = '198.51.100.7') =>
    fetch(`${BASE}/api/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-ip': ip },
      body: JSON.stringify(b),
    });
  const body = {
    name: 'Bot',
    email: 'bot@example.com',
    message: 'Buy cheap followers now please',
    privacyConsent: true,
    elapsedMs: 9000,
    source: { landingPage: BASE },
  };
  check(
    'spam: honeypot discarded silently',
    (await post({ ...body, pp_extra_info: 'x' })).status === 200 && read('inquiries').length === 0
  );
  check('spam: instant submission rejected (422)', (await post({ ...body, elapsedMs: 100 })).status === 422);
  const s = [];
  for (let i = 0; i < 6; i++) s.push((await post(body, '198.51.100.9')).status);
  check('rate limit: 6th submission in an hour → 429', s.join() === '200,200,200,200,200,429', s.join());
}

// ---------------------------------------------------------------- free guide: inactive, honest, ready
{
  clear();
  await mode('guide=inactive&reset=1');
  const { ctx, page } = await open({ width: 390, height: 844 }, { isMobile: true, hasTouch: true });
  await page.goto(BASE + '/free-guide');
  check(
    'guide: /free-guide shows "being finalized" and that nothing is collected',
    (await page.locator('#pp-guide').innerText()).includes('Nothing is collected or sent from this form yet')
  );
  check(
    'guide: all fields + button disabled (submission inactive)',
    (await page
      .locator('#pp-guide input:not([type=hidden]):enabled, #pp-guide select:enabled, #pp-guide button:enabled')
      .count()) === 0 && (await page.locator('#pp-guide button[type=submit]').innerText()).includes('Available soon')
  );
  check(
    'guide: form asks first name, email, business type (+ optional business name)',
    (await page.locator('#g-firstName, #g-email, #g-businessType, #g-businessName').count()) === 4
  );
  check(
    'guide: no download link or PDF anywhere on the page',
    (await page.locator('a[href$=".pdf"], a[download]').count()) === 0
  );
  check(
    'guide: cover is a clearly labelled placeholder',
    (await page.locator('[aria-label*="Placeholder for the free business guide cover"]').count()) === 1
  );
  await page.screenshot({ path: join(out, 'free-guide-mobile.png'), fullPage: false });
  const api = await fetch(`${BASE}/api/guide-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'A', email: 'a@b.co', businessType: 'Other', consent: true }),
  });
  check(
    'guide API: inactive → 503 and nothing sent to GHL',
    api.status === 503 && (await api.json()).error === 'inactive' && read('ghl').length === 0
  );
  await page.goto(BASE + '/free-guide/thank-you');
  const ty = await page.locator('main').innerText();
  check(
    'guide thank-you: while inactive it says nothing was sent (no false delivery claim)',
    ty.includes('isn’t available yet') && ty.includes('Nothing has been sent') && !/check your email/i.test(ty)
  );
  await page.goto(BASE + '/resources');
  check(
    'resources: features the Free Business Guide, marked coming soon',
    (await page.locator('main').innerText()).includes('Free Business Guide') &&
      /coming soon/i.test(await page.locator('main').innerText())
  );
  await mode('guide=active&reset=1');
  const ok = await fetch(`${BASE}/api/guide-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Ana',
      email: 'ana@example.com',
      businessType: 'Food & beverage',
      consent: true,
      source: { utm_source: 'facebook' },
    }),
  });
  const g = read('ghl')[0];
  check(
    'guide API (when activated): upserts GHL contact with tag lead-magnet:free-guide + business type',
    ok.status === 200 && g?.tags?.includes('lead-magnet:free-guide') && g?.fields?.business_type === 'Food & beverage'
  );
  await mode('guide=inactive&reset=1');
  await ctx.close();
}

// ---------------------------------------------------------------- mobile, keyboard, responsive, accessibility
{
  const { ctx, page } = await open({ width: 390, height: 844 }, { isMobile: true, hasTouch: true });
  await page.goto(BASE + '/');
  await consent(page, 'denied');
  await page.reload();
  await page.screenshot({ path: join(out, 'mobile-home-hero.png') });
  check(
    'mobile: H1 and an "Ask a Question" CTA visible on the first screen',
    await page.evaluate(() => {
      const h = document.querySelector('h1').getBoundingClientRect();
      const c = document.querySelector('header a[data-placement=header]').getBoundingClientRect();
      return h.bottom <= innerHeight && c.width > 0 && c.bottom <= innerHeight;
    })
  );
  await page.keyboard.press('Tab');
  check(
    'keyboard: first Tab = "Skip to content"',
    (await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Skip to content'
  );
  await page.locator('#pp-menu-toggle').click();
  check(
    'mobile menu: opens with aria-expanded, includes Free Business Guide',
    (await page.locator('#pp-menu-toggle').getAttribute('aria-expanded')) === 'true' &&
      (await page.locator('#pp-mobile-nav a', { hasText: 'Free Business Guide' }).isVisible())
  );
  await page.screenshot({ path: join(out, 'mobile-menu-open.png') });
  await page.keyboard.press('Escape');
  check(
    'mobile menu: Escape closes and returns focus to toggle',
    (await page.locator('#pp-mobile-nav').isHidden()) &&
      (await page.evaluate(() => document.activeElement?.id)) === 'pp-menu-toggle'
  );
  await ctx.close();

  const widths = [320, 360, 390, 768, 1024, 1280, 1440, 1920];
  const overflow = [];
  for (const w of widths) {
    const c = await browser.newContext({ viewport: { width: w, height: 900 } });
    const p = await c.newPage();
    for (const path of PAGES) {
      await p.goto(BASE + path);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      if (sw > w) overflow.push(`${path}@${w}=${sw}`);
    }
    await c.close();
  }
  check(
    `responsive: no horizontal scroll on ${PAGES.length} pages at ${widths.join('/')}px`,
    overflow.length === 0,
    overflow.join(' ')
  );

  const axe = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  for (const vp of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const bad = [];
    const c = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
    const p = await c.newPage();
    await p.goto(BASE + '/');
    await consent(p, 'denied');
    for (const path of PAGES) {
      await p.goto(BASE + path);
      await p.addScriptTag({ content: axe });
      const r = await p.evaluate(() =>
        window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] })
      );
      r.violations.forEach((v) => bad.push(`${path}:${v.id}(${v.impact})x${v.nodes.length} ${v.nodes[0]?.target}`));
    }
    check(`a11y (axe WCAG 2.2 AA + best practice) on all pages @${vp.width}px`, bad.length === 0, bad.join(' | '));
    await c.close();
  }
}

// ---------------------------------------------------------------- screenshots for review
{
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(BASE + '/');
  await consent(p, 'denied');
  for (const path of ['/', '/services', '/our-work', '/products', '/about', '/free-guide', '/contact']) {
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager')));
    await p.waitForTimeout(500);
    await p.screenshot({
      path: join(out, `desktop${path === '/' ? '-home' : path.replace(/\//g, '-')}.png`),
      fullPage: true,
    });
  }
  await c.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
writeFileSync(
  join(out, 'qa-results.json'),
  JSON.stringify(
    {
      base: BASE,
      ranAt: new Date().toISOString(),
      passed: results.length - failed.length,
      failed: failed.length,
      results,
    },
    null,
    2
  )
);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
