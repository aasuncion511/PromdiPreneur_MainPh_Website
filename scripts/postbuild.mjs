// Writes dist/robots.txt and dist/_headers (Netlify). Preview builds (PUBLIC_PREVIEW=1) are blocked from indexing
// three ways: noindex meta (PageLayout), robots.txt Disallow, and an X-Robots-Tag header.
import { writeFileSync } from 'node:fs';

const site = 'https://promdipreneur.com';
const preview = process.env.PUBLIC_PREVIEW === '1';
const dist = new URL('../dist/', import.meta.url);

writeFileSync(
  new URL('robots.txt', dist),
  preview
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /thank-you\nDisallow: /free-guide/thank-you\n\nSitemap: ${site}/sitemap-index.xml\n`
);

// AstroWind ships small inline scripts (scroll/menus), so script-src keeps 'unsafe-inline'; everything else is locked down.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cloud.umami.is",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.umami.is https://api-gateway.umami.dev",
  "img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  'frame-src https://api.leadconnectorhq.com https://link.msgsndr.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');
writeFileSync(
  new URL('_headers', dist),
  `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000
  X-Frame-Options: DENY
${preview ? '  X-Robots-Tag: noindex, nofollow\n' : ''}
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/thank-you
  X-Robots-Tag: noindex
/free-guide/thank-you
  X-Robots-Tag: noindex
`
);
console.log(`postbuild: robots.txt + _headers written (${preview ? 'PREVIEW: noindex' : 'production'})`);
