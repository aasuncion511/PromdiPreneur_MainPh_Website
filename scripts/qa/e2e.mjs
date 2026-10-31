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
  '/work',
  '/products',
  '/about',
  '/resources',
  '/resources/free-ebook',
  '/discovery',
  '/contact',
  '/privacy',
  '/terms',
  '/thank-you',
  '/resources/free-ebook/thank-you',
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
    // redirect: 'manual' so a link that only works via a redirect (stale path) is flagged too
    const r = await fetch(BASE + href, { redirect: 'manual' });
    if (r.status !== 200) broken.push(`${href}=${r.status}`);
  }
  check(
    `links: all ${internal.size} internal link targets return 200 directly (no stale redirected paths)`,
    broken.length === 0,
    broken.join(' ')
  );

  // 404 page: real status, and every link has visible text (catches undefined labels)
  const r404 = await page.goto(BASE + '/this-page-does-not-exist');
  const empty404 = await page.$$eval('main a', (as) => as.filter((a) => !a.textContent.trim()).length);
  check(
    '404: returns 404 with working, labelled links',
    r404.status() === 404 && empty404 === 0 && (await page.locator('main a').count()) === 3
  );

  // Navigation
  await page.goto(BASE + '/');
  const navLinks = await page
    .locator('nav[aria-label=Main] a')
    .evaluateAll((as) => as.map((a) => `${a.textContent.trim()}=${a.getAttribute('href')}`));
  check(
    'nav (v2): Solutions, Results, Pricing, Store → homepage anchors',
    JSON.stringify(navLinks) ===
      JSON.stringify(['Solutions=/#solutions', 'Results=/#results', 'Pricing=/#pricing', 'Store=/#store'])
  );
  check(
    'nav: header CTA "Free Discovery Call" → /discovery',
    (await page.locator('header a[data-placement=header]').getAttribute('href')) === '/discovery' &&
      (await page.locator('header a[data-placement=header]').innerText()).includes('Free Discovery Call')
  );

  // Brand + content rules on the rendered homepage
  const body = await page.locator('body').innerText();
  check(
    'brand: role "Business Systems & Automation Implementer" shown, no retired terms',
    (await page.content()).includes('Business Systems &amp; Automation Implementer') &&
      !/\bBASA\b|Solutions Architect/i.test(body)
  );
  check(
    'home: v2 hero (H1, Discovery CTA → /discovery, Messenger → m.me)',
    (await page.locator('h1').innerText()).includes('Kulang ka sa sistema.') &&
      (await page
        .locator('section a[data-placement=hero]', { hasText: 'Book a Free Discovery Call' })
        .getAttribute('href')) === '/discovery' &&
      (await page.locator('a[data-dest=messenger][data-placement=hero]').getAttribute('href')) ===
        'https://m.me/Promdipreneur'
  );
  check(
    'home: pricing shows 5 packages with exact §3.9 prices; GROW marked most popular; cost box says Metro Manila',
    JSON.stringify(
      await page.locator('#pricing ul > li').evaluateAll((lis) => lis.map((l) => l.innerText.replace(/\s+/g, ' ')))
    ).match(
      /₱2,800.*₱7,500.*₱3,500.*₱15,000.*₱3,500.*₱15,000.*MOST POPULAR.*₱8,000.*₱25,000.*from ₱10,000.*from ₱35,000/
    ) !== null && (await page.locator('#pricing').innerText()).includes('sa Metro Manila?')
  );
  check(
    'home: DIY strip → payroll, kits (tracked outbound) and the free ebook page',
    (await page.locator('#store a[data-dest=payroll]').getAttribute('href')) === 'https://payroll.promdipreneur.com/' &&
      (await page.locator('#store a[data-dest=kits]').getAttribute('href')) === 'https://kits.promdipreneur.com/' &&
      (await page.locator('#store a[data-track=ebook_cta_click]').getAttribute('href')) === '/resources/free-ebook'
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
    shop: 'https://shop.promdipreneur.com/products-list',
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
  await page.goto(BASE + '/work');
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
    'contact: discovery block links to /discovery (no invented calendar URL)',
    (await page.locator('#discovery a').getAttribute('href')) === '/discovery'
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

// ---------------------------------------------------------------- free ebook: real asset, inactive, honest
{
  clear();
  await mode('guide=inactive&reset=1');
  const { ctx, page } = await open({ width: 390, height: 844 }, { isMobile: true, hasTouch: true });
  await page.goto(BASE + '/resources/free-ebook');
  check(
    'ebook page: addendum H1 + exact title + real cover image loads',
    (await page.locator('h1').innerText()) === 'Opening a Business? Start with These 109 Practical Checks.' &&
      (await page.locator('main').innerText()).includes('The Business Opening Checklist PH') &&
      (await page
        .locator('img[alt*="Cover of the free ebook"]')
        .first()
        .evaluate((i) => i.complete && i.naturalWidth > 0))
  );
  const inside = await page.locator('#inside').innerText();
  check(
    'ebook page: all 7 stages listed by name',
    (await page.locator('#inside ol li').count()) === 7 &&
      [
        'Before You Register',
        'Navigate Business Registration',
        'Before You Rent',
        'Capital & Logistics',
        'Before You Hire',
        'Before You Sell',
        'Before You Spend Your First Peso',
      ].every((t) => inside.includes(t))
  );
  check(
    'ebook page: legal/compliance trust note present',
    (await page.locator('main').innerText()).includes('not legal, accounting or compliance advice')
  );
  check(
    'ebook form: First name, Email, Business type; marketing checkbox optional and NOT pre-checked',
    (await page.locator('#e-firstName, #e-email, #e-businessType').count()) === 3 &&
      !(await page.locator('input[name=marketingConsent]').isChecked()) &&
      !(await page.locator('input[name=marketingConsent]').getAttribute('required'))
  );
  check(
    'ebook form INACTIVE: says nothing is collected; every control disabled',
    (await page.locator('#pp-ebook').innerText()).includes('Nothing is collected or sent from this form yet') &&
      (await page.locator('#pp-ebook input:enabled, #pp-ebook select:enabled, #pp-ebook button:enabled').count()) === 0
  );
  check(
    'ebook: no PDF/download link anywhere while inactive (no fake download)',
    (await page.locator('a[href$=".pdf"], a[download]').count()) === 0
  );
  check(
    'ebook: secondary CTA → What We Do',
    (await page
      .locator('a', { hasText: 'Explore What PromdiPreneur Can Build for My Business' })
      .getAttribute('href')) === '/services'
  );
  await page.screenshot({ path: join(out, 'ebook-mobile.png'), fullPage: false });
  const api = await fetch(`${BASE}/api/guide-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'A', email: 'a@b.co', businessType: 'Other' }),
  });
  check(
    'ebook API: inactive → 503, nothing sent to GHL',
    api.status === 503 && (await api.json()).error === 'inactive' && read('ghl').length === 0
  );
  const pdf = await fetch(BASE + '/resources/promdipreneur-business-opening-checklist-ph.pdf', { redirect: 'manual' });
  check('ebook PDF: in the repo but NOT published while the ebook is inactive (no early download)', pdf.status === 404);
  await page.goto(BASE + '/resources/free-ebook/thank-you');
  const ty = await page.locator('main').innerText();
  check(
    'ebook thank-you while inactive: says nothing was sent; no "check your email", no download',
    ty.includes('Nothing has been sent') &&
      !/check your email/i.test(ty) &&
      (await page.locator('a[href$=".pdf"]').count()) === 0
  );
  await page.goto(BASE + '/resources');
  check(
    'resources: features the ebook with its real title → ebook page',
    (await page.locator('main h2').first().innerText()) === 'The Business Opening Checklist PH' &&
      (await page.locator('main a', { hasText: 'Get Free Guide' }).getAttribute('href')) === '/resources/free-ebook'
  );
  for (const [from, to] of [
    ['/free-guide', '/resources/free-ebook'],
    ['/our-work', '/work'],
  ]) {
    const r = await fetch(BASE + from, { redirect: 'manual' });
    check(
      `redirect: ${from} → ${to} (relative 301, never to the live domain)`,
      r.status === 301 && r.headers.get('location') === to
    );
  }
  await mode('guide=active&reset=1');
  const post = (b) =>
    fetch(`${BASE}/api/guide-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b),
    });
  const ok = await post({
    firstName: 'Ana',
    email: 'ana@example.com',
    businessType: 'Water refilling station',
    source: { utm_source: 'facebook' },
  });
  const g = read('ghl')[0];
  check(
    'ebook API (when activated): one GHL upsert, tag "LM | Ebook", business type, marketing_consent=no by default',
    ok.status === 200 &&
      read('ghl').length === 1 &&
      g?.tags?.length === 1 &&
      g.tags[0] === 'LM | Ebook' &&
      g.fields?.business_type === 'Water refilling station' &&
      g.fields?.marketing_consent === 'no'
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
    'mobile menu: opens with aria-expanded, lists Solutions/Results/Pricing/Store + Discovery CTA',
    (await page.locator('#pp-menu-toggle').getAttribute('aria-expanded')) === 'true' &&
      (await page.locator('#pp-mobile-nav a', { hasText: 'Pricing' }).isVisible()) &&
      (await page.locator('#pp-mobile-nav a[data-placement=mobile_nav]').getAttribute('href')) === '/discovery'
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
  for (const path of [
    '/',
    '/services',
    '/work',
    '/products',
    '/about',
    '/resources/free-ebook',
    '/discovery',
    '/contact',
  ]) {
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
