// Local QA server: serves dist/ like Netlify and runs the REAL server pipelines with local stand-ins:
//   /api/inquiry        server/inquiry-core.ts  (file storage in .local-data/, captured emails, fake CRM sync)
//   /api/guide-request  server/guide.ts         (inactive unless GUIDE_MODE=active; GHL upsert captured to .local-data/ghl/)
//   MAIL_MODE=capture|fail|unconfigured   GUIDE_MODE=inactive|active   (switch at runtime via /__qa/mode?mail=..&guide=..&reset=1)
// Usage: PORT=4321 node scripts/local-server.mjs
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { handleInquiry } from '../server/inquiry-core.ts';
import { handleGuideRequest } from '../server/guide.ts';
import { handleAsk } from '../server/ask-core.ts';
import { handleAskContact } from '../server/ask-contact.ts';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const data = join(root, '.local-data');
const port = Number(process.env.PORT || 4321);
let mailMode = process.env.MAIL_MODE || 'capture';
let guideMode = process.env.GUIDE_MODE || 'inactive';
// ASK_MODE=mock (simulated AI) | inactive | fail (AI down) | budget (cap reached). Real OpenAI is never called here.
let askMode = process.env.ASK_MODE || 'mock';
const askSpend = new Map();
const askCounts = [];
for (const d of ['inquiries', 'outbox', 'ghl']) mkdirSync(join(data, d), { recursive: true });
const hits = new Map();
const hit = async (k) => {
  const n = (hits.get(k) || 0) + 1;
  hits.set(k, n);
  return n;
};
const hashIp = async (ip) => createHash('sha256').update(`local|${ip}`).digest('hex').slice(0, 24);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.json': 'application/json',
};
const ghlCapture = async (c) => {
  writeFileSync(join(data, 'ghl', `${Date.now()}.json`), JSON.stringify(c, null, 2));
  return 'local-contact';
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/__qa/mode') {
    mailMode = url.searchParams.get('mail') || mailMode;
    guideMode = url.searchParams.get('guide') || guideMode;
    askMode = url.searchParams.get('ask') || askMode;
    if (url.searchParams.has('reset')) {
      hits.clear();
      askSpend.clear();
      askCounts.length = 0;
    }
    return send(res, 200, { mailMode, guideMode, askMode, askCounts });
  }
  if (url.pathname === '/api/ask' || url.pathname === '/api/ask-contact') {
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method_not_allowed' });
    let raw = '';
    for await (const c of req) raw += c;
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return send(res, 400, { ok: false, error: 'bad_json' });
    }
    const ip = String(req.headers['x-test-ip'] || req.socket.remoteAddress || '');
    if (url.pathname === '/api/ask-contact') {
      const r = await handleAskContact(body, ip, {
        configured: mailMode !== 'unconfigured',
        notifyTo: 'admin@promdipreneur.com',
        store: {
          put: async (rec) => writeFileSync(join(data, 'inquiries', `${rec.id}.json`), JSON.stringify(rec, null, 2)),
        },
        rateLimit: { hit },
        hashIp,
        mailer: {
          send: async (m) => {
            if (mailMode === 'fail') throw new Error('Simulated mail provider outage');
            writeFileSync(join(data, 'outbox', `${Date.now()}.json`), JSON.stringify(m, null, 2));
          },
        },
        onSubmitted: async () => void askCounts.push('contacts'),
      });
      return send(res, r.status, r.body);
    }
    const r = await handleAsk(body, ip, {
      active: askMode !== 'inactive',
      callModel: async (m) => {
        if (askMode === 'fail') throw new Error('Simulated OpenAI outage');
        await new Promise((ok) => setTimeout(ok, 300));
        const q = m.input.at(-1).content;
        return {
          text: `Good question. Here is a simple way to start:\n\n1. Write down your **current process**.\n2. Fix one leak first.\n- Check the [free guide](/resources/free-ebook)\n- Official info: [BIR](https://www.bir.gov.ph/)\n- Bad: [x](https://evil.example/) <b>html</b>\n\n(Simulated answer to: ${q.slice(0, 60)})`,
          inputTokens: 1500,
          outputTokens: 250,
        };
      },
      spend: {
        get: async (k) => (askMode === 'budget' ? 999 : askSpend.get(k) || 0),
        add: async (k, v) => (askSpend.set(k, (askSpend.get(k) || 0) + v), askSpend.get(k)),
      },
      counters: { incr: async (_d, f) => void askCounts.push(f) },
      rateLimit: { hit },
      sessionHits: { hit },
      hashIp,
      caps: { dailyUsd: 1, monthlyUsd: 10, perHour: 30, perSessionPerDay: 20, priceInPer1M: 2, priceOutPer1M: 8 },
    });
    return send(res, r.status, r.body);
  }
  if (url.pathname === '/api/inquiry' || url.pathname === '/api/guide-request') {
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method_not_allowed' });
    let raw = '';
    for await (const c of req) raw += c;
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return send(res, 400, { ok: false, error: 'bad_json' });
    }
    const ip = String(req.headers['x-test-ip'] || req.socket.remoteAddress || '');
    if (url.pathname === '/api/guide-request') {
      const r = await handleGuideRequest(body, ip, {
        active: guideMode === 'active',
        upsert: ghlCapture,
        rateLimit: { hit },
        hashIp,
      });
      return send(res, r.status, r.body);
    }
    const r = await handleInquiry(body, ip, req.headers['user-agent'] || '', {
      configured: mailMode !== 'unconfigured',
      notifyTo: 'admin@promdipreneur.com',
      store: {
        put: async (rec) => writeFileSync(join(data, 'inquiries', `${rec.id}.json`), JSON.stringify(rec, null, 2)),
      },
      rateLimit: { hit },
      hashIp,
      crm: { sync: async (rec) => void (await ghlCapture({ inquiry: rec.id, email: rec.email })) },
      mailer: {
        send: async (m) => {
          if (mailMode === 'fail') throw new Error('Simulated mail provider outage');
          writeFileSync(join(data, 'outbox', `${Date.now()}.json`), JSON.stringify(m, null, 2));
        },
      },
    });
    return send(res, r.status, r.body);
  }
  // Honor dist/_redirects like Netlify does.
  const rules = existsSync(join(dist, '_redirects'))
    ? readFileSync(join(dist, '_redirects'), 'utf8')
        .split('\n')
        .map((l) => l.trim().split(/\s+/))
        .filter((r) => r.length >= 2)
    : [];
  const rule = rules.find(([from]) => from === url.pathname);
  if (rule) {
    res.writeHead(Number(rule[2] || 301), { Location: rule[1] + url.search });
    return res.end();
  }
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(dist, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  else if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  let status = 200;
  if (!file.startsWith(dist) || !existsSync(file)) {
    file = join(dist, '404.html');
    status = 404;
  }
  const type = types[extname(file)] || 'application/octet-stream';
  const headers = {
    'Content-Type': type,
    'Cache-Control': path.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  };
  let body = readFileSync(file);
  if (/text|javascript|json|xml|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) {
    body = gzipSync(body);
    headers['Content-Encoding'] = 'gzip';
  }
  res.writeHead(status, headers);
  res.end(body);
}).listen(port, () => console.log(`QA server http://localhost:${port} mail=${mailMode} guide=${guideMode}`));

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
